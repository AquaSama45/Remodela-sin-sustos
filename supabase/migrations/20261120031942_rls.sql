-- =====================================================================
-- Remodela sin sustos - Migración 002: control de acceso por rol
-- RNF-03: autenticación obligatoria y acceso diferenciado por rol.
-- US-11: cada usuario ve solo lo de su rol y sus proyectos.
-- RNF-02: ninguna tabla tiene política de DELETE (nada se borra).
-- =====================================================================

-- Funciones auxiliares
-- SECURITY DEFINER: leen perfiles/proyectos sin pasar por RLS,
-- así las políticas no se llaman entre sí (evita recursión infinita).

create function public.rol_actual()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'rol', '');
$$;

create function public.mi_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from public.perfiles where id = auth.uid();
$$;

create function public.mi_cliente_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cliente_id from public.perfiles where id = auth.uid();
$$;

create function public.mi_contratista_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select contratista_id from public.perfiles where id = auth.uid();
$$;

-- Coordinador, Auxiliar o Gerencia de la empresa dueña del proyecto
create function public.es_interno_de(p_proyecto uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.rol_actual() in ('coordinador', 'auxiliar', 'gerencia')
     and exists (
       select 1 from public.proyectos
       where id = p_proyecto and empresa_id = public.mi_empresa_id()
     );
$$;

-- Coordinador o Auxiliar de la empresa (Gerencia solo consulta, UC6)
create function public.puede_gestionar(p_proyecto uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.rol_actual() in ('coordinador', 'auxiliar')
     and public.es_interno_de(p_proyecto);
$$;

-- Contratista vinculado al proyecto (precondición UC2)
create function public.es_contratista_de(p_proyecto uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.rol_actual() = 'contratista'
     and exists (
       select 1 from public.proyecto_contratistas
       where proyecto_id = p_proyecto
         and contratista_id = public.mi_contratista_id()
     );
$$;

-- Cliente dueño del proyecto (UC7)
create function public.es_cliente_de(p_proyecto uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.rol_actual() = 'cliente'
     and exists (
       select 1 from public.proyectos
       where id = p_proyecto and cliente_id = public.mi_cliente_id()
     );
$$;

-- Quién puede ver un acuerdo: internos, el contratista cuya cotización lo originó, y el cliente
create function public.puede_ver_acuerdo(p_acuerdo uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.acuerdos_formales a
    join public.cotizaciones c on c.id = a.cotizacion_id
    where a.id = p_acuerdo
      and (
        public.es_interno_de(a.proyecto_id)
        or public.es_cliente_de(a.proyecto_id)
        or (public.rol_actual() = 'contratista'
            and c.contratista_id = public.mi_contratista_id())
      )
  );
$$;

-- Las funciones auxiliares no las usa el público anónimo
revoke execute on function
  public.rol_actual(), public.mi_empresa_id(), public.mi_cliente_id(),
  public.mi_contratista_id(), public.es_interno_de(uuid), public.puede_gestionar(uuid),
  public.es_contratista_de(uuid), public.es_cliente_de(uuid), public.puede_ver_acuerdo(uuid)
from anon, public;

grant execute on function
  public.rol_actual(), public.mi_empresa_id(), public.mi_cliente_id(),
  public.mi_contratista_id(), public.es_interno_de(uuid), public.puede_gestionar(uuid),
  public.es_contratista_de(uuid), public.es_cliente_de(uuid), public.puede_ver_acuerdo(uuid)
to authenticated, service_role;

-- RLS en todas las tablas (explícito para poder recrear la BD desde cero)
alter table public.empresas              enable row level security;
alter table public.clientes              enable row level security;
alter table public.contratistas          enable row level security;
alter table public.perfiles              enable row level security;
alter table public.proyectos             enable row level security;
alter table public.proyecto_contratistas enable row level security;
alter table public.alcances              enable row level security;
alter table public.cotizaciones          enable row level security;
alter table public.acuerdos_formales     enable row level security;
alter table public.hitos_de_pago         enable row level security;
alter table public.reportes_avance       enable row level security;
alter table public.historial_cambios     enable row level security;
alter table public.notificaciones        enable row level security;

-- Empresas
create policy empresas_leer on public.empresas
  for select to authenticated
  using (id = public.mi_empresa_id());

-- UC5: el umbral de desviación lo parametriza la empresa
create policy empresas_editar on public.empresas
  for update to authenticated
  using (id = public.mi_empresa_id() and public.rol_actual() in ('coordinador', 'gerencia'))
  with check (id = public.mi_empresa_id());

-- Perfiles
create policy perfiles_leer on public.perfiles
  for select to authenticated
  using (
    id = auth.uid()
    or (empresa_id = public.mi_empresa_id()
        and public.rol_actual() in ('coordinador', 'auxiliar', 'gerencia'))
  );

-- Clientes
create policy clientes_leer on public.clientes
  for select to authenticated
  using (
    (empresa_id = public.mi_empresa_id()
     and public.rol_actual() in ('coordinador', 'auxiliar', 'gerencia'))
    or id = public.mi_cliente_id()
  );

create policy clientes_crear on public.clientes
  for insert to authenticated
  with check (empresa_id = public.mi_empresa_id()
              and public.rol_actual() in ('coordinador', 'auxiliar'));

create policy clientes_editar on public.clientes
  for update to authenticated
  using (empresa_id = public.mi_empresa_id()
         and public.rol_actual() in ('coordinador', 'auxiliar'))
  with check (empresa_id = public.mi_empresa_id());

-- Contratistas
-- Los internos ven el directorio para poder asignarlos a proyectos
create policy contratistas_leer on public.contratistas
  for select to authenticated
  using (
    public.rol_actual() in ('coordinador', 'auxiliar', 'gerencia')
    or id = public.mi_contratista_id()
  );

create policy contratistas_crear on public.contratistas
  for insert to authenticated
  with check (public.rol_actual() in ('coordinador', 'auxiliar'));

create policy contratistas_editar on public.contratistas
  for update to authenticated
  using (public.rol_actual() in ('coordinador', 'auxiliar')
         or id = public.mi_contratista_id());

-- Proyectos
create policy proyectos_leer on public.proyectos
  for select to authenticated
  using (
    public.es_interno_de(id)
    or public.es_contratista_de(id)
    or public.es_cliente_de(id)
  );

create policy proyectos_crear on public.proyectos
  for insert to authenticated
  with check (empresa_id = public.mi_empresa_id()
              and public.rol_actual() in ('coordinador', 'auxiliar'));

create policy proyectos_editar on public.proyectos
  for update to authenticated
  using (public.puede_gestionar(id))
  with check (empresa_id = public.mi_empresa_id());

-- Asignación de contratistas
create policy asignaciones_leer on public.proyecto_contratistas
  for select to authenticated
  using (
    public.es_interno_de(proyecto_id)
    or contratista_id = public.mi_contratista_id()
  );

create policy asignaciones_crear on public.proyecto_contratistas
  for insert to authenticated
  with check (public.puede_gestionar(proyecto_id));

-- Alcances (UC1)
create policy alcances_leer on public.alcances
  for select to authenticated
  using (
    public.es_interno_de(proyecto_id)
    or public.es_contratista_de(proyecto_id)
    or public.es_cliente_de(proyecto_id)
  );

create policy alcances_crear on public.alcances
  for insert to authenticated
  with check (public.puede_gestionar(proyecto_id));

create policy alcances_editar on public.alcances
  for update to authenticated
  using (public.puede_gestionar(proyecto_id))
  with check (public.puede_gestionar(proyecto_id));

-- Cotizaciones (UC2, UC3)
-- US-11: un contratista nunca ve cotizaciones de otro.
-- US-08: el cliente no ve cotizaciones.
create policy cotizaciones_leer on public.cotizaciones
  for select to authenticated
  using (
    public.es_interno_de(proyecto_id)
    or (public.rol_actual() = 'contratista'
        and contratista_id = public.mi_contratista_id())
  );

create policy cotizaciones_crear on public.cotizaciones
  for insert to authenticated
  with check (
    contratista_id = public.mi_contratista_id()
    and public.es_contratista_de(proyecto_id)
  );

-- El contratista edita las suyas (solo borradores: lo impone un trigger en la 003);
-- la coordinación cambia estados (EN_REVISION, RECHAZADA...)
create policy cotizaciones_editar on public.cotizaciones
  for update to authenticated
  using (
    (public.rol_actual() = 'contratista' and contratista_id = public.mi_contratista_id())
    or public.puede_gestionar(proyecto_id)
  );

-- Acuerdos formales (UC4)
create policy acuerdos_leer on public.acuerdos_formales
  for select to authenticated
  using (public.puede_ver_acuerdo(id));

create policy acuerdos_crear on public.acuerdos_formales
  for insert to authenticated
  with check (public.rol_actual() = 'coordinador' and public.es_interno_de(proyecto_id));

create policy acuerdos_editar on public.acuerdos_formales
  for update to authenticated
  using (public.rol_actual() = 'coordinador' and public.es_interno_de(proyecto_id));

-- Hitos de pago (UC8)
create policy hitos_leer on public.hitos_de_pago
  for select to authenticated
  using (public.puede_ver_acuerdo(acuerdo_id));

create policy hitos_crear on public.hitos_de_pago
  for insert to authenticated
  with check (
    public.rol_actual() = 'coordinador'
    and exists (select 1 from public.acuerdos_formales a
                where a.id = acuerdo_id and public.es_interno_de(a.proyecto_id))
  );

create policy hitos_editar on public.hitos_de_pago
  for update to authenticated
  using (
    public.rol_actual() = 'coordinador'
    and exists (select 1 from public.acuerdos_formales a
                where a.id = acuerdo_id and public.es_interno_de(a.proyecto_id))
  );

-- Reportes de avance (UC5)
create policy reportes_leer on public.reportes_avance
  for select to authenticated
  using (
    public.es_interno_de(proyecto_id)
    or public.es_cliente_de(proyecto_id)
    or (public.rol_actual() = 'contratista'
        and contratista_id = public.mi_contratista_id())
  );

create policy reportes_crear on public.reportes_avance
  for insert to authenticated
  with check (
    contratista_id = public.mi_contratista_id()
    and public.es_contratista_de(proyecto_id)
  );
-- Sin política de UPDATE: un reporte enviado no se modifica.

-- Historial de cambios (UC9, RNF-02)
create policy historial_leer on public.historial_cambios
  for select to authenticated
  using (public.puede_ver_acuerdo(acuerdo_id));

create policy historial_crear on public.historial_cambios
  for insert to authenticated
  with check (
    public.rol_actual() = 'coordinador'
    and autor_id = auth.uid()
    and exists (select 1 from public.acuerdos_formales a
                where a.id = acuerdo_id and public.es_interno_de(a.proyecto_id))
  );
-- Sin UPDATE ni DELETE: el historial es inmutable.

-- Notificaciones
-- Sin políticas: solo la API (service role) lee y escribe la cola.