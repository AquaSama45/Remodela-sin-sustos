#ifndef PERSISTENCIA_REPOSITORIOS_MEMORIA_H
#define PERSISTENCIA_REPOSITORIOS_MEMORIA_H

#include <map>

#include "repositorios.h"

namespace persistencia {

// Implementaciones en memoria para el Sprint 1.
// Se usa std::map y no std::vector a proposito: los nodos del map no se mueven al
// insertar, asi que los punteros que entrega buscar() siguen siendo validos. Un
// vector los invalidaria al crecer.
// Nota: como los servicios modifican las entidades a traves del puntero de buscar(),
// el cambio ya queda "persistido". Contra una base de datos real ese mismo servicio
// tendria que llamar guardar() de nuevo, y es el unico ajuste que exigiria el cambio.

class RepositorioProyectosMemoria : public IRepositorioProyectos {
public:
    int guardar(const dominio::Proyecto& proyecto) override;
    dominio::Proyecto* buscar(int idProyecto) override;
    std::vector<const dominio::Proyecto*> listar() const override;
    int siguienteId() const override;

private:
    std::map<int, dominio::Proyecto> datos_;
};

class RepositorioAlcancesMemoria : public IRepositorioAlcances {
public:
    int guardar(const dominio::Alcance& alcance) override;
    dominio::Alcance* buscar(int idAlcance) override;
    dominio::Alcance* buscarPorProyecto(int idProyecto) override;
    int siguienteId() const override;

private:
    std::map<int, dominio::Alcance> datos_;
};

class RepositorioCotizacionesMemoria : public IRepositorioCotizaciones {
public:
    int guardar(const dominio::Cotizacion& cotizacion) override;
    dominio::Cotizacion* buscar(int idCotizacion) override;
    std::vector<dominio::Cotizacion*> listarPorAlcance(int idAlcance) override;
    int siguienteId() const override;

private:
    std::map<int, dominio::Cotizacion> datos_;
};

class RepositorioAcuerdosMemoria : public IRepositorioAcuerdos {
public:
    int guardar(const dominio::AcuerdoFormal& acuerdo) override;
    dominio::AcuerdoFormal* buscar(int idAcuerdo) override;
    dominio::AcuerdoFormal* buscarPorCotizacion(int idCotizacion) override;
    int siguienteId() const override;

private:
    std::map<int, dominio::AcuerdoFormal> datos_;
};

class RepositorioReportesMemoria : public IRepositorioReportes {
public:
    int guardar(const dominio::ReporteAvance& reporte) override;
    std::vector<const dominio::ReporteAvance*> listarPorAcuerdo(int idAcuerdo) const override;
    const dominio::ReporteAvance* ultimoDe(int idAcuerdo) const override;
    int siguienteId() const override;

private:
    std::map<int, dominio::ReporteAvance> datos_;
};

}  // namespace persistencia

#endif