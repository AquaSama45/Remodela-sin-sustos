#include "enums.h"

namespace dominio {

std::string aTexto(EstadoProyecto estado) {
    switch (estado) {
        case EstadoProyecto::PLANIFICACION: return "PLANIFICACION";
        case EstadoProyecto::COTIZACION:    return "COTIZACION";
        case EstadoProyecto::EN_EJECUCION:  return "EN_EJECUCION";
        case EstadoProyecto::PAUSADO:       return "PAUSADO";
        case EstadoProyecto::FINALIZADO:    return "FINALIZADO";
    }
    return "DESCONOCIDO";
}

std::string aTexto(EstadoAlcance estado) {
    return estado == EstadoAlcance::OFICIAL ? "OFICIAL" : "BORRADOR";
}

std::string aTexto(Rol rol) {
    switch (rol) {
        case Rol::COORDINADOR: return "Coordinador";
        case Rol::AUXILIAR:    return "Auxiliar";
        case Rol::GERENCIA:    return "Gerencia";
        case Rol::CONTRATISTA: return "Contratista";
        case Rol::CLIENTE:     return "Cliente";
    }
    return "Desconocido";
}

}  // namespace dominio