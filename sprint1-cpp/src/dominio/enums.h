#ifndef DOMINIO_ENUMS_H
#define DOMINIO_ENUMS_H

#include <string>

namespace dominio {

// Enumeraciones del diagrama de clases (estados de negocio)

enum class EstadoProyecto { PLANIFICACION, COTIZACION, EN_EJECUCION, PAUSADO, FINALIZADO };

// UC1 A1: el alcance se guarda como borrador antes de ser oficial
enum class EstadoAlcance { BORRADOR, OFICIAL };

enum class Rol { COORDINADOR, AUXILIAR, GERENCIA, CONTRATISTA, CLIENTE };

std::string aTexto(EstadoProyecto estado);
std::string aTexto(EstadoAlcance estado);
std::string aTexto(Rol rol);

}  // namespace dominio

#endif