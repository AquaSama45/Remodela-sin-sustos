#include "alcance.h"

#include <algorithm>
#include <set>

#include "regla_negocio.h"

namespace dominio {

namespace {

// Une textos con ", " sin repetirlos ni dejar separadores sueltos
std::string unir(const std::vector<std::string>& partes) {
    std::string resultado;
    for (const auto& parte : partes) {
        if (!resultado.empty()) resultado += ", ";
        resultado += parte;
    }
    return resultado;
}

}  // namespace

// ----- Material -----

Material::Material(std::string nombre, std::string unidad)
    : nombre_(std::move(nombre)), unidad_(std::move(unidad)) {
    if (nombre_.empty()) throw ReglaDeNegocio("El material necesita un nombre");
}

const std::string& Material::nombre() const { return nombre_; }
const std::string& Material::unidad() const { return unidad_; }

// ----- PartidaTrabajo -----

PartidaTrabajo::PartidaTrabajo(std::string nombre, std::string categoria)
    : nombre_(std::move(nombre)), categoria_(std::move(categoria)) {
    if (nombre_.empty()) throw ReglaDeNegocio("La partida de trabajo necesita un nombre");
}

const std::string& PartidaTrabajo::nombre() const { return nombre_; }
const std::string& PartidaTrabajo::categoria() const { return categoria_; }
const std::vector<Material>& PartidaTrabajo::materiales() const { return materiales_; }

void PartidaTrabajo::agregarMaterial(const Material& material) {
    materiales_.push_back(material);
}

bool PartidaTrabajo::tieneMateriales() const { return !materiales_.empty(); }

// ----- Ambiente -----

Ambiente::Ambiente(std::string nombre) : nombre_(std::move(nombre)) {
    if (nombre_.empty()) throw ReglaDeNegocio("El ambiente necesita un nombre");
}

const std::string& Ambiente::nombre() const { return nombre_; }
const std::vector<PartidaTrabajo>& Ambiente::partidas() const { return partidas_; }

void Ambiente::agregarPartida(const PartidaTrabajo& partida) {
    if (buscarPartida(partida.nombre()) != nullptr) {
        throw ReglaDeNegocio("El ambiente " + nombre_ + " ya tiene la partida " + partida.nombre());
    }
    partidas_.push_back(partida);
}

PartidaTrabajo* Ambiente::buscarPartida(const std::string& nombre) {
    auto it = std::find_if(partidas_.begin(), partidas_.end(),
                           [&](const PartidaTrabajo& p) { return p.nombre() == nombre; });
    return it == partidas_.end() ? nullptr : &(*it);
}

bool Ambiente::tienePartidas() const { return !partidas_.empty(); }

// ----- Alcance -----

Alcance::Alcance(int idAlcance, int idProyecto)
    : idAlcance_(idAlcance), idProyecto_(idProyecto), estado_(EstadoAlcance::BORRADOR) {}

int Alcance::idAlcance() const { return idAlcance_; }
int Alcance::idProyecto() const { return idProyecto_; }
EstadoAlcance Alcance::estado() const { return estado_; }
const std::vector<Ambiente>& Alcance::ambientes() const { return ambientes_; }

bool Alcance::esOficial() const { return estado_ == EstadoAlcance::OFICIAL; }

// UC1 regla: el alcance oficial no se edita; un cambio posterior pasa por UC9
void Alcance::exigirBorrador() const {
    if (esOficial()) {
        throw ReglaDeNegocio(
            "El alcance ya es oficial; para modificarlo se registra un cambio de alcance (UC9)");
    }
}

void Alcance::agregarAmbiente(const Ambiente& ambiente) {
    exigirBorrador();
    if (buscarAmbiente(ambiente.nombre()) != nullptr) {
        throw ReglaDeNegocio("El alcance ya tiene el ambiente " + ambiente.nombre());
    }
    ambientes_.push_back(ambiente);
}

Ambiente* Alcance::buscarAmbiente(const std::string& nombre) {
    auto it = std::find_if(ambientes_.begin(), ambientes_.end(),
                           [&](const Ambiente& a) { return a.nombre() == nombre; });
    return it == ambientes_.end() ? nullptr : &(*it);
}

bool Alcance::tieneAmbiente(const std::string& nombre) const {
    return std::any_of(ambientes_.begin(), ambientes_.end(),
                       [&](const Ambiente& a) { return a.nombre() == nombre; });
}

void Alcance::agregarPartidaA(const std::string& nombreAmbiente, const PartidaTrabajo& partida) {
    exigirBorrador();
    Ambiente* ambiente = buscarAmbiente(nombreAmbiente);
    if (ambiente == nullptr) {
        throw ReglaDeNegocio("El alcance no tiene el ambiente " + nombreAmbiente);
    }
    ambiente->agregarPartida(partida);
}

void Alcance::agregarMaterialA(const std::string& nombreAmbiente, const std::string& nombrePartida,
                               const Material& material) {
    exigirBorrador();
    Ambiente* ambiente = buscarAmbiente(nombreAmbiente);
    if (ambiente == nullptr) {
        throw ReglaDeNegocio("El alcance no tiene el ambiente " + nombreAmbiente);
    }
    PartidaTrabajo* partida = ambiente->buscarPartida(nombrePartida);
    if (partida == nullptr) {
        throw ReglaDeNegocio("El ambiente " + nombreAmbiente + " no tiene la partida " +
                             nombrePartida);
    }
    partida->agregarMaterial(material);
}

std::vector<std::string> Alcance::faltantes() const {
    std::vector<std::string> pendientes;
    if (ambientes_.empty()) {
        pendientes.push_back("El alcance no tiene ningun ambiente");
        return pendientes;
    }
    for (const auto& ambiente : ambientes_) {
        if (!ambiente.tienePartidas()) {
            pendientes.push_back(ambiente.nombre() + ": no tiene partidas de trabajo");
            continue;
        }
        for (const auto& partida : ambiente.partidas()) {
            if (!partida.tieneMateriales()) {
                pendientes.push_back(ambiente.nombre() + " / " + partida.nombre() +
                                     ": no tiene materiales");
            }
        }
    }
    return pendientes;
}

bool Alcance::validarCompletitud() const { return faltantes().empty(); }

void Alcance::oficializar() {
    exigirBorrador();
    if (!validarCompletitud()) {
        throw ReglaDeNegocio("El alcance esta incompleto y no puede oficializarse (UC1)");
    }
    estado_ = EstadoAlcance::OFICIAL;
}

std::string Alcance::descripcionAmbientes() const {
    std::vector<std::string> nombres;
    for (const auto& ambiente : ambientes_) nombres.push_back(ambiente.nombre());
    return unir(nombres);
}

std::string Alcance::partidasDeTrabajo() const {
    std::vector<std::string> nombres;
    for (const auto& ambiente : ambientes_) {
        for (const auto& partida : ambiente.partidas()) nombres.push_back(partida.nombre());
    }
    return unir(nombres);
}

std::string Alcance::materialesSeleccionados() const {
    std::set<std::string> unicos;
    std::vector<std::string> nombres;
    for (const auto& ambiente : ambientes_) {
        for (const auto& partida : ambiente.partidas()) {
            for (const auto& material : partida.materiales()) {
                if (unicos.insert(material.nombre()).second) nombres.push_back(material.nombre());
            }
        }
    }
    return unir(nombres);
}

}  // namespace dominio