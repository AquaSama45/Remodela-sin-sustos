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
| `src/dominio/` | `<<entity>>` | Entidades y todas las reglas de negocio | 22 |
| `src/persistencia/` | `<<repository>>` | 5 interfaces, 5 implementaciones en memoria, puerto de notificación y su adaptador | 12 |
| `src/control/` | `<<control>>` | Servicios que coordinan los casos de uso | 5 |
| `src/ui/` | `<<boundary>>` | Menús de consola por rol | 6 |

`src/main.cpp` es el punto de ensamblaje: el único lugar donde se eligen las
implementaciones concretas.

Tres comprobaciones de que la separación es real y no decorativa:

```bash
grep -r iostream src/dominio/                  # vacío: el dominio no sabe que hay pantalla
grep -rn "catch (const ReglaDeNegocio" src/    # un solo punto, en src/ui/menus.cpp
grep -rn "EnMemoria\|Consola" src/control/     # vacío: el control no conoce implementaciones
```

## Casos de uso cubiertos

| UC | Nombre | Rol | Dónde |
|---|---|---|---|
| UC1 | Definir el alcance del proyecto | Coordinador | `alcance.*`, `ServicioAlcance` |
| UC2 | Elaborar y enviar cotización | Contratista | `cotizacion.*`, `estado_cotizacion.*`, `ServicioCotizacion` |
| UC3 | Comparar cotizaciones | Cliente | `ServicioAcuerdo::comparar` |
| UC4 | Formalizar el acuerdo | Cliente | `acuerdo_formal.*`, `ServicioAcuerdo::aceptar` |
| UC5 | Reportar avance y costos | Contratista | `reporte_avance.*`, `ServicioAvance` |
| UC8 | Registrar pago de hito | Cliente | `EstadoHitoPago`, `AcuerdoFormal::pagarHito` |

## Patrón GoF aplicado: State

Aplicado dos veces, con jerarquías independientes:

- **`Cotizacion`** — `BORRADOR → ENVIADA → EN_REVISION → ACEPTADA | RECHAZADA`
- **`HitoDePago`** — `PENDIENTE_DE_AVANCE → HABILITADO → PAGADO`

Cada estado es una clase que decide qué operaciones son legales. La implementación por
defecto de cada transición la rechaza, así que un estado concreto sobrescribe solo lo
que permite, y agregar un estado nuevo no obliga a editar ningún `switch`.

Los estados no tienen datos: son singletons (`Borrador::instancia()`), por eso el
programa no usa `new` ni `delete` en ninguna parte.

## Las dos reglas que dan nombre al proyecto

**Lo pagado nunca se adelanta al avance de obra**, salvo el anticipo. Para un plan
40/30/30:

| # | Hito | % del valor | Avance de obra exigido |
|---|---|---|---|
| 1 | Anticipo | 40% | 0% |
| 2 | Avance de obra | 30% | 70% |
| 3 | Entrega final | 30% | 100% |

El último hito absorbe el residuo del redondeo, así que la suma de los hitos es
exactamente el valor del acuerdo.

**El sobrecosto se avisa en el momento del reporte.** `ReporteAvance` compara el costo
real acumulado contra `AcuerdoFormal::costoEsperadoPara(avance)` y, si la desviación
supera el umbral de `ServicioAvance::UMBRAL_DEFECTO` (10 %, RF-09), el servicio dispara
la alerta por `PuertoNotificacion`. Gastar menos de lo pactado no alerta.

## SOLID

| | Dónde se ve |
|---|---|
| **S** | Cada capa tiene un solo motivo para cambiar; `Alcance` solo cambia si cambian las reglas del alcance |
| **O** | Patrón State: un estado nuevo es una clase nueva, sin tocar lo existente |
| **L** | `Borrador`, `Enviada`, … son sustituibles por `EstadoCotizacion` en cualquier punto |
| **I** | Cada interfaz `<<repository>>` expone lo que su agregado necesita, no un CRUD genérico |
| **D** | `ServicioAvance` depende de `PuertoNotificacion`, no de `NotificadorConsola`; `main.cpp` es el único que conoce las implementaciones |
