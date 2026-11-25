#include "menus.h"

#include <iomanip>
#include <iostream>

#include "../dominio/regla_negocio.h"
#include "consola.h"

namespace ui {

using dominio::ReglaDeNegocio;

namespace {

// Envuelve una operacion de negocio: la consola traduce la excepcion del dominio
// en un mensaje para el usuario. Es el unico punto del programa que atrapa
// ReglaDeNegocio, y por eso ninguna capa de abajo necesita saber que hay pantalla.
template <typename F>
void intentar(F operacion) {
    try {
        operacion();
    } catch (const ReglaDeNegocio& e) {
        error(e.what());
    }
}

void mostrarLista(const std::vector<std::string>& renglones, const std::string& siVacio) {
    if (renglones.empty()) {
        aviso(siVacio);
        return;
    }
    for (const auto& renglon : renglones) aviso("- " + renglon);
}

}  // namespace

// ===========================================================================
// MenuCoordinador — UC1
// ===========================================================================

MenuCoordinador::MenuCoordinador(Contexto& contexto) : ctx_(contexto) {}

void MenuCoordinador::listarProyectos() {
    titulo("Proyectos");
    auto proyectos = ctx_.proyectos.listar();
    if (proyectos.empty()) {
        aviso("Todavia no hay proyectos.");
        return;
    }
    for (const auto* proyecto : proyectos) {
        const dominio::Alcance* alcance = ctx_.alcances.buscarPorProyecto(proyecto->idProyecto());
        std::cout << "  [" << proyecto->idProyecto() << "] " << proyecto->nombre() << " — "
                  << aTexto(proyecto->estado());
        if (alcance == nullptr) {
            std::cout << " — sin alcance";
        } else {
            std::cout << " — alcance " << alcance->idAlcance() << " ("
                      << aTexto(alcance->estado()) << ")";
        }
        std::cout << std::endl;
    }
}

void MenuCoordinador::crearProyecto() {
    const std::string nombre = leerTexto("  Nombre del proyecto: ");
    const int idCliente = leerEntero("  Id del cliente: ");
    intentar([&] {
        const int id = ctx_.servicioAlcance.crearProyecto(nombre, idCliente);
        aviso("Proyecto creado con id " + std::to_string(id) + ".");
    });
}

void MenuCoordinador::iniciarAlcance() {
    const int idProyecto = leerEntero("  Id del proyecto: ");
    intentar([&] {
        const int id = ctx_.servicioAlcance.iniciarAlcance(idProyecto);
        aviso("Alcance " + std::to_string(id) + " iniciado en borrador.");
    });
}

void MenuCoordinador::agregarAmbiente() {
    const int idAlcance = leerEntero("  Id del alcance: ");
    const std::string nombre = leerTexto("  Nombre del ambiente: ");
    intentar([&] {
        ctx_.servicioAlcance.agregarAmbiente(idAlcance, nombre);
        aviso("Ambiente agregado.");
    });
}

void MenuCoordinador::agregarPartida() {
    const int idAlcance = leerEntero("  Id del alcance: ");
    const std::string ambiente = leerTexto("  Ambiente: ");
    const std::string partida = leerTexto("  Partida de trabajo: ");
    const std::string categoria = leerTexto("  Categoria: ");
    intentar([&] {
        ctx_.servicioAlcance.agregarPartida(idAlcance, ambiente, partida, categoria);
        aviso("Partida agregada.");
    });
}

void MenuCoordinador::agregarMaterial() {
    const int idAlcance = leerEntero("  Id del alcance: ");
    const std::string ambiente = leerTexto("  Ambiente: ");
    const std::string partida = leerTexto("  Partida: ");
    const std::string material = leerTexto("  Material: ");
    const std::string unidad = leerTexto("  Unidad: ");
    intentar([&] {
        ctx_.servicioAlcance.agregarMaterial(idAlcance, ambiente, partida, material, unidad);
        aviso("Material agregado.");
    });
}

void MenuCoordinador::verFaltantes() {
    const int idAlcance = leerEntero("  Id del alcance: ");
    intentar([&] {
        titulo("Pendientes del alcance " + std::to_string(idAlcance));
        mostrarLista(ctx_.servicioAlcance.faltantes(idAlcance),
                     "El alcance esta completo: ya se puede oficializar.");
    });
}

void MenuCoordinador::verAlcance() {
    const int idAlcance = leerEntero("  Id del alcance: ");
    const dominio::Alcance* alcance = ctx_.alcances.buscar(idAlcance);
    if (alcance == nullptr) {
        error("No existe ese alcance.");
        return;
    }
    titulo("Alcance " + std::to_string(alcance->idAlcance()) + " (" +
           aTexto(alcance->estado()) + ")");
    for (const auto& ambiente : alcance->ambientes()) {
        std::cout << "  " << ambiente.nombre() << std::endl;
        for (const auto& partida : ambiente.partidas()) {
            std::cout << "    - " << partida.nombre() << " [" << partida.categoria() << "]";
            if (partida.materiales().empty()) {
                std::cout << " (sin materiales)";
            } else {
                std::cout << ": ";
                bool primero = true;
                for (const auto& material : partida.materiales()) {
                    if (!primero) std::cout << ", ";
                    std::cout << material.nombre() << " (" << material.unidad() << ")";
                    primero = false;
                }
            }
            std::cout << std::endl;
        }
    }
}

void MenuCoordinador::oficializar() {
    const int idAlcance = leerEntero("  Id del alcance a oficializar: ");
    intentar([&] {
        ctx_.servicioAlcance.oficializar(idAlcance);
        aviso("Alcance oficializado. El proyecto queda abierto a cotizacion.");
    });
}

void MenuCoordinador::ejecutar() {
    while (true) {
        titulo("Coordinador — definicion del alcance (UC1)");
        std::cout << "  1. Listar proyectos\n"
                     "  2. Crear proyecto\n"
                     "  3. Iniciar alcance de un proyecto\n"
                     "  4. Agregar ambiente\n"
                     "  5. Agregar partida de trabajo\n"
                     "  6. Agregar material\n"
                     "  7. Ver alcance completo\n"
                     "  8. Ver que falta para oficializar\n"
                     "  9. Oficializar alcance\n"
                     "  0. Volver"
                  << std::endl;
        switch (leerEntero("  Opcion: ")) {
            case 1: listarProyectos(); break;
            case 2: crearProyecto(); break;
            case 3: iniciarAlcance(); break;
            case 4: agregarAmbiente(); break;
            case 5: agregarPartida(); break;
            case 6: agregarMaterial(); break;
            case 7: verAlcance(); break;
            case 8: verFaltantes(); break;
            case 9: oficializar(); break;
            case 0: return;
            default: error("Opcion no valida.");
        }
    }
}

// ===========================================================================
// MenuContratista — UC2
// ===========================================================================

MenuContratista::MenuContratista(Contexto& contexto) : ctx_(contexto) {}

void MenuContratista::crearCotizacion() {
    const int idAlcance = leerEntero("  Id del alcance a cotizar: ");
    const int idContratista = leerEntero("  Tu id de contratista: ");
    intentar([&] {
        const int id = ctx_.servicioCotizacion.crear(idAlcance, idContratista);
        aviso("Cotizacion " + std::to_string(id) + " creada en borrador.");
    });
}

void MenuContratista::agregarItem() {
    const int idCotizacion = leerEntero("  Id de la cotizacion: ");
    aviso("La partida se escribe como aparece en el alcance: \"Ambiente / Partida\".");
    const std::string partida = leerTexto("  Partida: ");
    const std::string unidad = leerTexto("  Unidad: ");
    const double cantidad = leerDecimal("  Cantidad: ");
    const long long valor = leerMonto("  Valor unitario: ");
    intentar([&] {
        ctx_.servicioCotizacion.agregarItem(idCotizacion, partida, unidad, cantidad, valor);
        aviso("Item agregado.");
    });
}

void MenuContratista::definirExclusiones() {
    const int idCotizacion = leerEntero("  Id de la cotizacion: ");
    const std::string texto = leerTexto("  Que NO incluye: ");
    intentar([&] {
        ctx_.servicioCotizacion.definirExclusiones(idCotizacion, texto);
        aviso("Exclusiones registradas.");
    });
}

void MenuContratista::agregarHito() {
    const int idCotizacion = leerEntero("  Id de la cotizacion: ");
    const std::string descripcion = leerTexto("  Descripcion del hito: ");
    const int porcentaje = leerEntero("  Porcentaje del valor: ");
    intentar([&] {
        ctx_.servicioCotizacion.agregarHito(idCotizacion, descripcion, porcentaje);
        aviso("Hito propuesto agregado.");
    });
}

void MenuContratista::verFaltantes() {
    const int idCotizacion = leerEntero("  Id de la cotizacion: ");
    intentar([&] {
        titulo("Pendientes de la cotizacion " + std::to_string(idCotizacion));
        mostrarLista(ctx_.servicioCotizacion.faltantesParaEnvio(idCotizacion),
                     "Todo listo: la cotizacion ya se puede enviar.");
    });
}

void MenuContratista::verCotizacion() {
    const int idCotizacion = leerEntero("  Id de la cotizacion: ");
    const dominio::Cotizacion* cotizacion = ctx_.cotizaciones.buscar(idCotizacion);
    if (cotizacion == nullptr) {
        error("No existe esa cotizacion.");
        return;
    }
    titulo("Cotizacion " + std::to_string(cotizacion->idCotizacion()) + " v" +
           std::to_string(cotizacion->version()) + " — " + cotizacion->estado());
    for (const auto& item : cotizacion->items()) {
        std::cout << "  " << std::left << std::setw(36) << item.partida() << std::right
                  << std::setw(7) << item.cantidad() << " " << std::setw(6) << item.unidad()
                  << " x " << std::setw(12) << pesos(item.valorUnitario()) << " = "
                  << std::setw(14) << pesos(item.subtotal()) << std::endl;
    }
    std::cout << "  " << std::left << std::setw(36) << "TOTAL" << std::right << std::setw(43)
              << pesos(cotizacion->total()) << std::endl;
    aviso("Excluye: " + (cotizacion->exclusiones().empty() ? std::string("(sin definir)")
                                                           : cotizacion->exclusiones()));
    for (const auto& hito : cotizacion->hitosPropuestos()) {
        aviso("Hito: " + hito.descripcion() + " — " + std::to_string(hito.porcentaje()) + "%");
    }
    if (!cotizacion->motivoRechazo().empty()) {
        aviso("Motivo de rechazo: " + cotizacion->motivoRechazo());
    }
}

void MenuContratista::enviar() {
    const int idCotizacion = leerEntero("  Id de la cotizacion a enviar: ");
    intentar([&] {
        ctx_.servicioCotizacion.enviar(idCotizacion);
        aviso("Cotizacion enviada al cliente. Desde ahora no se edita.");
    });
}

void MenuContratista::nuevaVersion() {
    const int idCotizacion = leerEntero("  Id de la cotizacion a versionar: ");
    intentar([&] {
        const int id = ctx_.servicioCotizacion.crearNuevaVersion(idCotizacion);
        aviso("Nueva version creada con id " + std::to_string(id) + ", en borrador.");
    });
}

void MenuContratista::ejecutar() {
    while (true) {
        titulo("Contratista — cotizacion (UC2)");
        std::cout << "  1. Crear cotizacion sobre un alcance\n"
                     "  2. Agregar item\n"
                     "  3. Definir exclusiones\n"
                     "  4. Agregar hito de pago propuesto\n"
                     "  5. Ver mi cotizacion\n"
                     "  6. Ver que falta para enviar\n"
                     "  7. Enviar cotizacion\n"
                     "  8. Crear nueva version\n"
                     "  0. Volver"
                  << std::endl;
        switch (leerEntero("  Opcion: ")) {
            case 1: crearCotizacion(); break;
            case 2: agregarItem(); break;
            case 3: definirExclusiones(); break;
            case 4: agregarHito(); break;
            case 5: verCotizacion(); break;
            case 6: verFaltantes(); break;
            case 7: enviar(); break;
            case 8: nuevaVersion(); break;
            case 0: return;
            default: error("Opcion no valida.");
        }
    }
}

// ===========================================================================
// MenuCliente — UC3, UC4 y UC8
// ===========================================================================

MenuCliente::MenuCliente(Contexto& contexto) : ctx_(contexto) {}

void MenuCliente::verComparativo() {
    const int idAlcance = leerEntero("  Id del alcance: ");
    intentar([&] {
        auto filas = ctx_.servicioAcuerdo.comparar(idAlcance);
        titulo("Cuadro comparativo del alcance " + std::to_string(idAlcance));
        if (filas.empty()) {
            aviso("Todavia no hay cotizaciones enviadas para este alcance.");
            return;
        }
        std::cout << "  " << std::left << std::setw(6) << "Cot" << std::setw(12) << "Contratista"
                  << std::setw(5) << "Ver" << std::right << std::setw(16) << "Total"
                  << "   Estado" << std::endl;
        for (const auto& fila : filas) {
            std::cout << "  " << std::left << std::setw(6) << fila.idCotizacion << std::setw(12)
                      << fila.idContratista << std::setw(5) << ("v" + std::to_string(fila.version))
                      << std::right << std::setw(16) << pesos(fila.total) << "   " << fila.estado
                      << std::endl;
        }
        for (const auto& fila : filas) {
            titulo("Detalle de la cotizacion " + std::to_string(fila.idCotizacion));
            for (const auto& partida : fila.porPartida) {
                std::cout << "  " << std::left << std::setw(40) << partida.first << std::right
                          << std::setw(14) << pesos(partida.second) << std::endl;
            }
            aviso("Excluye: " + fila.exclusiones);
        }
    });
}

void MenuCliente::ponerEnRevision() {
    const int idCotizacion = leerEntero("  Id de la cotizacion a revisar: ");
    intentar([&] {
        ctx_.servicioAcuerdo.ponerEnRevision(idCotizacion);
        aviso("Cotizacion en revision.");
    });
}

void MenuCliente::aceptar() {
    const int idCotizacion = leerEntero("  Id de la cotizacion a aceptar: ");
    intentar([&] {
        const int id = ctx_.servicioAcuerdo.aceptar(idCotizacion);
        aviso("Acuerdo formal " + std::to_string(id) +
              " generado. Las demas cotizaciones quedaron rechazadas.");
    });
}

void MenuCliente::verAcuerdo() {
    const int idAcuerdo = leerEntero("  Id del acuerdo: ");
    const dominio::AcuerdoFormal* acuerdo = ctx_.acuerdos.buscar(idAcuerdo);
    if (acuerdo == nullptr) {
        error("No existe ese acuerdo.");
        return;
    }
    titulo("Acuerdo formal " + std::to_string(acuerdo->idAcuerdo()));
    aviso("Cotizacion " + std::to_string(acuerdo->idCotizacion()) + " | contratista " +
          std::to_string(acuerdo->idContratista()));
    aviso("Valor acordado: " + pesos(acuerdo->valorTotal()));
    aviso("Excluye: " + acuerdo->exclusiones());
    aviso("Avance de obra reportado: " + std::to_string(acuerdo->avanceReportado()) + "%");
    std::cout << "  " << std::left << std::setw(4) << "#" << std::setw(24) << "Hito"
              << std::right << std::setw(14) << "Monto" << std::setw(8) << "Exige"
              << "   Estado" << std::endl;
    for (const auto& hito : acuerdo->hitos()) {
        std::cout << "  " << std::left << std::setw(4) << hito.numero() << std::setw(24)
                  << hito.descripcion() << std::right << std::setw(14) << pesos(hito.monto())
                  << std::setw(7) << hito.avanceRequerido() << "%   " << hito.estado();
        if (hito.pagado()) std::cout << " (" << hito.comprobante() << ")";
        std::cout << std::endl;
    }
    aviso("Pagado: " + pesos(acuerdo->totalPagado()) + " | Saldo: " +
          pesos(acuerdo->saldoPendiente()));
    if (acuerdo->liquidado()) aviso("Acuerdo liquidado.");
}

void MenuCliente::reportarAvance() {
    const int idAcuerdo = leerEntero("  Id del acuerdo: ");
    const int porcentaje = leerEntero("  Avance de obra (0-100): ");
    intentar([&] {
        ctx_.servicioAcuerdo.reportarAvance(idAcuerdo, porcentaje);
        aviso("Avance registrado. Los hitos que ya cumplen su exigencia quedan habilitados.");
    });
}

void MenuCliente::pagarHito() {
    const int idAcuerdo = leerEntero("  Id del acuerdo: ");
    const int numero = leerEntero("  Numero del hito: ");
    const std::string comprobante = leerTexto("  Numero de comprobante: ");
    const long long monto = leerMonto("  Monto pagado: ");
    intentar([&] {
        ctx_.servicioAcuerdo.pagarHito(idAcuerdo, numero, comprobante, monto);
        aviso("Pago registrado.");
    });
}

void MenuCliente::ejecutar() {
    while (true) {
        titulo("Cliente — comparar, acordar y pagar (UC3, UC4, UC8)");
        std::cout << "  1. Ver cuadro comparativo\n"
                     "  2. Poner una cotizacion en revision\n"
                     "  3. Aceptar cotizacion y generar acuerdo\n"
                     "  4. Ver acuerdo y plan de pagos\n"
                     "  5. Reportar avance de obra\n"
                     "  6. Registrar pago de un hito\n"
                     "  0. Volver"
                  << std::endl;
        switch (leerEntero("  Opcion: ")) {
            case 1: verComparativo(); break;
            case 2: ponerEnRevision(); break;
            case 3: aceptar(); break;
            case 4: verAcuerdo(); break;
            case 5: reportarAvance(); break;
            case 6: pagarHito(); break;
            case 0: return;
            default: error("Opcion no valida.");
        }
    }
}

// ===========================================================================
// MenuPrincipal
// ===========================================================================

MenuPrincipal::MenuPrincipal(Contexto& contexto) : ctx_(contexto) {}

void MenuPrincipal::ejecutar() {
    std::cout << "\n+----------------------------------------------+\n"
                 "|  Remodela sin sustos — nucleo Sprint 1       |\n"
                 "|  IUSH — Metodologias de Diseno de Software   |\n"
                 "+----------------------------------------------+"
              << std::endl;

    while (true) {
        titulo("Elige tu rol");
        std::cout << "  1. Coordinador de proyecto (UC1)\n"
                     "  2. Contratista (UC2)\n"
                     "  3. Cliente (UC3, UC4, UC8)\n"
                     "  4. Cargar datos de demostracion\n"
                     "  0. Salir"
                  << std::endl;
        switch (leerEntero("  Opcion: ")) {
            case 1: MenuCoordinador(ctx_).ejecutar(); break;
            case 2: MenuContratista(ctx_).ejecutar(); break;
            case 3: MenuCliente(ctx_).ejecutar(); break;
            case 4:
                intentar([&] {
                    cargarDatosDemo(ctx_);
                    aviso("Listo: proyecto 1, alcance 1 oficial y tres cotizaciones.");
                });
                break;
            case 0:
                aviso("Hasta luego.");
                return;
            default: error("Opcion no valida.");
        }
    }
}

// ===========================================================================
// Datos de demostracion
// ===========================================================================

void cargarDatosDemo(Contexto& ctx) {
    if (!ctx.proyectos.listar().empty()) {
        throw ReglaDeNegocio("Ya hay datos cargados; reinicia el programa para empezar limpio");
    }

    const int proyecto = ctx.servicioAlcance.crearProyecto("Remodelacion apto 502 - Laureles", 1);
    const int alcance = ctx.servicioAlcance.iniciarAlcance(proyecto);

    ctx.servicioAlcance.agregarAmbiente(alcance, "Cocina");
    ctx.servicioAlcance.agregarPartida(alcance, "Cocina", "Demolicion", "Obra gris");
    ctx.servicioAlcance.agregarMaterial(alcance, "Cocina", "Demolicion", "Escombrera", "viaje");
    ctx.servicioAlcance.agregarPartida(alcance, "Cocina", "Enchape de piso", "Acabados");
    ctx.servicioAlcance.agregarMaterial(alcance, "Cocina", "Enchape de piso", "Ceramica 60x60",
                                        "m2");
    ctx.servicioAlcance.agregarMaterial(alcance, "Cocina", "Enchape de piso", "Pegante", "bulto");

    ctx.servicioAlcance.agregarAmbiente(alcance, "Bano principal");
    ctx.servicioAlcance.agregarPartida(alcance, "Bano principal", "Cambio de aparatos",
                                       "Hidrosanitario");
    ctx.servicioAlcance.agregarMaterial(alcance, "Bano principal", "Cambio de aparatos",
                                        "Sanitario", "und");
    ctx.servicioAlcance.agregarMaterial(alcance, "Bano principal", "Cambio de aparatos",
                                        "Lavamanos", "und");

    ctx.servicioAlcance.oficializar(alcance);

    // Contratista 7: completa y enviada
    const int cotA = ctx.servicioCotizacion.crear(alcance, 7);
    ctx.servicioCotizacion.agregarItem(cotA, "Cocina / Demolicion", "viaje", 2, 180000);
    ctx.servicioCotizacion.agregarItem(cotA, "Cocina / Enchape de piso", "m2", 12.5, 62000);
    ctx.servicioCotizacion.agregarItem(cotA, "Bano principal / Cambio de aparatos", "und", 2,
                                       420000);
    ctx.servicioCotizacion.definirExclusiones(
        cotA, "No incluye redes hidraulicas nuevas ni traslado del punto de gas.");
    ctx.servicioCotizacion.agregarHito(cotA, "Anticipo", 40);
    ctx.servicioCotizacion.agregarHito(cotA, "Avance de obra", 30);
    ctx.servicioCotizacion.agregarHito(cotA, "Entrega final", 30);
    ctx.servicioCotizacion.enviar(cotA);

    // Contratista 8: mas economica, excluye mas cosas
    const int cotB = ctx.servicioCotizacion.crear(alcance, 8);
    ctx.servicioCotizacion.agregarItem(cotB, "Cocina / Demolicion", "viaje", 2, 150000);
    ctx.servicioCotizacion.agregarItem(cotB, "Cocina / Enchape de piso", "m2", 12.5, 55000);
    ctx.servicioCotizacion.agregarItem(cotB, "Bano principal / Cambio de aparatos", "und", 2,
                                       360000);
    ctx.servicioCotizacion.definirExclusiones(
        cotB, "No incluye griferia, iluminacion ni retiro de escombros del edificio.");
    ctx.servicioCotizacion.agregarHito(cotB, "Anticipo", 50);
    ctx.servicioCotizacion.agregarHito(cotB, "Entrega final", 50);
    ctx.servicioCotizacion.enviar(cotB);

    // Contratista 9: queda en borrador a proposito, para mostrar que el cliente no la ve
    const int cotC = ctx.servicioCotizacion.crear(alcance, 9);
    ctx.servicioCotizacion.agregarItem(cotC, "Cocina / Demolicion", "viaje", 2, 120000);
}

}  // namespace ui