#ifndef UI_MENUS_H
#define UI_MENUS_H

#include "../control/servicios.h"

namespace ui {

// Contexto de la aplicacion: todas las dependencias se inyectan desde main y la
// consola solo las usa. Nadie construye su propio servicio ni su propio repositorio.
struct Contexto {
    control::ServicioAlcance& servicioAlcance;
    control::ServicioCotizacion& servicioCotizacion;
    control::ServicioAcuerdo& servicioAcuerdo;
    persistencia::IRepositorioProyectos& proyectos;
    persistencia::IRepositorioAlcances& alcances;
    persistencia::IRepositorioCotizaciones& cotizaciones;
    persistencia::IRepositorioAcuerdos& acuerdos;
    control::ServicioAvance& servicioAvance;
    persistencia::IRepositorioReportes& reportes;
};

// Clases <<boundary>>.
// Unico lugar del programa que lee del teclado y escribe en pantalla. Atrapan
// ReglaDeNegocio y la muestran como mensaje; no deciden nada de negocio.

class MenuCoordinador {
public:
    explicit MenuCoordinador(Contexto& contexto);
    void ejecutar();  // UC1

private:
    void listarProyectos();
    void crearProyecto();
    void iniciarAlcance();
    void agregarAmbiente();
    void agregarPartida();
    void agregarMaterial();
    void verFaltantes();
    void oficializar();
    void verAlcance();

    Contexto& ctx_;
};

class MenuContratista {
public:
    explicit MenuContratista(Contexto& contexto);
    void ejecutar();  // UC2

private:
    void crearCotizacion();
    void agregarItem();
    void definirExclusiones();
    void agregarHito();
    void verFaltantes();
    void enviar();
    void nuevaVersion();
    void verCotizacion();
    void reportarAvanceObra();  // UC5

    Contexto& ctx_;
};

class MenuCliente {
public:
    explicit MenuCliente(Contexto& contexto);
    void ejecutar();  // UC3, UC4 y UC8

private:
    void verComparativo();
    void ponerEnRevision();
    void aceptar();
    void verAcuerdo();
    void verHistorialAvances();  // US-06
    void pagarHito();

    Contexto& ctx_;
};

class MenuPrincipal {
public:
    explicit MenuPrincipal(Contexto& contexto);
    void ejecutar();

private:
    Contexto& ctx_;
};

// Deja un proyecto con alcance oficial y tres cotizaciones listas, usando los mismos
// servicios que usa la consola: el guion de la demostracion no toma atajos.
void cargarDatosDemo(Contexto& contexto);

}  // namespace ui

#endif