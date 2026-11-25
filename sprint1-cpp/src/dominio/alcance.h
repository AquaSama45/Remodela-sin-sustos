#ifndef DOMINIO_ALCANCE_H
#define DOMINIO_ALCANCE_H

#include <string>
#include <vector>

#include "enums.h"

namespace dominio {

// Material <<entity>> — RF-02: material previsto para una partida de trabajo
class Material {
public:
    Material(std::string nombre, std::string unidad);

    const std::string& nombre() const;
    const std::string& unidad() const;

private:
    std::string nombre_;
    std::string unidad_;
};

// PartidaTrabajo <<entity>> — RF-02. Compone materiales (rombo negro en el diagrama).
class PartidaTrabajo {
public:
    PartidaTrabajo(std::string nombre, std::string categoria);

    const std::string& nombre() const;
    const std::string& categoria() const;
    const std::vector<Material>& materiales() const;

    void agregarMaterial(const Material& material);
    bool tieneMateriales() const;

private:
    std::string nombre_;
    std::string categoria_;
    std::vector<Material> materiales_;
};

// Ambiente <<entity>> — RF-02. Compone partidas de trabajo.
class Ambiente {
public:
    explicit Ambiente(std::string nombre);

    const std::string& nombre() const;
    const std::vector<PartidaTrabajo>& partidas() const;

    void agregarPartida(const PartidaTrabajo& partida);
    PartidaTrabajo* buscarPartida(const std::string& nombre);
    bool tienePartidas() const;

private:
    std::string nombre_;
    std::vector<PartidaTrabajo> partidas_;
};

// Alcance <<entity>> — RF-01, RF-02, UC1.
// Un proyecto tiene un unico alcance oficial (RF-01); su estructura comun de
// ambientes, partidas y materiales es la base de comparacion de las cotizaciones (RF-02).
class Alcance {
public:
    Alcance(int idAlcance, int idProyecto);

    int idAlcance() const;
    int idProyecto() const;
    EstadoAlcance estado() const;
    const std::vector<Ambiente>& ambientes() const;

    bool esOficial() const;

        void agregarAmbiente(const Ambiente& ambiente);

    // El alcance es la raiz del agregado: nadie modifica su interior por fuera de
    // estos metodos, para que la regla de "oficial no se edita" no tenga rendijas.
    void agregarPartidaA(const std::string& nombreAmbiente, const PartidaTrabajo& partida);
    void agregarMaterialA(const std::string& nombreAmbiente, const std::string& nombrePartida,
                          const Material& material);

    bool tieneAmbiente(const std::string& nombre) const;

    // + validarCompletitud(): Boolean — UC1 E1
    bool validarCompletitud() const;

    // Detalle de lo que impide oficializar el alcance (para mostrarlo al usuario)
    std::vector<std::string> faltantes() const;

    // UC1 pasos 5-6: sella el alcance como definicion oficial unica del proyecto
    void oficializar();

    // Atributos derivados del diagrama, calculados desde la estructura
    std::string descripcionAmbientes() const;
    std::string partidasDeTrabajo() const;
    std::string materialesSeleccionados() const;

private:
    void exigirBorrador() const;
    Ambiente* buscarAmbiente(const std::string& nombre);

    int idAlcance_;
    int idProyecto_;
    EstadoAlcance estado_;
    std::vector<Ambiente> ambientes_;
};

}  // namespace dominio

#endif