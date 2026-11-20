-- =====================================================================
-- Remodela sin sustos - Migración 003: reglas de alcance, cotización y acuerdo
-- UC1 (RF-01, RF-02), UC2 (RF-03), UC3 (RF-04), UC4 (RF-05).
-- Las reglas viven en la BD: se cumplen aunque alguien se salte la API.
-- =====================================================================

-- Esquema privado: funciones internas que NO se publican en la API
create schema if not exists privado;
grant usage on schema privado to authenticated, service_role;

-- Procesos del sistema (scripts con la secret key) no pasan por las reglas de rol
create function privado.es_sistema()
returns boolean
language sql
stable
as $$
  select current_user in ('postgres', 'service_role', 'supabase_admin');
$$;

-- Alcance.validarCompletitud(): al menos un ambiente; cada ambiente con partidas
-- y cada partida con materiales (UC1 E1)
create function privado.alcance_completo(p_ambientes jsonb)
returns boolean
language sql
immutable
as $$
  select case
    when jsonb_typeof(p_ambientes) <> 'array' or jsonb_array_length(p_ambientes) = 0 then false
    else not exists (
      select 1
      from jsonb_array_elements(p_ambientes) amb
      where case
        when jsonb_typeof(amb -> 'partidas') <> 'array'
          or jsonb_array_length(amb -> 'partidas') = 0 then true
        else exists (
          select 1
          from jsonb_array_elements(amb -> 'partidas') par
          where case
            when jsonb_typeof(par -> 'materiales') <> 'array' then true
            else jsonb_array_length(par -> 'materiales') = 0
          end
        )
      end
    )
  end;
$$;

-- Suma de porcentajes de una lista de hitos [{ "porcentaje": 40 }, ...]
create function privado.suma_porcentajes(p_hitos jsonb)
returns numeric
language sql
immutable
as $$
  select coalesce(sum((h ->> 'porcentaje')::numeric), 0)
  from jsonb_array_elements(
    case when jsonb_typeof(p_hitos) = 'array' then p_hitos else '[]'::jsonb end
  ) h;
$$;

-- Encola un correo para coordinación, cliente o contratista de un proyecto.
-- SECURITY DEFINER: escribe en la cola aunque el usuario no tenga acceso a ella.
create function privado.encolar_notificacion(
  p_proyecto uuid,
  p_tipo text,
  p_destino text,          -- 'coordinacion' | 'cliente' | 'contratista'
  p_asunto text,
  p_cuerpo text,
  p_contratista uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cantidad integer;
begin
  insert into public.notificaciones (proyecto_id, tipo, destinatario, asunto, cuerpo)
  select p_proyecto, p_tipo, pf.email, p_asunto, p_cuerpo
  from public.perfiles pf
  join public.proyectos p on p.id = p_proyecto
  where pf.email is not null
    and (
         (p_destino = 'coordinacion' and pf.rol = 'coordinador' and pf.empresa_id = p.empresa_id)
      or (p_destino = 'cliente' and pf.cliente_id = p.cliente_id)
      or (p_destino = 'contratista' and pf.contratista_id = p_contratista)
    );
  get diagnostics v_cantidad = row_count;
  return v_cantidad;
end;
$$;

revoke all on function privado.encolar_notificacion(uuid, text, text, text, text, uuid) from public;
grant execute on function privado.encolar_notificacion(uuid, text, text, text, text, uuid)
  to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Ajustes de esquema pedidos por las pantallas del frontend
-- ---------------------------------------------------------------------

-- UC2 paso 6: forma de pago propuesta por hitos [{ "descripcion": "...", "porcentaje": 40 }]
alter table public.cotizaciones
  add column hitos_propuestos jsonb not null default '[]'::jsonb
    check (jsonb_typeof(hitos_propuestos) = 'array');

alter table public.cotizaciones
  add constraint hitos_propuestos_completos check (
    estado = 'BORRADOR'
    or (jsonb_array_length(hitos_propuestos) > 0
        and privado.suma_porcentajes(hitos_propuestos) = 100)
  );

-- UC8: comprobante del pago (medio, referencia bancaria, observaciones)
alter table public.hitos_de_pago
  add column porcentaje_pago    numeric(5,2) check (porcentaje_pago between 0 and 100),
  add column medio_pago         text,
  add column referencia_pago    text,
  add column observaciones_pago text;

alter table public.hitos_de_pago
  add constraint pago_con_referencia check (
    estado <> 'PAGADO' or coalesce(btrim(referencia_pago), '') <> ''
  );

comment on column public.hitos_de_pago.porcentaje_obra is
  'Avance de obra mínimo (%) que debe estar reportado para aprobar el hito (UC8 precondición 2).';
comment on column public.hitos_de_pago.porcentaje_pago is
  'Porcentaje del precio total que representa el hito.';

-- ---------------------------------------------------------------------
-- Corrección de la política de lectura de acuerdos (migración 002)
-- La versión anterior buscaba el acuerdo por id dentro de la propia política;
-- al crearlo, la fila nueva aún no es visible para esa búsqueda y el INSERT
-- fallaba. Ahora la política usa las columnas de la fila directamente.
-- ---------------------------------------------------------------------
create function public.es_contratista_de_cotizacion(p_cotizacion uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.rol_actual() = 'contratista'
     and exists (
       select 1 from public.cotizaciones
       where id = p_cotizacion and contratista_id = public.mi_contratista_id()
     );
$$;

revoke execute on function public.es_contratista_de_cotizacion(uuid) from anon, public;
grant execute on function public.es_contratista_de_cotizacion(uuid) to authenticated, service_role;

drop policy acuerdos_leer on public.acuerdos_formales;
create policy acuerdos_leer on public.acuerdos_formales
  for select to authenticated
  using (
    public.es_interno_de(proyecto_id)
    or public.es_cliente_de(proyecto_id)
    or public.es_contratista_de_cotizacion(cotizacion_id)
  );

-- ---------------------------------------------------------------------
-- UC1: el alcance oficial está completo y no se modifica directamente
-- ---------------------------------------------------------------------
create function privado.reglas_alcance()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.estado = 'OFICIAL' then
    if new.estado <> 'OFICIAL' then
      raise exception 'Un alcance oficial no puede volver a borrador';
    end if;
    if new.ambientes is distinct from old.ambientes
       and coalesce(current_setting('app.cambio_alcance', true), '') <> 'on'
       and not privado.es_sistema() then
      raise exception 'El alcance oficial no se modifica directamente; registra un cambio de alcance (UC9)';
    end if;
  end if;

  if new.estado = 'OFICIAL' then
    if not privado.alcance_completo(new.ambientes) then
      raise exception 'El alcance oficial debe tener ambientes, y cada ambiente partidas con materiales (UC1)';
    end if;
    new.oficializado_en := coalesce(new.oficializado_en, now());
    new.oficializado_por := coalesce(new.oficializado_por, auth.uid());
  end if;

  return new;
end;
$$;

create trigger alcances_reglas
  before insert or update on public.alcances
  for each row execute function privado.reglas_alcance();

-- ---------------------------------------------------------------------
-- UC2 y UC3: reglas de la cotización y sus cambios de estado
-- ---------------------------------------------------------------------
create function privado.reglas_cotizacion()
returns trigger
language plpgsql
as $$
declare
  v_rol text := public.rol_actual();
begin
  if tg_op = 'INSERT' then
    -- UC2 precondición 1: el proyecto tiene alcance oficial
    if not exists (
      select 1 from public.alcances
      where proyecto_id = new.proyecto_id and estado = 'OFICIAL'
    ) then
      raise exception 'El proyecto aún no tiene un alcance oficial para cotizar (UC2)';
    end if;
    if new.estado not in ('BORRADOR', 'ENVIADA') then
      raise exception 'Una cotización nueva solo puede crearse como borrador o enviada';
    end if;
  else
    -- UC2 regla: una cotización enviada no se edita, se crea una nueva versión
    -- (se excluye "total": en un trigger BEFORE la columna calculada aún no tiene valor)
    if old.estado <> 'BORRADOR'
       and (to_jsonb(new) - array['estado', 'actualizado_en', 'enviada_en', 'total'])
           <> (to_jsonb(old) - array['estado', 'actualizado_en', 'enviada_en', 'total']) then
      raise exception 'Una cotización enviada no se edita; crea una nueva versión (UC2)';
    end if;

    -- Cambios de estado permitidos (EstadoCotizacion) y quién los hace
    if new.estado is distinct from old.estado and not privado.es_sistema() then
      if not (
           (old.estado = 'BORRADOR' and new.estado = 'ENVIADA' and v_rol = 'contratista')
        or (old.estado = 'ENVIADA' and new.estado = 'EN_REVISION' and v_rol in ('coordinador', 'auxiliar'))
        or (old.estado in ('ENVIADA', 'EN_REVISION') and new.estado = 'RECHAZADA'
            and v_rol in ('coordinador', 'auxiliar'))
        -- ACEPTADA solo dentro de aceptar_cotizacion(), que genera el acuerdo (UC4)
        or (old.estado in ('ENVIADA', 'EN_REVISION') and new.estado = 'ACEPTADA'
            and coalesce(current_setting('app.aceptando_cotizacion', true), '') = 'on')
      ) then
        raise exception 'Cambio de estado no permitido: % → %', old.estado, new.estado;
      end if;
    end if;
  end if;

  -- Al enviarse: fecha de envío y resumen de la forma de pago desde los hitos
  if new.estado = 'ENVIADA' and (tg_op = 'INSERT' or old.estado = 'BORRADOR') then
    new.enviada_en := now();
    if coalesce(btrim(new.forma_pago), '') = '' then
      new.forma_pago := (
        select string_agg((h ->> 'porcentaje') || '% ' || (h ->> 'descripcion'), ' / ' order by n)
        from jsonb_array_elements(new.hitos_propuestos) with ordinality as t(h, n)
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger cotizaciones_reglas
  before insert or update on public.cotizaciones
  for each row execute function privado.reglas_cotizacion();

-- ---------------------------------------------------------------------
-- UC4: aceptar una cotización genera el acuerdo formal y sus hitos
-- Se llama desde la API: rpc('aceptar_cotizacion', {...}).
-- SECURITY INVOKER: corre con los permisos del coordinador (RLS aplica).
-- ---------------------------------------------------------------------
create function public.aceptar_cotizacion(
  p_cotizacion uuid,
  p_hitos jsonb default null,              -- UC4 A1: ajuste de hitos; null = los propuestos
  p_precio_total numeric default null,     -- null = total cotizado
  p_responsabilidades text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  c public.cotizaciones;
  v_alcance jsonb;
  v_hitos jsonb;
  v_precio numeric;
  v_acuerdo uuid;
  v_hito jsonb;
  v_orden integer;
  v_cantidad integer;
  v_monto numeric;
  v_asignado numeric := 0;
  v_avance_acumulado numeric := 0;
begin
  if public.rol_actual() <> 'coordinador' then
    raise exception 'Solo la coordinación puede aceptar cotizaciones (UC4)';
  end if;

  select * into c from public.cotizaciones where id = p_cotizacion for update;
  if not found then
    raise exception 'La cotización no existe o no tienes acceso a ella';
  end if;

  -- UC4 E1: la cotización debe seguir vigente
  if c.estado not in ('ENVIADA', 'EN_REVISION') then
    raise exception 'La cotización ya no está vigente para aceptarse (estado %)', c.estado;
  end if;

  select ambientes into v_alcance
  from public.alcances
  where proyecto_id = c.proyecto_id and estado = 'OFICIAL';
  if v_alcance is null then
    raise exception 'El proyecto no tiene alcance oficial';
  end if;

  v_hitos := coalesce(p_hitos, c.hitos_propuestos);
  if jsonb_typeof(v_hitos) <> 'array' or jsonb_array_length(v_hitos) = 0 then
    raise exception 'El acuerdo necesita al menos un hito de pago';
  end if;
  if privado.suma_porcentajes(v_hitos) <> 100 then
    raise exception 'Los porcentajes de los hitos deben sumar 100 (suman %)',
      privado.suma_porcentajes(v_hitos);
  end if;

  -- UC4 regla: el precio del acuerdo no puede superar el total cotizado
  v_precio := coalesce(p_precio_total, c.total);
  if v_precio <= 0 or v_precio > c.total then
    raise exception 'El precio del acuerdo debe ser mayor a 0 y no superar el total cotizado (%)', c.total;
  end if;

  -- AcuerdoFormal.generarDocumento(): fechado, con copia del alcance pactado
  insert into public.acuerdos_formales
    (proyecto_id, cotizacion_id, precio_total, responsabilidades, alcance_acordado, creado_por)
  values
    (c.proyecto_id, c.id, v_precio, p_responsabilidades, v_alcance, auth.uid())
  returning id into v_acuerdo;   -- el índice acuerdo_vigente_unico impide un segundo acuerdo

  -- Hitos: el monto sale del porcentaje; el último absorbe el redondeo.
  -- Avance requerido por defecto: el acumulado de los hitos anteriores.
  v_cantidad := jsonb_array_length(v_hitos);
  for v_hito, v_orden in
    select h, n::integer from jsonb_array_elements(v_hitos) with ordinality as t(h, n)
  loop
    if v_orden = v_cantidad then
      v_monto := v_precio - v_asignado;
    else
      v_monto := round(v_precio * (v_hito ->> 'porcentaje')::numeric / 100, 0);
    end if;
    v_asignado := v_asignado + v_monto;

    insert into public.hitos_de_pago
      (acuerdo_id, orden, descripcion, monto, porcentaje_pago, porcentaje_obra)
    values (
      v_acuerdo,
      v_orden,
      v_hito ->> 'descripcion',
      v_monto,
      (v_hito ->> 'porcentaje')::numeric,
      coalesce((v_hito ->> 'avance_requerido')::numeric, v_avance_acumulado)
    );
    v_avance_acumulado := v_avance_acumulado + (v_hito ->> 'porcentaje')::numeric;
  end loop;

  -- UC4 postcondiciones: aceptada, las demás rechazadas, proyecto en ejecución
  perform set_config('app.aceptando_cotizacion', 'on', true);
  update public.cotizaciones set estado = 'ACEPTADA' where id = c.id;
  perform set_config('app.aceptando_cotizacion', 'off', true);

  update public.cotizaciones
  set estado = 'RECHAZADA'
  where proyecto_id = c.proyecto_id
    and id <> c.id
    and estado in ('ENVIADA', 'EN_REVISION');

  update public.proyectos set estado = 'EN_EJECUCION' where id = c.proyecto_id;

  -- UC4 paso 5: notificar a contratista y cliente final
  perform privado.encolar_notificacion(
    c.proyecto_id, 'ACUERDO_GENERADO', 'contratista',
    'Tu cotización fue aceptada',
    format('Se generó el acuerdo formal por %s COP. Ya puedes consultarlo en la plataforma.', v_precio),
    c.contratista_id
  );
  perform privado.encolar_notificacion(
    c.proyecto_id, 'ACUERDO_GENERADO', 'cliente',
    'Tu proyecto tiene acuerdo formal',
    format('Se firmó el acuerdo de tu remodelación por %s COP. Puedes consultar el alcance, el precio y los hitos de pago.', v_precio)
  );

  return v_acuerdo;
end;
$$;

revoke execute on function public.aceptar_cotizacion(uuid, jsonb, numeric, text) from anon, public;
grant execute on function public.aceptar_cotizacion(uuid, jsonb, numeric, text) to authenticated;

-- Las funciones internas las ejecutan los usuarios autenticados a través de
-- triggers y restricciones; el esquema privado no se publica en la API.
grant execute on all functions in schema privado to authenticated, service_role;