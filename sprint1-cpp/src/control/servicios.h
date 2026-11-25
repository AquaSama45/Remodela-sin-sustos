#ifndef CONTROL_SERVICIOS_H
#define CONTROL_SERVICIOS_H

#include <string>
#include <utility>
#include <vector>

#include "../persistencia/puerto_notificacion.h"
#include "../persistencia/repositorios.h"

namespace control {

// Fila del cuadro comparativo del UC3: una oferta medida contra el mismo alcance
struct FilaComparacion {
    int idCotizacion;
    int idContratista;
    int version;
    long long total;
    std::string estado;
    std::string exclusiones;
    std::vector<std::pair<std::string, long long>> porPartida;
};

// Clases <<control>>.
// Coordinan: buscan en los repositorios, piden a las entidades que apliquen sus
// reglas y guardan el resultado. No contienen reglas de negocio propias ni imprimen
// nada: eso es del dominio y de la consola. Reciben sus dependencias por el
// constructor (principio D de SOLID), nunca las construyen adentro.

// UC1: definicion del alcance
class ServicioAlcance {
public:
    ServicioAlcance(persistencia::IRepositorioProyectos& proyectos,
                    persistencia::IRepositorioAlcances& alcances);

    int crearProyecto(const std::string& nombre, int idCliente);
    int iniciarAlcance(int idProyecto);

    void agregarAmbiente(int idAlcance, const std::string& nombre);
    void agregarPartida(int idAlcance, const std::string& ambiente, const std::string& partida,
                        const std::string& categoria);
    void agregarMaterial(int idAlcance, const std::string& ambiente, const std::string& partida,
                         const std::string& material, const std::string& unidad);

    std::vector<std::string> faltantes(int idAlcance);
    void oficializar(int idAlcance);  // UC1 pasos 5-6

private:
    dominio::Alcance& exigirAlcance(int idAlcance);

    persistencia::IRepositorioProyectos& proyectos_;
    persistencia::IRepositorioAlcances& alcances_;
};

// UC2: el contratista arma y envia su cotizacion
class ServicioCotizacion {
public:
    ServicioCotizacion(persistencia::IRepositorioCotizaciones& cotizaciones,
                       persistencia::IRepositorioAlcances& alcances);

    int crear(int idAlcance, int idContratista);

    void agregarItem(int idCotizacion, const std::string& partida, const std::string& unidad,
                     double cantidad, long long valorUnitario);
    void definirExclusiones(int idCotizacion, const std::string& texto);
    void agregarHito(int idCotizacion, const std::string& descripcion, int porcentaje);

    std::vector<std::string> faltantesParaEnvio(int idCotizacion);
    void enviar(int idCotizacion);          // UC2 paso 5
    int crearNuevaVersion(int idCotizacion);  // UC2 A1

private:
    dominio::Cotizacion& exigirCotizacion(int idCotizacion);
    dominio::Alcance& exigirAlcanceDe(const dominio::Cotizacion& cotizacion);

    persistencia::IRepositorioCotizaciones& cotizaciones_;
    persistencia::IRepositorioAlcances& alcances_;
};

// UC3 y UC4: comparacion, aceptacion y vida del acuerdo (incluye UC8)
class ServicioAcuerdo {
public:
    ServicioAcuerdo(persistencia::IRepositorioCotizaciones& cotizaciones,
                    persistencia::IRepositorioAcuerdos& acuerdos,
                    persistencia::IRepositorioAlcances& alcances,
                    persistencia::IRepositorioProyectos& proyectos);

    std::vector<FilaComparacion> comparar(int idAlcance);  // UC3
    void ponerEnRevision(int idCotizacion);                // UC3
    int aceptar(int idCotizacion);                         // UC4, devuelve el id del acuerdo

    void reportarAvance(int idAcuerdo, int porcentaje);
    void pagarHito(int idAcuerdo, int numeroHito, const std::string& comprobante,
                   long long montoPagado);  // UC8

private:
    dominio::AcuerdoFormal& exigirAcuerdo(int idAcuerdo);

    persistencia::IRepositorioCotizaciones& cotizaciones_;
    persistencia::IRepositorioAcuerdos& acuerdos_;
    persistencia::IRepositorioAlcances& alcances_;
    persistencia::IRepositorioProyectos& proyectos_;
};

// UC5: reporte de avance y alerta de desviacion de costo
class ServicioAvance {
public:
    // RF-09: umbral parametrizable; 10 % por defecto
    static constexpr double UMBRAL_DEFECTO = 10.0;

    ServicioAvance(persistencia::IRepositorioAcuerdos& acuerdos,
                   persistencia::IRepositorioReportes& reportes,
                   persistencia::PuertoNotificacion& notificador,
                   double umbralPorcentual = UMBRAL_DEFECTO);

    // Devuelve el id del reporte creado. Dispara la alerta si procede.
    int registrarAvance(int idAcuerdo, int avanceGeneral, long long costoRealAcumulado);

    std::vector<const dominio::ReporteAvance*> historial(int idAcuerdo) const;
    double umbral() const;

private:
    persistencia::IRepositorioAcuerdos& acuerdos_;
    persistencia::IRepositorioReportes& reportes_;
    persistencia::PuertoNotificacion& notificador_;
    double umbral_;
};

}  // namespace control

#endif