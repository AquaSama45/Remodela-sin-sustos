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

int ProyectosEnMemoria::guardar(const dominio::Proyecto& proyecto) {
    datos_.insert_or_assign(proyecto.idProyecto(), proyecto);
    return proyecto.idProyecto();
}

dominio::Proyecto* ProyectosEnMemoria::buscar(int idProyecto) {
    auto it = datos_.find(idProyecto);
    return it == datos_.end() ? nullptr : &it->second;
}

std::vector<const dominio::Proyecto*> ProyectosEnMemoria::listar() const {
    std::vector<const dominio::Proyecto*> resultado;
    for (const auto& entrada : datos_) resultado.push_back(&entrada.second);
    return resultado;
}

int ProyectosEnMemoria::siguienteId() const { return proximo(datos_); }

// ----- Alcances -----

int AlcancesEnMemoria::guardar(const dominio::Alcance& alcance) {
    datos_.insert_or_assign(alcance.idAlcance(), alcance);
    return alcance.idAlcance();
}

dominio::Alcance* AlcancesEnMemoria::buscar(int idAlcance) {
    auto it = datos_.find(idAlcance);
    return it == datos_.end() ? nullptr : &it->second;
}

dominio::Alcance* AlcancesEnMemoria::buscarPorProyecto(int idProyecto) {
    for (auto& entrada : datos_) {
        if (entrada.second.idProyecto() == idProyecto) return &entrada.second;
    }
    return nullptr;
}

int AlcancesEnMemoria::siguienteId() const { return proximo(datos_); }

// ----- Cotizaciones -----

int CotizacionesEnMemoria::guardar(const dominio::Cotizacion& cotizacion) {
    datos_.insert_or_assign(cotizacion.idCotizacion(), cotizacion);
    return cotizacion.idCotizacion();
}

dominio::Cotizacion* CotizacionesEnMemoria::buscar(int idCotizacion) {
    auto it = datos_.find(idCotizacion);
    return it == datos_.end() ? nullptr : &it->second;
}

std::vector<dominio::Cotizacion*> CotizacionesEnMemoria::listarPorAlcance(int idAlcance) {
    std::vector<dominio::Cotizacion*> resultado;
    for (auto& entrada : datos_) {
        if (entrada.second.idAlcance() == idAlcance) resultado.push_back(&entrada.second);
    }
    return resultado;
}

int CotizacionesEnMemoria::siguienteId() const { return proximo(datos_); }

// ----- Acuerdos -----

int AcuerdosEnMemoria::guardar(const dominio::AcuerdoFormal& acuerdo) {
    datos_.insert_or_assign(acuerdo.idAcuerdo(), acuerdo);
    return acuerdo.idAcuerdo();
}

dominio::AcuerdoFormal* AcuerdosEnMemoria::buscar(int idAcuerdo) {
    auto it = datos_.find(idAcuerdo);
    return it == datos_.end() ? nullptr : &it->second;
}

dominio::AcuerdoFormal* AcuerdosEnMemoria::buscarPorCotizacion(int idCotizacion) {
    for (auto& entrada : datos_) {
        if (entrada.second.idCotizacion() == idCotizacion) return &entrada.second;
    }
    return nullptr;
}

int AcuerdosEnMemoria::siguienteId() const { return proximo(datos_); }

}  // namespace persistencia