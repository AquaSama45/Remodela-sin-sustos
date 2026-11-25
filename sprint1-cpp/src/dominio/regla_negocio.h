#ifndef DOMINIO_REGLA_NEGOCIO_H
#define DOMINIO_REGLA_NEGOCIO_H

#include <stdexcept>
#include <string>

namespace dominio {

// Excepcion de dominio: se violo una regla de negocio del documento (RF/UC/RNF).
// El dominio no sabe de consola ni de almacenamiento: solo avisa que la regla no se cumple.
class ReglaDeNegocio : public std::runtime_error {
public:
    explicit ReglaDeNegocio(const std::string& mensaje)
        : std::runtime_error(mensaje) {}
};

}  // namespace dominio

#endif