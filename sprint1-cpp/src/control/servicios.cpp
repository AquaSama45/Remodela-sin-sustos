#include "servicios.h"

#include <algorithm>
#include <iomanip>
#include <sstream>

#include "../dominio/enums.h"
#include "../dominio/regla_negocio.h"

namespace control {

using dominio::ReglaDeNegocio;

// ===========================================================================
// ServicioAlcance — UC1
// ===========================================================================

ServicioAlcance::ServicioAlcance(persistencia::IRepositorioProyectos& proyectos,
                                 persistencia::IRepositorioAlcances& alcances)
    : proyectos_(proyectos), alcances_(alcances) {}

dominio::Alcance& ServicioAlcance::exigirAlcance(int idAlcance) {
    dominio::Alcance* alcance = alcances_.buscar(idAlcance);
    if (alcance == nullptr) {
        throw ReglaDeNegocio("No existe el alcance " + std::to_string(idAlcance));
    }
    return *alcance;
}

int ServicioAlcance::crearProyecto(const std::string& nombre, int idCliente) {
    dominio::Proyecto proyecto(proyectos_.siguienteId(), nombre, idCliente);
    return proyectos_.guardar(proyecto);
}

int ServicioAlcance::iniciarAlcance(int idProyecto) {
    if (proyectos_.buscar(idProyecto) == nullptr) {
        throw ReglaDeNegocio("No existe el proyecto " + std::to_string(idProyecto));
    }
    // RF-01: un proyecto tiene un unico alcance
    if (alcances_.buscarPorProyecto(idProyecto) != nullptr) {
        throw ReglaDeNegocio("El proyecto " + std::to_string(idProyecto) + " ya tiene alcance");
    }
    dominio::Alcance alcance(alcances_.siguienteId(), idProyecto);
    return alcances_.guardar(alcance);
}

void ServicioAlcance::agregarAmbiente(int idAlcance, const std::string& nombre) {
    exigirAlcance(idAlcance).agregarAmbiente(dominio::Ambiente(nombre));
}

void ServicioAlcance::agregarPartida(int idAlcance, const std::string& ambiente,
                                     const std::string& partida, const std::string& categoria) {
    exigirAlcance(idAlcance).agregarPartidaA(ambiente,
                                             dominio::PartidaTrabajo(partida, categoria));
}

void ServicioAlcance::agregarMaterial(int idAlcance, const std::string& ambiente,
                                      const std::string& partida, const std::string& material,
                                      const std::string& unidad) {
    exigirAlcance(idAlcance).agregarMaterialA(ambiente, partida,
                                              dominio::Material(material, unidad));
}

std::vector<std::string> ServicioAlcance::faltantes(int idAlcance) {
    return exigirAlcance(idAlcance).faltantes();
}

void ServicioAlcance::oficializar(int idAlcance) {
    dominio::Alcance& alcance = exigirAlcance(idAlcance);
    dominio::Proyecto* proyecto = proyectos_.buscar(alcance.idProyecto());
    if (proyecto == nullptr) {
        throw ReglaDeNegocio("El alcance quedo huerfano de proyecto");
    }
    // Se valida antes de mutar: si el proyecto ya no admite abrirse a cotizacion,
    // el alcance no debe quedar oficializado a medias.
    if (proyecto->estado() != dominio::EstadoProyecto::PLANIFICACION) {
        throw ReglaDeNegocio("El proyecto ya paso la etapa de planificacion");
    }
    alcance.oficializar();
    proyecto->abrirACotizacion();
}

// ===========================================================================
// ServicioCotizacion — UC2
// ===========================================================================

ServicioCotizacion::ServicioCotizacion(persistencia::IRepositorioCotizaciones& cotizaciones,
                                       persistencia::IRepositorioAlcances& alcances)
    : cotizaciones_(cotizaciones), alcances_(alcances) {}

dominio::Cotizacion& ServicioCotizacion::exigirCotizacion(int idCotizacion) {
    dominio::Cotizacion* cotizacion = cotizaciones_.buscar(idCotizacion);
    if (cotizacion == nullptr) {
        throw ReglaDeNegocio("No existe la cotizacion " + std::to_string(idCotizacion));
    }
    return *cotizacion;
}

dominio::Alcance& ServicioCotizacion::exigirAlcanceDe(const dominio::Cotizacion& cotizacion) {
    dominio::Alcance* alcance = alcances_.buscar(cotizacion.idAlcance());
    if (alcance == nullptr) {
        throw ReglaDeNegocio("La cotizacion apunta a un alcance inexistente");
    }
    return *alcance;
}

int ServicioCotizacion::crear(int idAlcance, int idContratista) {
    dominio::Alcance* alcance = alcances_.buscar(idAlcance);
    if (alcance == nullptr) {
        throw ReglaDeNegocio("No existe el alcance " + std::to_string(idAlcance));
    }
    if (!alcance->esOficial()) {
        throw ReglaDeNegocio("No se cotiza sobre un alcance en borrador: falta oficializarlo (UC1)");
    }
    // Un contratista no mantiene dos ofertas vivas sobre el mismo alcance; si quiere
    // cambiar valores, versiona la que ya tiene (UC2 A1).
    for (const dominio::Cotizacion* existente : cotizaciones_.listarPorAlcance(idAlcance)) {
        if (existente->idContratista() == idContratista && !existente->esFinal()) {
            throw ReglaDeNegocio("El contratista ya tiene la cotizacion " +
                                 std::to_string(existente->idCotizacion()) +
                                 " abierta sobre este alcance");
        }
    }
    dominio::Cotizacion cotizacion(cotizaciones_.siguienteId(), idAlcance, idContratista);
    return cotizaciones_.guardar(cotizacion);
}

void ServicioCotizacion::agregarItem(int idCotizacion, const std::string& partida,
                                     const std::string& unidad, double cantidad,
                                     long long valorUnitario) {
    exigirCotizacion(idCotizacion)
        .agregarItem(dominio::DetalleCotizacion(partida, unidad, cantidad, valorUnitario));
}

void ServicioCotizacion::definirExclusiones(int idCotizacion, const std::string& texto) {
    exigirCotizacion(idCotizacion).definirExclusiones(texto);
}

void ServicioCotizacion::agregarHito(int idCotizacion, const std::string& descripcion,
                                     int porcentaje) {
    exigirCotizacion(idCotizacion)
        .agregarHitoPropuesto(dominio::HitoPropuesto(descripcion, porcentaje));
}

std::vector<std::string> ServicioCotizacion::faltantesParaEnvio(int idCotizacion) {
    dominio::Cotizacion& cotizacion = exigirCotizacion(idCotizacion);
    return cotizacion.faltantesParaEnvio(exigirAlcanceDe(cotizacion));
}

void ServicioCotizacion::enviar(int idCotizacion) {
    dominio::Cotizacion& cotizacion = exigirCotizacion(idCotizacion);
    cotizacion.enviar(exigirAlcanceDe(cotizacion));
}

int ServicioCotizacion::crearNuevaVersion(int idCotizacion) {
    dominio::Cotizacion& anterior = exigirCotizacion(idCotizacion);
    dominio::Cotizacion siguiente = anterior.nuevaVersion(cotizaciones_.siguienteId());
    return cotizaciones_.guardar(siguiente);
}

// ===========================================================================
// ServicioAcuerdo — UC3, UC4 y UC8
// ===========================================================================

ServicioAcuerdo::ServicioAcuerdo(persistencia::IRepositorioCotizaciones& cotizaciones,
                                 persistencia::IRepositorioAcuerdos& acuerdos,
                                 persistencia::IRepositorioAlcances& alcances,
                                 persistencia::IRepositorioProyectos& proyectos)
    : cotizaciones_(cotizaciones),
      acuerdos_(acuerdos),
      alcances_(alcances),
      proyectos_(proyectos) {}

dominio::AcuerdoFormal& ServicioAcuerdo::exigirAcuerdo(int idAcuerdo) {
    dominio::AcuerdoFormal* acuerdo = acuerdos_.buscar(idAcuerdo);
    if (acuerdo == nullptr) {
        throw ReglaDeNegocio("No existe el acuerdo " + std::to_string(idAcuerdo));
    }
    return *acuerdo;
}

std::vector<FilaComparacion> ServicioAcuerdo::comparar(int idAlcance) {
    dominio::Alcance* alcance = alcances_.buscar(idAlcance);
    if (alcance == nullptr) {
        throw ReglaDeNegocio("No existe el alcance " + std::to_string(idAlcance));
    }

    std::vector<FilaComparacion> filas;
    for (const dominio::Cotizacion* cotizacion : cotizaciones_.listarPorAlcance(idAlcance)) {
        // El cliente compara ofertas, no borradores del contratista
        if (cotizacion->editable()) continue;

        FilaComparacion fila;
        fila.idCotizacion = cotizacion->idCotizacion();
        fila.idContratista = cotizacion->idContratista();
        fila.version = cotizacion->version();
        fila.total = cotizacion->total();
        fila.estado = cotizacion->estado();
        fila.exclusiones = cotizacion->exclusiones();
        for (const auto& item : cotizacion->items()) {
            fila.porPartida.emplace_back(item.partida(), item.subtotal());
        }
        filas.push_back(fila);
    }

    // RF-02: el valor es lo primero que el cliente contrasta
    std::sort(filas.begin(), filas.end(),
              [](const FilaComparacion& a, const FilaComparacion& b) { return a.total < b.total; });
    return filas;
}

void ServicioAcuerdo::ponerEnRevision(int idCotizacion) {
    dominio::Cotizacion* cotizacion = cotizaciones_.buscar(idCotizacion);
    if (cotizacion == nullptr) {
        throw ReglaDeNegocio("No existe la cotizacion " + std::to_string(idCotizacion));
    }
    cotizacion->iniciarRevision();
}

int ServicioAcuerdo::aceptar(int idCotizacion) {
    // 1. Reunir todo lo necesario antes de modificar nada
    dominio::Cotizacion* cotizacion = cotizaciones_.buscar(idCotizacion);
    if (cotizacion == nullptr) {
        throw ReglaDeNegocio("No existe la cotizacion " + std::to_string(idCotizacion));
    }
    dominio::Alcance* alcance = alcances_.buscar(cotizacion->idAlcance());
    if (alcance == nullptr) {
        throw ReglaDeNegocio("La cotizacion apunta a un alcance inexistente");
    }
    dominio::Proyecto* proyecto = proyectos_.buscar(alcance->idProyecto());
    if (proyecto == nullptr) {
        throw ReglaDeNegocio("El alcance quedo huerfano de proyecto");
    }
    if (proyecto->estado() != dominio::EstadoProyecto::COTIZACION) {
        throw ReglaDeNegocio("El proyecto no esta en etapa de cotizacion");
    }

    // 2. La entidad decide si puede aceptarse (el patron State lo exige en EN_REVISION)
    cotizacion->aceptar();

    // 3. Nace el acuerdo formal congelando valor, exclusiones y plan de pagos
    dominio::AcuerdoFormal acuerdo = dominio::AcuerdoFormal::generarDesde(
        acuerdos_.siguienteId(), *cotizacion, proyecto->idCliente());
    const int idAcuerdo = acuerdos_.guardar(acuerdo);

    // 4. Aceptar una cierra las demas: el cliente no queda con ofertas vivas sueltas
    for (dominio::Cotizacion* otra : cotizaciones_.listarPorAlcance(alcance->idAlcance())) {
        if (otra->idCotizacion() == idCotizacion) continue;
        if (otra->editable() || otra->esFinal()) continue;
        otra->rechazar("Se acepto la cotizacion " + std::to_string(idCotizacion));
    }

    // 5. El proyecto arranca obra
    proyecto->iniciarEjecucion();

    return idAcuerdo;
}

void ServicioAcuerdo::reportarAvance(int idAcuerdo, int porcentaje) {
    exigirAcuerdo(idAcuerdo).registrarAvance(porcentaje);
}

void ServicioAcuerdo::pagarHito(int idAcuerdo, int numeroHito, const std::string& comprobante,
                                long long montoPagado) {
    exigirAcuerdo(idAcuerdo).pagarHito(numeroHito, comprobante, montoPagado);
}

// ===========================================================================
// ServicioAvance - UC5 y US-06
// ===========================================================================

ServicioAvance::ServicioAvance(persistencia::IRepositorioAcuerdos& acuerdos,
                               persistencia::IRepositorioReportes& reportes,
                               persistencia::PuertoNotificacion& notificador,
                               double umbralPorcentual)
    : acuerdos_(acuerdos),
      reportes_(reportes),
      notificador_(notificador),
      umbral_(umbralPorcentual) {}

double ServicioAvance::umbral() const { return umbral_; }

std::vector<const dominio::ReporteAvance*> ServicioAvance::historial(int idAcuerdo) const {
    return reportes_.listarPorAcuerdo(idAcuerdo);
}

int ServicioAvance::registrarAvance(int idAcuerdo, int avanceGeneral,
                                    long long costoRealAcumulado) {
    dominio::AcuerdoFormal* acuerdo = acuerdos_.buscar(idAcuerdo);
    if (acuerdo == nullptr) {
        throw ReglaDeNegocio("No existe el acuerdo " + std::to_string(idAcuerdo));
    }
    // Precondicion del UC5: el acuerdo debe estar vigente
    if (acuerdo->liquidado()) {
        throw ReglaDeNegocio("El acuerdo ya esta liquidado: la obra se cerro");
    }

    // UC5 E1: el avance general no puede ser menor o igual al ultimo reportado
    const int vigente = acuerdo->avanceReportado();
    if (avanceGeneral <= vigente) {
        throw ReglaDeNegocio("El avance reportado debe superar el vigente, que es " +
                             std::to_string(vigente) + "%");
    }

    // Figura 6, mensajes 6 y 7: se crea el reporte y se le pide su propia desviacion
    dominio::ReporteAvance reporte(reportes_.siguienteId(), idAcuerdo, avanceGeneral,
                                   costoRealAcumulado);
    reporte.calcularDesviacion(acuerdo->costoEsperadoPara(avanceGeneral));
    const int idReporte = reportes_.guardar(reporte);

    // El avance de obra habilita los hitos que ya cumplen su exigencia (enlace con UC8)
    acuerdo->registrarAvance(avanceGeneral);

    std::ostringstream detalle;
    detalle << std::fixed << std::setprecision(1);
    detalle << "Avance " << avanceGeneral << "%. Costo real $" << reporte.costoRealAcumulado()
            << " frente a $" << reporte.costoEsperado() << " esperado. Desviacion $"
            << reporte.desviacionCosto() << " (" << reporte.desviacionPorcentual()
            << "%), umbral " << umbral_ << "%.";

    // Figura 6, mensaje 11 y fragmento opt: el servicio decide, el puerto envia
    const std::string asunto = "Acuerdo " + std::to_string(idAcuerdo);
    if (reporte.requiereAlerta(umbral_)) {
        notificador_.enviarAlerta("Coordinador de Obra", "Sobrecosto en el " + asunto,
                                  detalle.str());
    } else {
        notificador_.enviarConfirmacion("Coordinador de Obra", "Avance registrado en el " + asunto,
                                        detalle.str());
    }
    return idReporte;
}

}  // namespace control