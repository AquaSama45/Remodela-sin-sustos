#include "reporte_avance.h"

#include <string>

#include "regla_negocio.h"

namespace dominio {

ReporteAvance::ReporteAvance(int idReporte, int idAcuerdo, int avanceGeneral,
                             long long costoRealAcumulado)
    : idReporte_(idReporte),
      idAcuerdo_(idAcuerdo),
      avanceGeneral_(avanceGeneral),
      costoRealAcumulado_(costoRealAcumulado),
      costoEsperado_(0),
      desviacionCosto_(0),
      calculada_(false) {
    if (avanceGeneral_ <= 0 || avanceGeneral_ > 100) {
        throw ReglaDeNegocio("El avance general reportado debe estar entre 1 y 100");
    }
    if (costoRealAcumulado_ < 0) {
        throw ReglaDeNegocio("El costo real acumulado no puede ser negativo");
    }
}

int ReporteAvance::idReporte() const { return idReporte_; }
int ReporteAvance::idAcuerdo() const { return idAcuerdo_; }
int ReporteAvance::avanceGeneral() const { return avanceGeneral_; }
long long ReporteAvance::costoRealAcumulado() const { return costoRealAcumulado_; }
long long ReporteAvance::costoEsperado() const { return costoEsperado_; }

bool ReporteAvance::desviacionCalculada() const { return calculada_; }

void ReporteAvance::exigirCalculo() const {
    if (!calculada_) {
        throw ReglaDeNegocio("La desviacion del reporte todavia no se ha calculado (UC5 paso 3)");
    }
}

long long ReporteAvance::calcularDesviacion(long long costoEsperado) {
    if (costoEsperado <= 0) {
        throw ReglaDeNegocio("El costo esperado del acuerdo debe ser positivo para comparar");
    }
    costoEsperado_ = costoEsperado;
    desviacionCosto_ = costoRealAcumulado_ - costoEsperado_;
    calculada_ = true;
    return desviacionCosto_;
}

long long ReporteAvance::desviacionCosto() const {
    exigirCalculo();
    return desviacionCosto_;
}

double ReporteAvance::desviacionPorcentual() const {
    exigirCalculo();
    return static_cast<double>(desviacionCosto_) * 100.0 / static_cast<double>(costoEsperado_);
}

bool ReporteAvance::requiereAlerta(double umbralPorcentual) const {
    return desviacionPorcentual() > umbralPorcentual;
}

}  // namespace dominio
