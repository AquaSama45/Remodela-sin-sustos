#ifndef DOMINIO_ACUERDO_FORMAL_H
#define DOMINIO_ACUERDO_FORMAL_H

#include <string>
#include <vector>

namespace dominio {

class HitoDePago;
class Cotizacion;

// ---------------------------------------------------------------------------
// Patron State, segunda aplicacion: ciclo de vida del hito de pago (UC8)
// Jerarquia independiente de la de Cotizacion porque las operaciones son otras;
// lo que se repite es la estructura del patron, no el codigo.
// ---------------------------------------------------------------------------
class EstadoHito {
public:
    virtual ~EstadoHito() = default;

    virtual std::string nombre() const = 0;
    virtual bool esPagado() const { return false; }

    virtual void habilitar(HitoDePago& hito, int avanceReportado) const;
    virtual void registrarPago(HitoDePago& hito, const std::string& comprobante,
                               long long montoPagado) const;

protected:
    static void transicionar(HitoDePago& hito, const EstadoHito& nuevo);
    static void anotarComprobante(HitoDePago& hito, const std::string& comprobante);

    [[noreturn]] void noPermitido(const std::string& operacion) const;
};

// PENDIENTE_DE_AVANCE: la obra todavia no llego al avance que exige este hito
class PendienteDeAvance : public EstadoHito {
public:
    static const PendienteDeAvance& instancia();
    std::string nombre() const override { return "PENDIENTE_DE_AVANCE"; }
    void habilitar(HitoDePago& hito, int avanceReportado) const override;
};

// HABILITADO: el avance se cumplio, el pago ya se puede registrar (UC8)
class Habilitado : public EstadoHito {
public:
    static const Habilitado& instancia();
    std::string nombre() const override { return "HABILITADO"; }
    void registrarPago(HitoDePago& hito, const std::string& comprobante,
                       long long montoPagado) const override;
};

// PAGADO: terminal, con comprobante registrado
class Pagado : public EstadoHito {
public:
    static const Pagado& instancia();
    std::string nombre() const override { return "PAGADO"; }
    bool esPagado() const override { return true; }
};

// ---------------------------------------------------------------------------

// HitoDePago <<entity>> — RF-05, UC8
class HitoDePago {
public:
    HitoDePago(int numero, std::string descripcion, int porcentaje, long long monto,
               int avanceRequerido);

    int numero() const;
    const std::string& descripcion() const;
    int porcentaje() const;
    long long monto() const;
    int avanceRequerido() const;
    const std::string& comprobante() const;

    std::string estado() const;
    bool pagado() const;

    void habilitar(int avanceReportado);
    void registrarPago(const std::string& comprobante, long long montoPagado);

private:
    friend class EstadoHito;

    int numero_;
    std::string descripcion_;
    int porcentaje_;
    long long monto_;
    int avanceRequerido_;
    std::string comprobante_;
    const EstadoHito* estado_;
};

// AcuerdoFormal <<entity>> — RF-04, UC4.
// Congela lo acordado: valor total, exclusiones y plan de pagos. Es la pieza que
// evita el "susto": despues de firmado, cambiar el alcance exige el UC9.
class AcuerdoFormal {
public:
    // Fabrica: un acuerdo solo nace de una cotizacion aceptada (UC4)
    static AcuerdoFormal generarDesde(int idAcuerdo, const Cotizacion& cotizacion, int idCliente);

    int idAcuerdo() const;
    int idCotizacion() const;
    int idCliente() const;
    int idContratista() const;
    long long valorTotal() const;
    const std::string& exclusiones() const;
    const std::vector<HitoDePago>& hitos() const;

    int avanceReportado() const;
    long long totalPagado() const;
    long long saldoPendiente() const;

    // Version simple del reporte de avance (base del UC7): solo sube, nunca baja.
    // Al subir, habilita los hitos cuyo avance exigido ya se cumplio.
    void registrarAvance(int porcentaje);

    // UC8: el pago se registra sobre un hito habilitado y con comprobante
    void pagarHito(int numeroHito, const std::string& comprobante, long long montoPagado);

    bool liquidado() const;

private:
    AcuerdoFormal(int idAcuerdo, int idCotizacion, int idCliente, int idContratista,
                  long long valorTotal, std::string exclusiones);

    HitoDePago& buscarHito(int numeroHito);

    int idAcuerdo_;
    int idCotizacion_;
    int idCliente_;
    int idContratista_;
    long long valorTotal_;
    std::string exclusiones_;
    int avanceReportado_;
    std::vector<HitoDePago> hitos_;
};

}  // namespace dominio

#endif