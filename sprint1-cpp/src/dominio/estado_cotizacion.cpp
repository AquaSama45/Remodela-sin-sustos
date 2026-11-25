#include "estado_cotizacion.h"

#include "alcance.h"
#include "cotizacion.h"
#include "regla_negocio.h"

namespace dominio {

// ----- Helpers de la clase base -----

void EstadoCotizacion::transicionar(Cotizacion& cotizacion, const EstadoCotizacion& nuevo) {
    cotizacion.estado_ = &nuevo;
}

void EstadoCotizacion::anotarMotivoRechazo(Cotizacion& cotizacion, const std::string& motivo) {
    if (motivo.empty()) {
        throw ReglaDeNegocio("Rechazar una cotizacion exige registrar el motivo");
    }
    cotizacion.motivoRechazo_ = motivo;
}

void EstadoCotizacion::noPermitido(const std::string& operacion) const {
    throw ReglaDeNegocio("No se puede " + operacion + " una cotizacion en estado " + nombre());
}

// ----- Transiciones por defecto: todas rechazadas -----

void EstadoCotizacion::enviar(Cotizacion&, const Alcance&) const { noPermitido("enviar"); }
void EstadoCotizacion::iniciarRevision(Cotizacion&) const { noPermitido("poner en revision"); }
void EstadoCotizacion::aceptar(Cotizacion&) const { noPermitido("aceptar"); }
void EstadoCotizacion::rechazar(Cotizacion&, const std::string&) const { noPermitido("rechazar"); }

// ----- BORRADOR -----

const Borrador& Borrador::instancia() {
    static const Borrador unica;
    return unica;
}

void Borrador::enviar(Cotizacion& cotizacion, const Alcance& alcance) const {
    // El estado autoriza la transicion; la entidad valida sus propios datos (UC2 E1)
    cotizacion.validarParaEnvio(alcance);
    transicionar(cotizacion, Enviada::instancia());
}

// ----- ENVIADA -----

const Enviada& Enviada::instancia() {
    static const Enviada unica;
    return unica;
}

void Enviada::iniciarRevision(Cotizacion& cotizacion) const {
    transicionar(cotizacion, EnRevision::instancia());
}

void Enviada::rechazar(Cotizacion& cotizacion, const std::string& motivo) const {
    anotarMotivoRechazo(cotizacion, motivo);
    transicionar(cotizacion, Rechazada::instancia());
}

// ----- EN_REVISION -----

const EnRevision& EnRevision::instancia() {
    static const EnRevision unica;
    return unica;
}

void EnRevision::aceptar(Cotizacion& cotizacion) const {
    transicionar(cotizacion, Aceptada::instancia());
}

void EnRevision::rechazar(Cotizacion& cotizacion, const std::string& motivo) const {
    anotarMotivoRechazo(cotizacion, motivo);
    transicionar(cotizacion, Rechazada::instancia());
}

// ----- ACEPTADA y RECHAZADA: terminales, heredan los rechazos por defecto -----

const Aceptada& Aceptada::instancia() {
    static const Aceptada unica;
    return unica;
}

const Rechazada& Rechazada::instancia() {
    static const Rechazada unica;
    return unica;
}

}  // namespace dominio