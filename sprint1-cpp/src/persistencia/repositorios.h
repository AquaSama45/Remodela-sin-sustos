#ifndef PERSISTENCIA_REPOSITORIOS_H
#define PERSISTENCIA_REPOSITORIOS_H

#include <vector>

#include "../dominio/acuerdo_formal.h"
#include "../dominio/alcance.h"
#include "../dominio/cotizacion.h"
#include "../dominio/proyecto.h"

namespace persistencia {

// Interfaces <<repository>>.
// El dominio y los servicios dependen de estas abstracciones, no de donde se guardan
// los datos: principio D (inversion de dependencias) de SOLID. En el Sprint 1 la
// implementacion es en memoria; cambiarla por PostgreSQL no obliga a tocar el control.
// Cada interfaz expone solo lo que su agregado necesita, no un CRUD generico:
// principio I (segregacion de interfaces).

class RepositorioProyectos {
public:
    virtual ~RepositorioProyectos() = default;
    virtual int guardar(const dominio::Proyecto& proyecto) = 0;
    virtual dominio::Proyecto* buscar(int idProyecto) = 0;
    virtual std::vector<const dominio::Proyecto*> listar() const = 0;
    virtual int siguienteId() const = 0;
};

class RepositorioAlcances {
public:
    virtual ~RepositorioAlcances() = default;
    virtual int guardar(const dominio::Alcance& alcance) = 0;
    virtual dominio::Alcance* buscar(int idAlcance) = 0;
    virtual dominio::Alcance* buscarPorProyecto(int idProyecto) = 0;
    virtual int siguienteId() const = 0;
};

class RepositorioCotizaciones {
public:
    virtual ~RepositorioCotizaciones() = default;
    virtual int guardar(const dominio::Cotizacion& cotizacion) = 0;
    virtual dominio::Cotizacion* buscar(int idCotizacion) = 0;
    virtual std::vector<dominio::Cotizacion*> listarPorAlcance(int idAlcance) = 0;
    virtual int siguienteId() const = 0;
};

class RepositorioAcuerdos {
public:
    virtual ~RepositorioAcuerdos() = default;
    virtual int guardar(const dominio::AcuerdoFormal& acuerdo) = 0;
    virtual dominio::AcuerdoFormal* buscar(int idAcuerdo) = 0;
    virtual dominio::AcuerdoFormal* buscarPorCotizacion(int idCotizacion) = 0;
    virtual int siguienteId() const = 0;
};

}  // namespace persistencia

#endif