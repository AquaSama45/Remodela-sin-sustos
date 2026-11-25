#include "cotizacion.h"

#include <algorithm>
#include <cmath>
#include <utility>

#include "alcance.h"
#include "regla_negocio.h"

namespace dominio {

namespace {

// Nombre calificado "Ambiente / Partida": el alcance puede repetir el nombre de una
// partida en varios ambientes (Demolicion en cocina y en bano son dos trabajos).
std::vector<std::string> partidasRequeridas(const Alcance& alcance) {
    std::vector<std::string> requeridas;
    for (const auto& ambiente : alcance.ambientes()) {
        for (const auto& partida : ambiente.partidas()) {
            requeridas.push_back(ambiente.nombre() + " / " + partida.nombre());
        }
    }
    return requeridas;
}

}  // namespace

// ----- DetalleCotizacion -----

DetalleCotizacion::DetalleCotizacion(std::string partida, std::string unidad, double cantidad,
                               long long valorUnitario)
    : partida_(std::move(partida)),
      unidad_(std::move(unidad)),
      cantidad_(cantidad),
      valorUnitario_(valorUnitario) {
    if (partida_.empty()) throw ReglaDeNegocio("El item debe indicar la partida que cotiza");
    if (cantidad_ <= 0) throw ReglaDeNegocio("La cantidad de " + partida_ + " debe ser mayor a cero");
    if (valorUnitario_ <= 0) {
        throw ReglaDeNegocio("El valor unitario de " + partida_ + " debe ser mayor a cero");
    }
}

const std::string& DetalleCotizacion::partida() const { return partida_; }
const std::string& DetalleCotizacion::unidad() const { return unidad_; }
double DetalleCotizacion::cantidad() const { return cantidad_; }
long long DetalleCotizacion::valorUnitario() const { return valorUnitario_; }

long long DetalleCotizacion::subtotal() const {
    return std::llround(cantidad_ * static_cast<double>(valorUnitario_));
}

// ----- HitoPropuesto -----

HitoPropuesto::HitoPropuesto(std::string descripcion, int porcentaje)
    : descripcion_(std::move(descripcion)), porcentaje_(porcentaje) {
    if (descripcion_.empty()) throw ReglaDeNegocio("El hito de pago necesita una descripcion");
    if (porcentaje_ <= 0 || porcentaje_ > 100) {
        throw ReglaDeNegocio("El porcentaje del hito " + descripcion_ + " debe estar entre 1 y 100");
    }
}

const std::string& HitoPropuesto::descripcion() const { return descripcion_; }
int HitoPropuesto::porcentaje() const { return porcentaje_; }

// ----- Cotizacion -----

Cotizacion::Cotizacion(int idCotizacion, int idAlcance, int idContratista)
    : idCotizacion_(idCotizacion),
      idAlcance_(idAlcance),
      idContratista_(idContratista),
      version_(1),
      estado_(&Borrador::instancia()) {}

int Cotizacion::idCotizacion() const { return idCotizacion_; }
int Cotizacion::idAlcance() const { return idAlcance_; }
int Cotizacion::idContratista() const { return idContratista_; }
int Cotizacion::version() const { return version_; }
const std::string& Cotizacion::exclusiones() const { return exclusiones_; }
const std::string& Cotizacion::motivoRechazo() const { return motivoRechazo_; }
const std::vector<DetalleCotizacion>& Cotizacion::items() const { return items_; }
const std::vector<HitoPropuesto>& Cotizacion::hitosPropuestos() const { return hitosPropuestos_; }

std::string Cotizacion::estado() const { return estado_->nombre(); }
bool Cotizacion::editable() const { return estado_->permiteEdicion(); }
bool Cotizacion::esFinal() const { return estado_->esFinal(); }

long long Cotizacion::total() const {
    long long acumulado = 0;
    for (const auto& item : items_) acumulado += item.subtotal();
    return acumulado;
}

int Cotizacion::sumaPorcentajes() const {
    int acumulado = 0;
    for (const auto& hito : hitosPropuestos_) acumulado += hito.porcentaje();
    return acumulado;
}

void Cotizacion::exigirEdicion() const {
    if (!editable()) {
        throw ReglaDeNegocio(
            "La cotizacion ya fue enviada; para cambiar valores se crea una nueva version (UC2)");
    }
}

void Cotizacion::agregarItem(const DetalleCotizacion& item) {
    exigirEdicion();
    auto repetido = std::find_if(items_.begin(), items_.end(), [&](const DetalleCotizacion& i) {
        return i.partida() == item.partida();
    });
    if (repetido != items_.end()) {
        throw ReglaDeNegocio("La cotizacion ya tiene un item para " + item.partida());
    }
    items_.push_back(item);
}

void Cotizacion::definirExclusiones(const std::string& texto) {
    exigirEdicion();
    exclusiones_ = texto;
}

void Cotizacion::agregarHitoPropuesto(const HitoPropuesto& hito) {
    exigirEdicion();
    if (sumaPorcentajes() + hito.porcentaje() > 100) {
        throw ReglaDeNegocio("Los hitos propuestos no pueden sumar mas de 100%");
    }
    hitosPropuestos_.push_back(hito);
}

std::vector<std::string> Cotizacion::faltantesParaEnvio(const Alcance& alcance) const {
    std::vector<std::string> pendientes;

    // RF-01: solo se cotiza contra el alcance oficial del proyecto
    if (!alcance.esOficial()) {
        pendientes.push_back("El alcance todavia es borrador: debe oficializarse primero (UC1)");
        return pendientes;
    }
    if (alcance.idAlcance() != idAlcance_) {
        pendientes.push_back("La cotizacion no corresponde al alcance recibido");
        return pendientes;
    }

    // RF-03: la propuesta debe cubrir toda la estructura comun del alcance
    for (const auto& requerida : partidasRequeridas(alcance)) {
        auto cubierta = std::find_if(items_.begin(), items_.end(), [&](const DetalleCotizacion& i) {
            return i.partida() == requerida;
        });
        if (cubierta == items_.end()) {
            pendientes.push_back("Sin valor cotizado para " + requerida);
        }
    }

    // RF-03: las exclusiones son obligatorias, son lo que hace comparable la oferta
    if (exclusiones_.empty()) {
        pendientes.push_back("Las exclusiones son obligatorias y estan vacias");
    }

    // UC4: la cotizacion propone el plan de pagos y debe cubrir el 100%
    if (hitosPropuestos_.empty()) {
        pendientes.push_back("No hay hitos de pago propuestos");
    } else if (sumaPorcentajes() != 100) {
        pendientes.push_back("Los hitos propuestos suman " + std::to_string(sumaPorcentajes()) +
                             "% y deben sumar 100%");
    }

    return pendientes;
}

void Cotizacion::validarParaEnvio(const Alcance& alcance) const {
    auto pendientes = faltantesParaEnvio(alcance);
    if (pendientes.empty()) return;

    std::string detalle;
    for (const auto& pendiente : pendientes) {
        if (!detalle.empty()) detalle += "; ";
        detalle += pendiente;
    }
    throw ReglaDeNegocio("La cotizacion no puede enviarse (UC2): " + detalle);
}

// Las cuatro operaciones del ciclo de vida: la cotizacion no decide, delega en su estado
void Cotizacion::enviar(const Alcance& alcance) { estado_->enviar(*this, alcance); }
void Cotizacion::iniciarRevision() { estado_->iniciarRevision(*this); }
void Cotizacion::aceptar() { estado_->aceptar(*this); }
void Cotizacion::rechazar(const std::string& motivo) { estado_->rechazar(*this, motivo); }

Cotizacion Cotizacion::nuevaVersion(int idNuevaCotizacion) const {
    if (editable()) {
        throw ReglaDeNegocio("La cotizacion aun es borrador: editela en lugar de versionarla");
    }
    Cotizacion siguiente(idNuevaCotizacion, idAlcance_, idContratista_);
    siguiente.version_ = version_ + 1;
    siguiente.items_ = items_;
    siguiente.hitosPropuestos_ = hitosPropuestos_;
    siguiente.exclusiones_ = exclusiones_;
    return siguiente;
}

}  // namespace dominio