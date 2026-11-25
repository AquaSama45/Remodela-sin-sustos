#ifndef PERSISTENCIA_NOTIFICADOR_CONSOLA_H
#define PERSISTENCIA_NOTIFICADOR_CONSOLA_H

#include "puerto_notificacion.h"

namespace persistencia {

// NotificadorConsola — adaptador del Sprint 1: muestra la alerta en la terminal.
// Es el unico archivo fuera de src/ui que escribe en pantalla, y lo hace porque su
// razon de existir es precisamente adaptar el puerto a una salida concreta.
class NotificadorConsola : public PuertoNotificacion {
public:
    void enviarAlerta(const std::string& destinatario, const std::string& asunto,
                      const std::string& mensaje) override;
    void enviarConfirmacion(const std::string& destinatario, const std::string& asunto,
                            const std::string& mensaje) override;

    int alertasEnviadas() const;

private:
    int alertas_ = 0;
};

}  // namespace persistencia

#endif
