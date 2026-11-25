# Remodela sin sustos — nucleo de consola del Sprint 1
# Uso:  make        compila en build/remodela
#       make run    compila y ejecuta
#       make clean  borra los objetos y el binario

CXX      := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -Isrc
BUILD    := build
BINARIO  := $(BUILD)/remodela

FUENTES  := src/main.cpp
FUENTES  += src/dominio/enums.cpp
FUENTES  += src/dominio/alcance.cpp
FUENTES  += src/dominio/estado_cotizacion.cpp
FUENTES  += src/dominio/cotizacion.cpp
FUENTES  += src/dominio/proyecto.cpp
FUENTES  += src/dominio/acuerdo_formal.cpp
FUENTES  += src/persistencia/repositorios_memoria.cpp
FUENTES  += src/control/servicios.cpp
FUENTES  += src/ui/consola.cpp
FUENTES  += src/ui/menus.cpp

OBJETOS  := $(FUENTES:src/%.cpp=$(BUILD)/%.o)

all: $(BINARIO)

$(BINARIO): $(OBJETOS)
	@mkdir -p $(dir $@)
	$(CXX) $(CXXFLAGS) $^ -o $@
	@echo "Listo: $@"

$(BUILD)/%.o: src/%.cpp
	@mkdir -p $(dir $@)
	$(CXX) $(CXXFLAGS) -c $< -o $@

run: $(BINARIO)
	./$(BINARIO)

clean:
	rm -rf $(BUILD)

.PHONY: all run clean