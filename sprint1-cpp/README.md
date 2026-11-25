# Núcleo de consola — Sprint 1

Implementación en C++17 del núcleo de negocio de **Remodela sin sustos**, el ERP de
cotización de remodelación del hogar.

IUSH — Aplicación de Metodologías de Diseño de Software
Juan Esteban Acevedo Patiño (202420016) · Johan Emmanuel David Garcés (202410243)

## Compilar y ejecutar

Requiere `g++` con soporte de C++17. No usa librerías externas.

```bash
make        # compila en build/remodela
make run    # compila y ejecuta
make clean  # borra objetos y binario
```

Dentro del programa, la opción **4 (cargar datos de demostración)** deja un proyecto
con alcance oficial y tres cotizaciones listas para recorrer el flujo completo.

## Arquitectura en capas

Las cuatro capas corresponden a los estereotipos UML del diagrama de clases, y la
dependencia va siempre hacia adentro: la consola conoce al control, el control conoce
al dominio, y el dominio no conoce a nadie.

| Carpeta | Estereotipo | Qué contiene | Clases |
|---|---|---|---|
| `src/dominio/` | `<<entity>>` | Entidades y todas las reglas de negocio | 21 |
| `src/persistencia/` | `<<repository>>` | 4 interfaces + 4 implementaciones en memoria | 8 |
| `src/control/` | `<<control>>` | Servicios que coordinan los casos de uso | 4 |
| `src/ui/` | `<<boundary>>` | Menús de consola por rol | 6 |

`src/main.cpp` es el punto de ensamblaje: el único lugar donde se eligen las
implementaciones concretas.

Dos comprobaciones de que la separación es real y no decorativa:

```bash
grep -r iostream src/dominio/     # vacío: el dominio no sabe que hay pantalla
grep -rn "catch (const ReglaDeNegocio" src/   # un solo punto, en src/ui/menus.cpp
```

## Casos de uso cubiertos

| UC | Nombre | Rol | Dónde |
|---|---|---|---|
| UC1 | Definir el alcance del proyecto | Coordinador | `alcance.*`, `ServicioAlcance` |
| UC2 | Elaborar y enviar cotización | Contratista | `cotizacion.*`, `estado_cotizacion.*`, `ServicioCotizacion` |
| UC3 | Comparar cotizaciones | Cliente | `ServicioAcuerdo::comparar` |
| UC4 | Formalizar el acuerdo | Cliente | `acuerdo_formal.*`, `ServicioAcuerdo::aceptar` |
| UC8 | Registrar pago de hito | Cliente | `EstadoHito`, `AcuerdoFormal::pagarHito` |

## Patrón GoF aplicado: State

Aplicado dos veces, con jerarquías independientes:

- **`Cotizacion`** — `BORRADOR → ENVIADA → EN_REVISION → ACEPTADA | RECHAZADA`
- **`HitoDePago`** — `PENDIENTE_DE_AVANCE → HABILITADO → PAGADO`

Cada estado es una clase que decide qué operaciones son legales. La implementación por
defecto de cada transición la rechaza, así que un estado concreto sobrescribe solo lo
que permite, y agregar un estado nuevo no obliga a editar ningún `switch`.

Los estados no tienen datos: son singletons (`Borrador::instancia()`), por eso el
programa no usa `new` ni `delete` en ninguna parte.

## La regla que da nombre al proyecto

El plan de pagos del acuerdo exige que **lo pagado nunca se adelante al avance de
obra**, salvo el anticipo. Para un plan 40/30/30:

| # | Hito | % del valor | Avance de obra exigido |
|---|---|---|---|
| 1 | Anticipo | 40% | 0% |
| 2 | Avance de obra | 30% | 70% |
| 3 | Entrega final | 30% | 100% |

El último hito absorbe el residuo del redondeo, así que la suma de los hitos es
exactamente el valor del acuerdo.

## SOLID

| | Dónde se ve |
|---|---|
| **S** | Cada capa tiene un solo motivo para cambiar; `Alcance` solo cambia si cambian las reglas del alcance |
| **O** | Patrón State: un estado nuevo es una clase nueva, sin tocar lo existente |
| **L** | `Borrador`, `Enviada`, … son sustituibles por `EstadoCotizacion` en cualquier punto |
| **I** | Cada interfaz `<<repository>>` expone lo que su agregado necesita, no un CRUD genérico |
| **D** | Servicios y consola dependen de interfaces; `main.cpp` es el único que conoce las implementaciones |