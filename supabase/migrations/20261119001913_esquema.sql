-- =====================================================================
-- Remodela sin sustos - Migración 001: esquema base
-- Derivado del diagrama de clases refinado.
-- Cada tabla indica en su comentario la clase, el RF/RNF y el UC que cubre.
-- RLS y políticas: migración 002. Reglas de negocio (triggers): 003+.
-- RNF-02: las tablas de negocio no usan ON DELETE CASCADE; nada se borra
-- en cadena, para conservar la trazabilidad (retención >= 5 años).
-- =====================================================================

-- Enumeraciones (estados de negocio del diagrama de clases)
create type public.rol_usuario as enum (
    'coordinador', 'auxiliar', 'contratista', 'cliente', 'gerencia'
);

create type public.estado_proyecto as enum (
    'PLANIFICACION', 'COTIZACION', 'EN_EJECUCION', 'PAUSADO', 'FINALIZADO'
);

-- UC1 A1: el alcance puede guardarse como borrador antes de ser oficial
create type public.estado_alcance as enum ('BORRADOR', 'OFICIAL');

create type public.estado_cotizacion as enum (
    'BORRADOR', 'ENVIADA', 'EN_REVISION', 'ACEPTADA', 'RECHAZADA'
);

create type public.estado_hito as enum ('PENDIENTE', 'APROBADO', 'PAGADO');

-- Utilidad: mantener actualizado_en
create function public.tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin 
    new.actualizado_en := now();
    return new;
end;
$$;

-- Empresa
create table public.empresas (
    id uuid primary key default gen_random_uuid(),
    nit text not null unique,
    nombre text not null,
    -- UC5: el umbral de desviación que dispara alerta es parametrizable por la empresa
    umbral_desviacion numeric(5,2) not null default 10
                    check (umbral_desviacion between 0 and 100),
    creado_en timestamptz not null default now()
);
comment on table public.empresas is 
    'Clase Empresa. Dueña del portafolio (RF-10, UC6).';

-- Cliente 
create table public.clientes (
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id),
    nombre text not null,
    telefono text,
    email text,
    creado_en timestamptz not null default now()
);
comment on table public.clientes is
    'Clase Cliente. Dueño del inmueble (UC1 precondición, UC7). empresa_id = empresa que lo registró.';

-- Contratista
create table public.contratistas (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    tipo_contratista text,
    telefono text,
    email text,
    creado_en timestamptz not null default now()
);
comment on table public.contratistas is
    'Clase Contratista. Emite cotizaciones (UC2) y reporta avance (UC5).';

-- Perfiles (Usuario y subclases) - vínculo cuenta ↔ entidad de negocio
create table public.perfiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nombre text,
    email text,
    cargo text,
    rol public.rol_usuario not null,
    empresa_id uuid references public.empresas(id),
    cliente_id uuid unique references public.clientes(id),
    contratista_id uuid unique references public.contratistas(id),
    creado_en timestamptz not null default now()
);
comment on table public.perfiles is
    'Clase abstracta Usuario y subclases (Coordinador, Auxiliar, ClienteUsuario, ContratistaUsuario) + Gerencia. RNF-03';

-- Crea el perfil automáticamente al registrar un usuario en Supabase Auth.
-- El rol viene de app_metadata (solo editable con la service role).
create function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_rol public.rol_usuario;
begin
    v_rol := coalesce(new.raw_app_meta_data ->> 'rol', 'cliente')::public.rol_usuario;
    insert into public.perfiles (id, email, nombre, rol)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
        v_rol
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.crear_perfil();

-- Proyecto 
create table public.proyectos(
    id uuid primary key default gen_random_uuid(),
    empresa_id uuid not null references public.empresas(id),
    cliente_id uuid not null references public.clientes(id),
    nombre text not null,
    direccion_inmueble text not null,
    presupuesto_asignado numeric(14,2) not null default 0 check (presupuesto_asignado >= 0),
    estado public.estado_proyecto not null default 'PLANIFICACION',
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);
comment on table public.proyectos is 
    'Clase Proyecto (UC1). Estados según EstadoProyecto.';

create index proyectos_empresa_idx on public.proyectos (empresa_id, estado);
create index proyectos_clientes_idx on public.proyectos (cliente_id);

create trigger proyectos_actualizado_en
    before update on public.proyectos
    for each row execute function public.tocar_actualizado_en();

-- Proyecto 0..* - 1..* Contratista (asignación)
create table public.proyecto_contratistas (
    proyecto_id uuid not null references public.proyectos(id),
    contratista_id uuid not null references public.contratistas(id),
    asignado_en timestamptz not null default now(),
    primary key (proyecto_id, contratista_id)
);
comment on table public.proyecto_contratistas is
    'Asociación Proyecto-Contratista. Precondición de UC2: contratista vinculado al proyecto.';

create index proyecto_contratistas_contratista_idx
    on public.proyecto_contratistas (contratista_id);

-- Alcance (RF-01, RF-02, UC1)
create table public.alcances (
    id uuid primary key default gen_random_uuid(),
    proyecto_id uuid not null unique references public.proyectos(id),
    -- [{ "nombre": "Cocina", "partidas": [{ "nombre": "...", "materiales": ["..."] }] }]
    ambientes jsonb not null default '[]'::jsonb
              check (jsonb_typeof(ambientes) = 'array'),
    estado public.estado_alcance not null default 'BORRADOR',
    oficializado_en timestamptz,
    oficializado_por uuid references public.perfiles(id),
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    check (estado = 'BORRADOR' or oficializado_en is not null)
);
comment on table public.alcances is 
    'Clase Alcance (RF-01, RF-02, UC1). Un alcance oficial único por proyecto.';

create trigger alcances_actualizado_en
    before update on public.alcances
    for each row execute function public.tocar_actualizado_en();

-- Cotización (RF-03, RF-04, UC2, UC3)
create table public.cotizaciones (
    id uuid primary key default gen_random_uuid(),
    proyecto_id uuid not null references public.proyectos(id),
    contratista_id uuid not null references public.contratistas(id),
    version integer not null default 1 check (version >= 1),
    reemplaza_a uuid references public.cotizaciones(id),
    costo_materiales numeric(14,2) not null default 0 check (costo_materiales >= 0),
    costo_mano_obra numeric(14,2) not null default 0 check (costo_mano_obra >= 0),
    imprevistos numeric(14,2) not null default 0 check (imprevistos >= 0),
    -- Cotizacion.calcularTotal()
    total numeric(14,2) generated always as
                        (costo_materiales + costo_mano_obra + imprevistos) stored,
    tiempo_ejecucion_dias integer check (tiempo_ejecucion_dias > 0),
    forma_pago text,
    exclusiones text,
    sin_exclusiones boolean not null default false,
    estado public.estado_cotizacion not null default 'BORRADOR',
    enviada_en timestamptz,
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now(),
    -- UC2 E1: no se envía sin las categorías obligatorias
    constraint cotizacion_completa check (
        estado = 'BORRADOR'
        or (tiempo_ejecucion_dias is not null
            and coalesce(btrim(forma_pago), '') <> ''
            and enviada_en is not null)
    ),
    -- UC2: exclusiones obligatorias aunque sea "sin exclusiones"
    constraint exclusiones_declaradas check (
        estado = 'BORRADOR'
        or sin_exclusiones
        or coalesce(btrim(exclusiones), '') <> ''
    ),
    unique (proyecto_id, contratista_id, version)
);
comment on table public.cotizaciones is 
    'Clase Cotizacion (RF-03, UC2; comparada en RF-04, UC3).';

create index cotizaciones_proyecto_idx on public.cotizaciones (proyecto_id, estado);
create index cotizaciones_contratista_idx on public.cotizaciones (contratista_id);

create trigger cotizaciones_actualizado_en
    before update on public.cotizaciones
    for each row execute function public.tocar_actualizado_en();

-- Acuerdo formal (RF-05, UC4)
create table public.acuerdos_formales (
    id uuid primary key default gen_random_uuid(),
    proyecto_id uuid not null references public.proyectos(id),
    cotizacion_id uuid not null unique references public.cotizaciones(id),
    fecha_firma timestamptz not null default now(),
    precio_total numeric(14,2) not null check (precio_total > 0),
    responsabilidades text,
    -- Copia del alcance pactado al firmar (base de RF-06 / UC9)
    alcance_acordado jsonb not null,
    vigente boolean not null default true,
    cerrado_en timestamptz,
    creado_por uuid references public.perfiles(id),
    check (vigente or cerrado_en is not null)
);
comment on table public.acuerdos_formales is
    'Clase AcuerdoFormal (RF-05, UC4). Un solo acuerdo vigente por proyecto.';

-- UC4: un proyuecto solo puede tener un AcuerdoFormal vigente a la vez
create unique index acuerdo_vigente_unico
    on public.acuerdos_formales (proyecto_id) where vigente;

-- Hito de pago (RF-08, UC8)
create table public.hitos_de_pago (
    id                   uuid primary key default gen_random_uuid(),
    acuerdo_id           uuid not null references public.acuerdos_formales(id),
    orden                integer not null check (orden >= 1),
    descripcion          text not null,
    monto                numeric(14,2) not null check (monto > 0),
    porcentaje_obra      numeric(5,2) not null check (porcentaje_obra between 0 and 100),
    estado               public.estado_hito not null default 'PENDIENTE',
    nota_retencion       text,
    aprobado_en          timestamptz,
    aprobado_por         uuid references public.perfiles(id),
    monto_pagado         numeric(14,2) check (monto_pagado > 0),
    justificacion_monto  text,
    pagado_en            timestamptz,
    pagado_por           uuid references public.perfiles(id),
    unique (acuerdo_id, orden),
    constraint pago_completo check (
        estado <> 'PAGADO' or (monto_pagado is not null and pagado_en is not null)
    ),
    -- UC8 E1: pagar un monto distinto al pactado exige justificación
    constraint monto_distinto_justificado check (
        monto_pagado is null
        or monto_pagado = monto
        or coalesce(btrim(justificacion_monto), '') <> ''
    )
);
comment on table public.hitos_de_pago is
    'Clase HitoDePago (RF-08, UC8).';

create index hitos_acuerdo_idx on public.hitos_de_pago (acuerdo_id, estado);

-- Reporte de avance (RF-07, RF-09, UC5)
create table public.reportes_avance (
    id                     uuid primary key default gen_random_uuid(),
    proyecto_id            uuid not null references public.proyectos(id),
    -- UC5: todo reporte se asocia a un AcuerdoFormal vigente
    acuerdo_id             uuid not null references public.acuerdos_formales(id),
    contratista_id         uuid not null references public.contratistas(id),
    fecha                  date not null default current_date,
    partida                text,
    porcentaje_completado  numeric(5,2) not null check (porcentaje_completado between 0 and 100),
    descripcion            text not null check (btrim(descripcion) <> ''),
    costo_incurrido        numeric(14,2) not null default 0 check (costo_incurrido >= 0),
    -- Calculados por el sistema (ReporteAvance.calcularDesviacion())
    costo_real_acumulado   numeric(14,2),
    costo_presupuestado    numeric(14,2),
    desviacion_costo       numeric(14,2),
    desviacion_porcentaje  numeric(7,2),
    desviacion_tiempo      integer,
    supera_umbral          boolean not null default false,
    motivo_desviacion      text,
    foto_url               text,
    creado_por             uuid references public.perfiles(id),
    creado_en              timestamptz not null default now()
);
comment on table public.reportes_avance is
    'Clase ReporteAvance (RF-07, RF-09, UC5). La desviación la calcula el sistema.';

create index reportes_proyecto_fecha_idx
    on public.reportes_avance (proyecto_id, fecha desc, creado_en desc);

-- Historial de cambios (RF-06, RNF-02, UC9)
create table public.historial_cambios (
    id                     uuid primary key default gen_random_uuid(),
    acuerdo_id             uuid not null references public.acuerdos_formales(id),
    version_anterior       jsonb not null,
    version_nueva          jsonb not null,
    precio_anterior        numeric(14,2),
    precio_nuevo           numeric(14,2) check (precio_nuevo > 0),
    fecha_cambio           timestamptz not null default now(),
    autor_id               uuid not null references public.perfiles(id),
    -- UC9 E1: sin justificación no hay cambio
    detalle_justificacion  text not null check (btrim(detalle_justificacion) <> '')
);
comment on table public.historial_cambios is
    'Clase HistorialCambio (RF-06, RNF-02, UC9). Solo INSERT.';

create index historial_acuerdo_idx on public.historial_cambios (acuerdo_id, fecha_cambio desc);

-- Notificaciones (contenedor "Servicio de notificaciones" del C4)
create table public.notificaciones (
    id            uuid primary key default gen_random_uuid(),
    proyecto_id   uuid references public.proyectos(id),
    tipo          text not null,
    destinatario  text not null,
    asunto        text not null,
    cuerpo        text not null,
    enviada       boolean not null default false,
    intentos      integer not null default 0,
    ultimo_error  text,
    creado_en     timestamptz not null default now(),
    enviada_en    timestamptz
);
comment on table public.notificaciones is
    'Cola de notificaciones (US-04, US-06). Tabla técnica.';

create index notificaciones_pendientes_idx
    on public.notificaciones (creado_en) where not enviada;
