#ifndef UI_CONSOLA_H
#define UI_CONSOLA_H

#include <stdexcept>
#include <string>

namespace ui {

// Se lanza cuando la entrada se agota (Ctrl+D o redireccion de archivo):
// permite cerrar el programa sin quedarse en un bucle infinito de lectura.
class SalidaSolicitada : public std::runtime_error {
public:
    SalidaSolicitada() : std::runtime_error("fin de la entrada") {}
};

// Lectura defensiva: reintenta hasta recibir un valor valido
std::string leerTexto(const std::string& etiqueta);
int leerEntero(const std::string& etiqueta);
long long leerMonto(const std::string& etiqueta);
double leerDecimal(const std::string& etiqueta);

void titulo(const std::string& texto);
void aviso(const std::string& texto);
void error(const std::string& texto);
void pausar();

// Formatea un valor en pesos con separador de miles: 1135000 -> 1.135.000
std::string pesos(long long valor);

}  // namespace ui

#endif