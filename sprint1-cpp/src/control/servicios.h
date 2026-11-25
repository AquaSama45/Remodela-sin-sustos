#ifndef CONTROL_SERVICIOS_H
#define CONTROL_SERVICIOS_H

#include <string>
#include <utility>
#include <vector>

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
    ServicioAlcance(persistencia::RepositorioProyectos& proyectos,
                    persistencia::RepositorioAlcances& alcances);

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

    persistencia::RepositorioProyectos& proyectos_;
    persistencia::RepositorioAlcances& alcances_;
};

// UC2: el contratista arma y envia su cotizacion
class ServicioCotizacion {
public:
    ServicioCotizacion(persistencia::RepositorioCotizaciones& cotizaciones,
                       persistencia::RepositorioAlcances& alcances);

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

    persistencia::RepositorioCotizaciones& cotizaciones_;
    persistencia::RepositorioAlcances& alcances_;
};

// UC3 y UC4: comparacion, aceptacion y vida del acuerdo (incluye UC8)
class ServicioAcuerdo {
public:
    ServicioAcuerdo(persistencia::RepositorioCotizaciones& cotizaciones,
                    persistencia::RepositorioAcuerdos& acuerdos,
                    persistencia::RepositorioAlcances& alcances,
                    persistencia::RepositorioProyectos& proyectos);

    std::vector<FilaComparacion> comparar(int idAlcance);  // UC3
    void ponerEnRevision(int idCotizacion);                // UC3
    int aceptar(int idCotizacion);                         // UC4, devuelve el id del acuerdo

    void reportarAvance(int idAcuerdo, int porcentaje);
    void pagarHito(int idAcuerdo, int numeroHito, const std::string& comprobante,
                   long long montoPagado);  // UC8

private:
    dominio::AcuerdoFormal& exigirAcuerdo(int idAcuerdo);

    persistencia::RepositorioCotizaciones& cotizaciones_;
    persistencia::RepositorioAcuerdos& acuerdos_;
    persistencia::RepositorioAlcances& alcances_;
    persistencia::RepositorioProyectos& proyectos_;
};

}  // namespace control

#endif