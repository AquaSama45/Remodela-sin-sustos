#include "consola.h"

#include <iostream>
#include <sstream>

namespace ui {

namespace {

std::string leerLinea(const std::string& etiqueta) {
    std::cout << etiqueta;
    std::string linea;
    if (!std::getline(std::cin, linea)) throw SalidaSolicitada();
    return linea;
}

// Quita espacios de los extremos
std::string recortar(const std::string& texto) {
    const auto inicio = texto.find_first_not_of(" \t\r\n");
    if (inicio == std::string::npos) return "";
    const auto fin = texto.find_last_not_of(" \t\r\n");
    return texto.substr(inicio, fin - inicio + 1);
}

}  // namespace

std::string leerTexto(const std::string& etiqueta) {
    while (true) {
        const std::string valor = recortar(leerLinea(etiqueta));
        if (!valor.empty()) return valor;
        error("No puede quedar vacio.");
    }
}

int leerEntero(const std::string& etiqueta) {
    while (true) {
        const std::string valor = recortar(leerLinea(etiqueta));
        std::istringstream flujo(valor);
        int numero = 0;
        char sobrante = 0;
        if (flujo >> numero && !(flujo >> sobrante)) return numero;
        error("Escribe un numero entero.");
    }
}

long long leerMonto(const std::string& etiqueta) {
    while (true) {
        const std::string valor = recortar(leerLinea(etiqueta));
        std::istringstream flujo(valor);
        long long numero = 0;
        char sobrante = 0;
        if (flujo >> numero && !(flujo >> sobrante)) return numero;
        error("Escribe un valor en pesos, sin puntos ni comas.");
    }
}

double leerDecimal(const std::string& etiqueta) {
    while (true) {
        const std::string valor = recortar(leerLinea(etiqueta));
        std::istringstream flujo(valor);
        double numero = 0;
        char sobrante = 0;
        if (flujo >> numero && !(flujo >> sobrante)) return numero;
        error("Escribe una cantidad (usa punto para decimales).");
    }
}

void titulo(const std::string& texto) {
    std::cout << "\n== " << texto << " ==" << std::endl;
}

void aviso(const std::string& texto) { std::cout << "  " << texto << std::endl; }

void error(const std::string& texto) { std::cout << "  [!] " << texto << std::endl; }

void pausar() {
    std::cout << "\n  (enter para continuar) ";
    std::string descarte;
    if (!std::getline(std::cin, descarte)) throw SalidaSolicitada();
}

std::string pesos(long long valor) {
    const bool negativo = valor < 0;
    std::string digitos = std::to_string(negativo ? -valor : valor);
    std::string salida;
    int contador = 0;
    for (auto it = digitos.rbegin(); it != digitos.rend(); ++it) {
        if (contador == 3) {
            salida.push_back('.');
            contador = 0;
        }
        salida.push_back(*it);
        ++contador;
    }
    if (negativo) salida.push_back('-');
    return std::string(salida.rbegin(), salida.rend());
}

}  // namespace ui