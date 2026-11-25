#include "acuerdo_formal.h"

#include <algorithm>
#include <cmath>
#include <utility>

#include "cotizacion.h"
#include "regla_negocio.h"

namespace dominio {

// ----- EstadoHito: helpers y rechazos por defecto -----

void EstadoHito::transicionar(HitoDePago& hito, const EstadoHito& nuevo) {
    hito.estado_ = &nuevo;
}

void EstadoHito::anotarComprobante(HitoDePago& hito, const std::string& comprobante) {
    hito.comprobante_ = comprobante;
}

void EstadoHito::noPermitido(const std::string& operacion) const {
    throw ReglaDeNegocio("No se puede " + operacion + " un hito en estado " + nombre());
}

void EstadoHito::habilitar(HitoDePago&, int) const { noPermitido("habilitar"); }

void EstadoHito::registrarPago(HitoDePago&, const std::string&, long long) const {
    noPermitido("registrar el pago de");
}

// ----- PENDIENTE_DE_AVANCE -----

const PendienteDeAvance& PendienteDeAvance::instancia() {
    static const PendienteDeAvance unica;
    return unica;
}

void PendienteDeAvance::habilitar(HitoDePago& hito, int avanceReportado) const {
    if (avanceReportado < hito.avanceRequerido()) {
        throw ReglaDeNegocio("El hito " + hito.descripcion() + " exige " +
                             std::to_string(hito.avanceRequerido()) +
                             "% de avance y la obra reporta " + std::to_string(avanceReportado) +
                             "%");
    }
    transicionar(hito, Habilitado::instancia());
}

// ----- HABILITADO -----

const Habilitado& Habilitado::instancia() {
    static const Habilitado unica;
    return unica;
}

void Habilitado::registrarPago(HitoDePago& hito, const std::string& comprobante,
                               long long montoPagado) const {
    // RNF: todo pago queda soportado; sin comprobante no hay registro (UC8 E1)
    if (comprobante.empty()) {
        throw ReglaDeNegocio("Registrar un pago exige el numero de comprobante");
    }
    if (montoPagado != hito.monto()) {
        throw ReglaDeNegocio("El pago de " + hito.descripcion() + " debe ser por $" +
                             std::to_string(hito.monto()) + " y se intento registrar $" +
                             std::to_string(montoPagado));
    }
    anotarComprobante(hito, comprobante);
    transicionar(hito, Pagado::instancia());
}

// ----- PAGADO: terminal -----

const Pagado& Pagado::instancia() {
    static const Pagado unica;
    return unica;
}

// ----- HitoDePago -----

HitoDePago::HitoDePago(int numero, std::string descripcion, int porcentaje, long long monto,
                       int avanceRequerido)
    : numero_(numero),
      descripcion_(std::move(descripcion)),
      porcentaje_(porcentaje),
      monto_(monto),
      avanceRequerido_(avanceRequerido),
      estado_(&PendienteDeAvance::instancia()) {
    if (monto_ <= 0) throw ReglaDeNegocio("El monto del hito " + descripcion_ + " debe ser positivo");
}

int HitoDePago::numero() const { return numero_; }
const std::string& HitoDePago::descripcion() const { return descripcion_; }
int HitoDePago::porcentaje() const { return porcentaje_; }
long long HitoDePago::monto() const { return monto_; }
int HitoDePago::avanceRequerido() const { return avanceRequerido_; }
const std::string& HitoDePago::comprobante() const { return comprobante_; }

std::string HitoDePago::estado() const { return estado_->nombre(); }
bool HitoDePago::pagado() const { return estado_->esPagado(); }

void HitoDePago::habilitar(int avanceReportado) { estado_->habilitar(*this, avanceReportado); }

void HitoDePago::registrarPago(const std::string& comprobante, long long montoPagado) {
    estado_->registrarPago(*this, comprobante, montoPagado);
}

// ----- AcuerdoFormal -----

AcuerdoFormal::AcuerdoFormal(int idAcuerdo, int idCotizacion, int idCliente, int idContratista,
                             long long valorTotal, std::string exclusiones)
    : idAcuerdo_(idAcuerdo),
      idCotizacion_(idCotizacion),
      idCliente_(idCliente),
      idContratista_(idContratista),
      valorTotal_(valorTotal),
      exclusiones_(std::move(exclusiones)),
      avanceReportado_(0) {}

AcuerdoFormal AcuerdoFormal::generarDesde(int idAcuerdo, const Cotizacion& cotizacion,
                                          int idCliente) {
    // UC4: el acuerdo solo nace de una cotizacion aceptada por el cliente
    if (cotizacion.estado() != "ACEPTADA") {
        throw ReglaDeNegocio("Solo una cotizacion ACEPTADA genera acuerdo formal; esta esta en " +
                             cotizacion.estado());
    }
    const auto& propuestos = cotizacion.hitosPropuestos();
    if (propuestos.empty()) {
        throw ReglaDeNegocio("La cotizacion aceptada no trae plan de pagos");
    }

    AcuerdoFormal acuerdo(idAcuerdo, cotizacion.idCotizacion(), idCliente,
                          cotizacion.idContratista(), cotizacion.total(), cotizacion.exclusiones());

    // El plan de pagos se traduce a montos. El ultimo hito absorbe el residuo del
    // redondeo para que la suma de los hitos sea exactamente el valor del acuerdo.
    long long asignado = 0;
    int acumuladoPorcentaje = 0;
    const std::size_t ultimo = propuestos.size() - 1;

    for (std::size_t i = 0; i < propuestos.size(); ++i) {
        const auto& propuesto = propuestos[i];
        acumuladoPorcentaje += propuesto.porcentaje();

        long long monto;
        if (i == ultimo) {
            monto = acuerdo.valorTotal_ - asignado;
        } else {
            monto = std::llround(static_cast<double>(acuerdo.valorTotal_) *
                                 propuesto.porcentaje() / 100.0);
        }
        asignado += monto;

        // Regla "sin sustos": lo pagado nunca se adelanta al avance de obra, salvo el
        // anticipo. Cada hito posterior exige que la obra alcance el acumulado pagado.
        const int avanceRequerido = (i == 0) ? 0 : acumuladoPorcentaje;

        acuerdo.hitos_.emplace_back(static_cast<int>(i) + 1, propuesto.descripcion(),
                                    propuesto.porcentaje(), monto, avanceRequerido);
    }

    // El anticipo queda habilitado desde la firma (exige 0% de avance)
    for (auto& hito : acuerdo.hitos_) {
        if (hito.avanceRequerido() <= acuerdo.avanceReportado_) hito.habilitar(acuerdo.avanceReportado_);
    }

    return acuerdo;
}

int AcuerdoFormal::idAcuerdo() const { return idAcuerdo_; }
int AcuerdoFormal::idCotizacion() const { return idCotizacion_; }
int AcuerdoFormal::idCliente() const { return idCliente_; }
int AcuerdoFormal::idContratista() const { return idContratista_; }
long long AcuerdoFormal::valorTotal() const { return valorTotal_; }
const std::string& AcuerdoFormal::exclusiones() const { return exclusiones_; }
const std::vector<HitoDePago>& AcuerdoFormal::hitos() const { return hitos_; }
int AcuerdoFormal::avanceReportado() const { return avanceReportado_; }

long long AcuerdoFormal::totalPagado() const {
    long long acumulado = 0;
    for (const auto& hito : hitos_) {
        if (hito.pagado()) acumulado += hito.monto();
    }
    return acumulado;
}

long long AcuerdoFormal::saldoPendiente() const { return valorTotal_ - totalPagado(); }

bool AcuerdoFormal::liquidado() const {
    return std::all_of(hitos_.begin(), hitos_.end(),
                       [](const HitoDePago& hito) { return hito.pagado(); });
}

void AcuerdoFormal::registrarAvance(int porcentaje) {
    if (porcentaje < 0 || porcentaje > 100) {
        throw ReglaDeNegocio("El avance reportado debe estar entre 0 y 100");
    }
    if (porcentaje < avanceReportado_) {
        throw ReglaDeNegocio("El avance no puede retroceder: ya esta en " +
                             std::to_string(avanceReportado_) + "%");
    }
    avanceReportado_ = porcentaje;

    for (auto& hito : hitos_) {
        if (!hito.pagado() && hito.estado() == "PENDIENTE_DE_AVANCE" &&
            hito.avanceRequerido() <= avanceReportado_) {
            hito.habilitar(avanceReportado_);
        }
    }
}

HitoDePago& AcuerdoFormal::buscarHito(int numeroHito) {
    auto it = std::find_if(hitos_.begin(), hitos_.end(),
                           [&](const HitoDePago& hito) { return hito.numero() == numeroHito; });
    if (it == hitos_.end()) {
        throw ReglaDeNegocio("El acuerdo no tiene el hito numero " + std::to_string(numeroHito));
    }
    return *it;
}

void AcuerdoFormal::pagarHito(int numeroHito, const std::string& comprobante,
                              long long montoPagado) {
    buscarHito(numeroHito).registrarPago(comprobante, montoPagado);
}

}  // namespace dominio