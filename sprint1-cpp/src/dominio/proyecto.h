#ifndef DOMINIO_PROYECTO_H
#define DOMINIO_PROYECTO_H

#include <string>

#include "enums.h"

namespace dominio {

// Proyecto <<entity>> — RF-01.
// Nota de diseno: aqui NO se aplica el patron State. Las transiciones del proyecto
// no tienen reglas propias (son un cambio de etiqueta que decide el coordinador),
// asi que un enum simple es suficiente. El patron se reserva para Cotizacion y
// HitoDePago, donde cada estado si decide que operaciones son legales.
class Proyecto {
public:
    Proyecto(int idProyecto, std::string nombre, int idCliente);

    int idProyecto() const;
    const std::string& nombre() const;
    int idCliente() const;
    EstadoProyecto estado() const;

    void abrirACotizacion();   // UC1 paso 6: el alcance quedo oficial
    void iniciarEjecucion();   // UC4: ya existe acuerdo formal firmado

private:
    int idProyecto_;
    std::string nombre_;
    int idCliente_;
    EstadoProyecto estado_;
};

}  // namespace dominio

#endif