#ifndef DOMINIO_ESTADO_COTIZACION_H
#define DOMINIO_ESTADO_COTIZACION_H

#include <string>

namespace dominio {

class Cotizacion;
class Alcance;

// Patron State (GoF) <<entity>>
// Cada estado del ciclo de vida de la cotizacion es una clase propia: ella decide
// que operaciones son legales y hacia que estado se transita. La implementacion
// por defecto de cada transicion la rechaza, asi que un estado concreto sobrescribe
// unicamente lo que si permite. Agregar un estado nuevo es agregar una clase, no
// editar un switch: principio O (abierto/cerrado) de SOLID.
class EstadoCotizacion {
public:
    virtual ~EstadoCotizacion() = default;

    virtual std::string nombre() const = 0;

    // Solo el borrador admite cambios de valores (UC2 A1)
    virtual bool permiteEdicion() const { return false; }

    // Estado terminal: ya no admite ninguna transicion
    virtual bool esFinal() const { return false; }

    virtual void enviar(Cotizacion& cotizacion, const Alcance& alcance) const;
    virtual void iniciarRevision(Cotizacion& cotizacion) const;
    virtual void aceptar(Cotizacion& cotizacion) const;
    virtual void rechazar(Cotizacion& cotizacion, const std::string& motivo) const;

protected:
    // Unicos puntos por donde un estado toca los datos internos de la cotizacion
    static void transicionar(Cotizacion& cotizacion, const EstadoCotizacion& nuevo);
    static void anotarMotivoRechazo(Cotizacion& cotizacion, const std::string& motivo);

    [[noreturn]] void noPermitido(const std::string& operacion) const;
};

// BORRADOR: el contratista arma su propuesta (UC2 pasos 1-4)
class Borrador : public EstadoCotizacion {
public:
    static const Borrador& instancia();
    std::string nombre() const override { return "BORRADOR"; }
    bool permiteEdicion() const override { return true; }
    void enviar(Cotizacion& cotizacion, const Alcance& alcance) const override;
};

// ENVIADA: la propuesta ya esta en manos del cliente y no se edita (UC2 paso 5)
class Enviada : public EstadoCotizacion {
public:
    static const Enviada& instancia();
    std::string nombre() const override { return "ENVIADA"; }
    void iniciarRevision(Cotizacion& cotizacion) const override;
    void rechazar(Cotizacion& cotizacion, const std::string& motivo) const override;
};

// EN_REVISION: el cliente la esta comparando contra las demas (UC3)
class EnRevision : public EstadoCotizacion {
public:
    static const EnRevision& instancia();
    std::string nombre() const override { return "EN_REVISION"; }
    void aceptar(Cotizacion& cotizacion) const override;
    void rechazar(Cotizacion& cotizacion, const std::string& motivo) const override;
};

// ACEPTADA: solo se llega desde el flujo de acuerdo formal (UC4)
class Aceptada : public EstadoCotizacion {
public:
    static const Aceptada& instancia();
    std::string nombre() const override { return "ACEPTADA"; }
    bool esFinal() const override { return true; }
};

// RECHAZADA: cierre con motivo registrado
class Rechazada : public EstadoCotizacion {
public:
    static const Rechazada& instancia();
    std::string nombre() const override { return "RECHAZADA"; }
    bool esFinal() const override { return true; }
};

}  // namespace dominio

#endif