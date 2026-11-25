#ifndef DOMINIO_COTIZACION_H
#define DOMINIO_COTIZACION_H

#include <string>
#include <vector>

#include "estado_cotizacion.h"

namespace dominio {

class Alcance;

// DetalleCotizacion <<entity>> — RF-03: valor que el contratista pone a una partida
class DetalleCotizacion {
public:
    DetalleCotizacion(std::string partida, std::string unidad, double cantidad,
                   long long valorUnitario);

    const std::string& partida() const;
    const std::string& unidad() const;
    double cantidad() const;
    long long valorUnitario() const;

    // + subtotal(): Long — atributo derivado
    long long subtotal() const;

private:
    std::string partida_;
    std::string unidad_;
    double cantidad_;
    long long valorUnitario_;
};

// HitoPropuesto <<entity>> — plan de pagos que propone la cotizacion (base del UC4)
class HitoPropuesto {
public:
    HitoPropuesto(std::string descripcion, int porcentaje);

    const std::string& descripcion() const;
    int porcentaje() const;

private:
    std::string descripcion_;
    int porcentaje_;
};

// Cotizacion <<entity>> — RF-03, UC2, UC3.
// Contexto del patron State: no decide por si misma si una operacion es legal,
// se lo pregunta a su estado actual.
class Cotizacion {
public:
    Cotizacion(int idCotizacion, int idAlcance, int idContratista);

    int idCotizacion() const;
    int idAlcance() const;
    int idContratista() const;
    int version() const;
    const std::string& exclusiones() const;
    const std::string& motivoRechazo() const;
    const std::vector<DetalleCotizacion>& items() const;
    const std::vector<HitoPropuesto>& hitosPropuestos() const;

    std::string estado() const;
    bool editable() const;
    bool esFinal() const;

    // + total(): Long — atributo derivado, suma de los subtotales
    long long total() const;
    int sumaPorcentajes() const;

    // --- Edicion: solo permitida en BORRADOR (UC2 A1) ---
    void agregarItem(const DetalleCotizacion& item);
    void definirExclusiones(const std::string& texto);
    void agregarHitoPropuesto(const HitoPropuesto& hito);

    // --- Operaciones delegadas al estado (patron State) ---
    void enviar(const Alcance& alcance);  // UC2 paso 5
    void iniciarRevision();               // UC3
    void aceptar();                       // UC4: lo invoca el servicio de acuerdo
    void rechazar(const std::string& motivo);

    // Reglas de datos para poder enviarse (UC2 E1)
    std::vector<std::string> faltantesParaEnvio(const Alcance& alcance) const;
    void validarParaEnvio(const Alcance& alcance) const;

    // UC2 A1: una cotizacion enviada no se edita, se versiona
    Cotizacion nuevaVersion(int idNuevaCotizacion) const;

private:
    friend class EstadoCotizacion;

    void exigirEdicion() const;

    int idCotizacion_;
    int idAlcance_;
    int idContratista_;
    int version_;
    std::string exclusiones_;
    std::string motivoRechazo_;
    std::vector<DetalleCotizacion> items_;
    std::vector<HitoPropuesto> hitosPropuestos_;
    const EstadoCotizacion* estado_;
};

}  // namespace dominio

#endif