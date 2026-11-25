#ifndef PERSISTENCIA_PUERTO_NOTIFICACION_H
#define PERSISTENCIA_PUERTO_NOTIFICACION_H

#include <string>

namespace persistencia {

// PuertoNotificacion — puerto de salida.
// Desacopla el envio de alertas y confirmaciones del servicio que las dispara:
// ServicioAvance sabe CUANDO alertar, no COMO. En el Sprint 1 lo cumple
// NotificadorConsola; en el MVP lo cumplira NotificadorExterno contra el servicio
// de correo del modelo C4, sin tocar una linea del control ni del dominio.
class PuertoNotificacion {
public:
    virtual ~PuertoNotificacion() = default;

    virtual void enviarAlerta(const std::string& destinatario, const std::string& asunto,
                              const std::string& mensaje) = 0;
    virtual void enviarConfirmacion(const std::string& destinatario, const std::string& asunto,
                                    const std::string& mensaje) = 0;
};

}  // namespace persistencia

#endif
