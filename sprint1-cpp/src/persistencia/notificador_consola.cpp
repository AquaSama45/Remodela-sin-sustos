#include "notificador_consola.h"

#include <iostream>

namespace persistencia {

void NotificadorConsola::enviarAlerta(const std::string& destinatario, const std::string& asunto,
                                      const std::string& mensaje) {
    ++alertas_;
    std::cout << "\n  *** ALERTA para " << destinatario << " ***\n"
              << "  " << asunto << "\n"
              << "  " << mensaje << std::endl;
}

void NotificadorConsola::enviarConfirmacion(const std::string& destinatario,
                                            const std::string& asunto,
                                            const std::string& mensaje) {
    std::cout << "\n  (notificacion para " << destinatario << ") " << asunto << "\n"
              << "  " << mensaje << std::endl;
}

int NotificadorConsola::alertasEnviadas() const { return alertas_; }

}  // namespace persistencia
