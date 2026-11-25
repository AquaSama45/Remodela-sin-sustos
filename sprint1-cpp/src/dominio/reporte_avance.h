#ifndef DOMINIO_REPORTE_AVANCE_H
#define DOMINIO_REPORTE_AVANCE_H

namespace dominio {

// ReporteAvance <<entity>> — RF-07, RF-09, UC5.
// Calcula su propia desviacion de costo contra lo pactado en el acuerdo. No decide
// si hay que alertar a alguien ni a quien: eso es del servicio. Solo sabe cuanto se
// desvio y si ese desvio supera un umbral que le pasan.
class ReporteAvance {
public:
    ReporteAvance(int idReporte, int idAcuerdo, int avanceGeneral, long long costoRealAcumulado);

    int idReporte() const;
    int idAcuerdo() const;
    int avanceGeneral() const;
    long long costoRealAcumulado() const;
    long long costoEsperado() const;

    // + calcularDesviacion(costoEsperado: Long): Long — UC5 paso 3, Figura 6 mensaje 7
    long long calcularDesviacion(long long costoEsperado);

    bool desviacionCalculada() const;

    // /desviacionCosto — atributo derivado: costo real menos costo esperado
    long long desviacionCosto() const;
    double desviacionPorcentual() const;

    // US-06: solo el sobrecosto alerta; gastar menos de lo pactado no es una alarma
    bool requiereAlerta(double umbralPorcentual) const;

private:
    void exigirCalculo() const;

    int idReporte_;
    int idAcuerdo_;
    int avanceGeneral_;
    long long costoRealAcumulado_;
    long long costoEsperado_;
    long long desviacionCosto_;
    bool calculada_;
};

}  // namespace dominio

#endif
