// Remodela sin sustos — nucleo de consola del Sprint 1
// IUSH — Aplicacion de Metodologias de Diseno de Software
//
// Punto de ensamblaje (composition root): es el unico lugar donde se eligen las
// implementaciones concretas de los repositorios. Todo lo demas trabaja contra las
// interfaces, asi que cambiar "en memoria" por una base de datos solo cambia este
// archivo. Esa es la razon practica del principio D de SOLID.

#include <iostream>

#include "control/servicios.h"
#include "persistencia/repositorios_memoria.h"
#include "ui/consola.h"
#include "ui/menus.h"

int main() {
    persistencia::ProyectosEnMemoria proyectos;
    persistencia::AlcancesEnMemoria alcances;
    persistencia::CotizacionesEnMemoria cotizaciones;
    persistencia::AcuerdosEnMemoria acuerdos;

    control::ServicioAlcance servicioAlcance(proyectos, alcances);
    control::ServicioCotizacion servicioCotizacion(cotizaciones, alcances);
    control::ServicioAcuerdo servicioAcuerdo(cotizaciones, acuerdos, alcances, proyectos);

    ui::Contexto contexto{servicioAlcance, servicioCotizacion, servicioAcuerdo,
                          proyectos,       alcances,           cotizaciones,
                          acuerdos};

    try {
        ui::MenuPrincipal(contexto).ejecutar();
    } catch (const ui::SalidaSolicitada&) {
        std::cout << "\nFin de la entrada. Cerrando." << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "\nError inesperado: " << e.what() << std::endl;
        return 1;
    }
    return 0;
}