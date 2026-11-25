#include "proyecto.h"

#include <utility>

#include "regla_negocio.h"

namespace dominio {

Proyecto::Proyecto(int idProyecto, std::string nombre, int idCliente)
    : idProyecto_(idProyecto),
      nombre_(std::move(nombre)),
      idCliente_(idCliente),
      estado_(EstadoProyecto::PLANIFICACION) {
    if (nombre_.empty()) throw ReglaDeNegocio("El proyecto necesita un nombre");
}

int Proyecto::idProyecto() const { return idProyecto_; }
const std::string& Proyecto::nombre() const { return nombre_; }
int Proyecto::idCliente() const { return idCliente_; }
EstadoProyecto Proyecto::estado() const { return estado_; }

void Proyecto::abrirACotizacion() {
    if (estado_ != EstadoProyecto::PLANIFICACION) {
        throw ReglaDeNegocio("Solo un proyecto en planificacion puede abrirse a cotizacion");
    }
    estado_ = EstadoProyecto::COTIZACION;
}

void Proyecto::iniciarEjecucion() {
    if (estado_ != EstadoProyecto::COTIZACION) {
        throw ReglaDeNegocio("La ejecucion arranca desde la etapa de cotizacion (UC4)");
    }
    estado_ = EstadoProyecto::EN_EJECUCION;
}

}  // namespace dominio