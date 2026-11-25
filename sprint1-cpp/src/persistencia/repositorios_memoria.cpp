#include "repositorios_memoria.h"

namespace persistencia {

namespace {

// Siguiente id disponible en un map ordenado por clave
template <typename Mapa>
int proximo(const Mapa& datos) {
    return datos.empty() ? 1 : datos.rbegin()->first + 1;
}

}  // namespace

// ----- Proyectos -----

int RepositorioProyectosMemoria::guardar(const dominio::Proyecto& proyecto) {
    datos_.insert_or_assign(proyecto.idProyecto(), proyecto);
    return proyecto.idProyecto();
}

dominio::Proyecto* RepositorioProyectosMemoria::buscar(int idProyecto) {
    auto it = datos_.find(idProyecto);
    return it == datos_.end() ? nullptr : &it->second;
}

std::vector<const dominio::Proyecto*> RepositorioProyectosMemoria::listar() const {
    std::vector<const dominio::Proyecto*> resultado;
    for (const auto& entrada : datos_) resultado.push_back(&entrada.second);
    return resultado;
}

int RepositorioProyectosMemoria::siguienteId() const { return proximo(datos_); }

// ----- Alcances -----

int RepositorioAlcancesMemoria::guardar(const dominio::Alcance& alcance) {
    datos_.insert_or_assign(alcance.idAlcance(), alcance);
    return alcance.idAlcance();
}

dominio::Alcance* RepositorioAlcancesMemoria::buscar(int idAlcance) {
    auto it = datos_.find(idAlcance);
    return it == datos_.end() ? nullptr : &it->second;
}

dominio::Alcance* RepositorioAlcancesMemoria::buscarPorProyecto(int idProyecto) {
    for (auto& entrada : datos_) {
        if (entrada.second.idProyecto() == idProyecto) return &entrada.second;
    }
    return nullptr;
}

int RepositorioAlcancesMemoria::siguienteId() const { return proximo(datos_); }

// ----- Cotizaciones -----

int RepositorioCotizacionesMemoria::guardar(const dominio::Cotizacion& cotizacion) {
    datos_.insert_or_assign(cotizacion.idCotizacion(), cotizacion);
    return cotizacion.idCotizacion();
}

dominio::Cotizacion* RepositorioCotizacionesMemoria::buscar(int idCotizacion) {
    auto it = datos_.find(idCotizacion);
    return it == datos_.end() ? nullptr : &it->second;
}

std::vector<dominio::Cotizacion*> RepositorioCotizacionesMemoria::listarPorAlcance(int idAlcance) {
    std::vector<dominio::Cotizacion*> resultado;
    for (auto& entrada : datos_) {
        if (entrada.second.idAlcance() == idAlcance) resultado.push_back(&entrada.second);
    }
    return resultado;
}

int RepositorioCotizacionesMemoria::siguienteId() const { return proximo(datos_); }

// ----- Acuerdos -----

int RepositorioAcuerdosMemoria::guardar(const dominio::AcuerdoFormal& acuerdo) {
    datos_.insert_or_assign(acuerdo.idAcuerdo(), acuerdo);
    return acuerdo.idAcuerdo();
}

dominio::AcuerdoFormal* RepositorioAcuerdosMemoria::buscar(int idAcuerdo) {
    auto it = datos_.find(idAcuerdo);
    return it == datos_.end() ? nullptr : &it->second;
}

dominio::AcuerdoFormal* RepositorioAcuerdosMemoria::buscarPorCotizacion(int idCotizacion) {
    for (auto& entrada : datos_) {
        if (entrada.second.idCotizacion() == idCotizacion) return &entrada.second;
    }
    return nullptr;
}

int RepositorioAcuerdosMemoria::siguienteId() const { return proximo(datos_); }

// ----- Reportes de avance -----

int RepositorioReportesMemoria::guardar(const dominio::ReporteAvance& reporte) {
    datos_.insert_or_assign(reporte.idReporte(), reporte);
    return reporte.idReporte();
}

std::vector<const dominio::ReporteAvance*> RepositorioReportesMemoria::listarPorAcuerdo(
    int idAcuerdo) const {
    std::vector<const dominio::ReporteAvance*> resultado;
    for (const auto& entrada : datos_) {
        if (entrada.second.idAcuerdo() == idAcuerdo) resultado.push_back(&entrada.second);
    }
    return resultado;
}

const dominio::ReporteAvance* RepositorioReportesMemoria::ultimoDe(int idAcuerdo) const {
    const dominio::ReporteAvance* ultimo = nullptr;
    for (const auto& entrada : datos_) {
        if (entrada.second.idAcuerdo() != idAcuerdo) continue;
        if (ultimo == nullptr || entrada.second.idReporte() > ultimo->idReporte()) {
            ultimo = &entrada.second;
        }
    }
    return ultimo;
}

int RepositorioReportesMemoria::siguienteId() const { return proximo(datos_); }

}  // namespace persistencia