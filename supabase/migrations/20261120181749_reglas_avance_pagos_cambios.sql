-- =====================================================================
-- Remodela sin sustos - Migración 004: avance, pagos y cambios de alcance
-- UC5 (RF-07, RF-09), UC8 (RF-08), UC9 (RF-06, RNF-02), UC7.
-- =====================================================================

-- ---------------------------------------------------------------------
-- UC7: el cliente ve el nombre del contratista que ejecuta su obra
-- (sin ver sus cotizaciones). El acuerdo guarda el contratista.
-- ---------------------------------------------------------------------
alter table public.acuerdos_formales
  add column contratista_id uuid references public.contratistas(id);

update public.acuerdos_formales a
set contratista_id = c.contratista_id
from public.cotizaciones c
where c.id = a.cotizacion_id and a.contratista_id is null;

create function privado.completar_acuerdo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select contratista_id into new.contratista_id
  from public.cotizaciones where id = new.cotizacion_id;
  return new;
end;
$$;

create trigger acuerdos_completar
  before insert on public.acuerdos_formales
  for each row execute function privado.completar_acuerdo();

-- Contratistas visibles: internos, el propio contratista y el cliente
-- del proyecto donde ese contratista tiene el acuerdo
create function public.puede_ver_contratista(p_contratista uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.rol_actual() in ('coordinador', 'auxiliar', 'gerencia')
      or p_contratista = public.mi_contratista_id()
      or exists (
        select 1
        from public.acuerdos_formales a
        join public.proyectos p on p.id = a.proyecto_id
        where a.contratista_id = p_contratista
          and p.cliente_id = public.mi_cliente_id()
      );
$$;

revoke execute on function public.puede_ver_contratista(uuid) from anon, public;
grant execute on function public.puede_ver_contratista(uuid) to authenticated, service_role;

drop policy contratistas_leer on public.contratistas;
create policy contratistas_leer on public.contratistas
  for select to authenticated
  using (public.puede_ver_contratista(id));

-- ---------------------------------------------------------------------
-- Datos del acuerdo vigente de un proyecto, sin pasar por RLS
-- (los triggers los necesitan sin importar el rol de quien escribe)
-- ---------------------------------------------------------------------
create function privado.acuerdo_vigente(p_proyecto uuid)
returns table (
  acuerdo_id uuid,
  precio_total numeric,
  contratista_id uuid,
  fecha_firma timestamptz,
  tiempo_dias integer,
  umbral numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.precio_total, a.contratista_id, a.fecha_firma,
         c.tiempo_ejecucion_dias, e.umbral_desviacion
  from public.acuerdos_formales a
  join public.cotizaciones c on c.id = a.cotizacion_id
  join public.proyectos p on p.id = a.proyecto_id
  join public.empresas e on e.id = p.empresa_id
  where a.proyecto_id = p_proyecto and a.vigente;
$$;

-- Avance y costo acumulado ya reportados en un acuerdo
create function privado.avance_reportado(p_acuerdo uuid)
returns table (porcentaje numeric, costo_acumulado numeric)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(porcentaje_completado), 0), coalesce(sum(costo_incurrido), 0)
  from public.reportes_avance
  where acuerdo_id = p_acuerdo;
$$;

-- ---------------------------------------------------------------------
-- UC5: reporte de avance con cálculo de desviación en el momento
-- ReporteAvance.calcularDesviacion() + notificarAlertaSobrecosto()
-- ---------------------------------------------------------------------
create function privado.reglas_reporte_avance()
returns trigger
language plpgsql
as $$
declare
  v_acuerdo record;
  v_previo record;
  v_dias_esperados integer;
begin
  select * into v_acuerdo from privado.acuerdo_vigente(new.proyecto_id);
  if v_acuerdo.acuerdo_id is null then
    raise exception 'El proyecto no tiene un acuerdo vigente; no se puede reportar avance (UC5)';
  end if;
  if new.contratista_id is distinct from v_acuerdo.contratista_id then
    raise exception 'Solo el contratista del acuerdo vigente reporta avance en este proyecto';
  end if;

  select * into v_previo from privado.avance_reportado(v_acuerdo.acuerdo_id);

  -- UC5 E1: el avance no puede retroceder
  if new.porcentaje_completado < v_previo.porcentaje then
    raise exception '%', format(
      'El avance reportado (%s%%) no puede ser menor al último registrado (%s%%) (UC5)',
      new.porcentaje_completado, v_previo.porcentaje);
  end if;

  new.acuerdo_id := v_acuerdo.acuerdo_id;
  new.creado_por := coalesce(new.creado_por, auth.uid());

  -- Desviación de costo: real acumulado frente a lo presupuestado para ese avance
  new.costo_real_acumulado := v_previo.costo_acumulado + new.costo_incurrido;
  new.costo_presupuestado := round(v_acuerdo.precio_total * new.porcentaje_completado / 100, 2);
  new.desviacion_costo := new.costo_real_acumulado - new.costo_presupuestado;
  new.desviacion_porcentaje := case
    when new.costo_presupuestado > 0
      then round(new.desviacion_costo / new.costo_presupuestado * 100, 2)
  end;
  new.supera_umbral := coalesce(new.desviacion_porcentaje > v_acuerdo.umbral, false);

  -- Desviación de tiempo: días de retraso frente al ritmo pactado (positivo = atraso)
  if v_acuerdo.tiempo_dias is not null then
    v_dias_esperados := round(v_acuerdo.tiempo_dias * new.porcentaje_completado / 100);
    new.desviacion_tiempo := (new.fecha - v_acuerdo.fecha_firma::date) - v_dias_esperados;
  end if;

  -- UC5 paso 5: si supera el umbral, alerta inmediata a la coordinación (US-06)
  if new.supera_umbral then
    perform privado.encolar_notificacion(
      new.proyecto_id, 'ALERTA_SOBRECOSTO', 'coordinacion',
      'Alerta de sobrecosto en obra',
      format('Con %s%% de avance el costo real acumulado es %s COP frente a %s COP presupuestados (desviación de %s%%, umbral %s%%).',
             new.porcentaje_completado, new.costo_real_acumulado, new.costo_presupuestado,
             new.desviacion_porcentaje, v_acuerdo.umbral)
    );
  end if;

  return new;
end;
$$;

create trigger reportes_avance_reglas
  before insert on public.reportes_avance
  for each row execute function privado.reglas_reporte_avance();

-- ---------------------------------------------------------------------
-- UC8: ciclo del hito PENDIENTE → APROBADO → PAGADO
-- HitoDePago.liberarPago() / retenerPago()
-- ---------------------------------------------------------------------
create function privado.reglas_hito()
returns trigger
language plpgsql
as $$
declare
  v_avance numeric;
begin
  -- Lo pactado no cambia
  if (new.acuerdo_id, new.orden, new.descripcion, new.monto, new.porcentaje_pago, new.porcentaje_obra)
     is distinct from
     (old.acuerdo_id, old.orden, old.descripcion, old.monto, old.porcentaje_pago, old.porcentaje_obra) then
    raise exception 'Las condiciones pactadas del hito no se modifican';
  end if;

  -- UC8 regla: un hito solo puede pagarse una vez
  if old.estado = 'PAGADO' then
    raise exception 'El hito ya fue pagado';
  end if;

  if new.estado = 'APROBADO' and old.estado = 'PENDIENTE' then
    -- UC8 precondición 2: un reporte de avance sustenta el cumplimiento
    select porcentaje into v_avance from privado.avance_reportado(new.acuerdo_id);
    if v_avance < new.porcentaje_obra then
      raise exception '%', format(
        'Este hito exige %s%% de avance y el reportado es %s%%; el pago queda retenido (UC8)',
        new.porcentaje_obra, v_avance);
    end if;
    new.aprobado_en := now();
    new.aprobado_por := auth.uid();
    new.nota_retencion := null;

  elsif new.estado = 'PAGADO' then
    if old.estado <> 'APROBADO' then
      raise exception 'El hito debe aprobarse antes de registrar el pago (UC8)';
    end if;
    new.monto_pagado := coalesce(new.monto_pagado, new.monto);
    new.pagado_en := coalesce(new.pagado_en, now());
    new.pagado_por := auth.uid();

  elsif new.estado = 'PENDIENTE' then
    -- UC8 A1: retener exige una nota
    if coalesce(btrim(new.nota_retencion), '') = '' then
      raise exception 'Para retener el pago se debe dejar una nota';
    end if;
    new.aprobado_en := null;
    new.aprobado_por := null;

  elsif new.estado is distinct from old.estado then
    raise exception 'Cambio de estado no permitido: % → %', old.estado, new.estado;
  end if;

  return new;
end;
$$;

create trigger hitos_reglas
  before update on public.hitos_de_pago
  for each row execute function privado.reglas_hito();

-- UC8 en un solo paso para la pantalla: aprueba (si hace falta) y registra el pago.
-- Ambas transiciones quedan registradas (aprobado_en y pagado_en).
create function public.registrar_pago_hito(
  p_hito uuid,
  p_referencia text,
  p_medio text default null,
  p_observaciones text default null,
  p_monto numeric default null,
  p_justificacion text default null,
  p_fecha timestamptz default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_estado public.estado_hito;
begin
  if public.rol_actual() <> 'coordinador' then
    raise exception 'Solo la coordinación registra pagos (UC8)';
  end if;

  select estado into v_estado from public.hitos_de_pago where id = p_hito for update;
  if not found then
    raise exception 'El hito no existe o no tienes acceso a él';
  end if;

  if v_estado = 'PENDIENTE' then
    update public.hitos_de_pago set estado = 'APROBADO' where id = p_hito;
  end if;

  update public.hitos_de_pago
  set estado = 'PAGADO',
      referencia_pago = p_referencia,
      medio_pago = p_medio,
      observaciones_pago = p_observaciones,
      monto_pagado = p_monto,
      justificacion_monto = p_justificacion,
      pagado_en = p_fecha
  where id = p_hito;
end;
$$;

revoke execute on function public.registrar_pago_hito(uuid, text, text, text, numeric, text, timestamptz) from anon, public;
grant execute on function public.registrar_pago_hito(uuid, text, text, text, numeric, text, timestamptz) to authenticated;

-- ---------------------------------------------------------------------
-- UC9 y RNF-02: el historial es inmutable y el acuerdo no se reescribe
-- en silencio
-- ---------------------------------------------------------------------
create function privado.bloquear_historial()
returns trigger
language plpgsql
as $$
begin
  raise exception 'El historial de cambios no se puede modificar ni borrar (RNF-02)';
end;
$$;

create trigger historial_inmutable
  before update or delete on public.historial_cambios
  for each row execute function privado.bloquear_historial();

revoke update, delete on public.historial_cambios from anon, authenticated;

create function privado.reglas_acuerdo()
returns trigger
language plpgsql
as $$
begin
  if (new.proyecto_id, new.cotizacion_id, new.contratista_id, new.fecha_firma)
     is distinct from (old.proyecto_id, old.cotizacion_id, old.contratista_id, old.fecha_firma) then
    raise exception 'Los datos de origen del acuerdo no se modifican';
  end if;

  if (new.precio_total, new.alcance_acordado) is distinct from (old.precio_total, old.alcance_acordado)
     and coalesce(current_setting('app.cambio_alcance', true), '') <> 'on'
     and not privado.es_sistema() then
    raise exception 'El acuerdo no se modifica directamente; registra un cambio de alcance (UC9)';
  end if;

  if new.vigente and not old.vigente then
    raise exception 'Un acuerdo cerrado no se reabre';
  end if;
  if not new.vigente and old.vigente then
    new.cerrado_en := coalesce(new.cerrado_en, now());
  end if;

  return new;
end;
$$;

create trigger acuerdos_reglas
  before update on public.acuerdos_formales
  for each row execute function privado.reglas_acuerdo();

-- UC9: registrar un cambio de alcance sobre el acuerdo vigente.
-- AcuerdoFormal.registrarCambioAlcance() + HistorialCambio.registrarHuellaAuditoria()
create function public.registrar_cambio_alcance(
  p_acuerdo uuid,
  p_ambientes jsonb,
  p_justificacion text,
  p_precio_nuevo numeric default null   -- UC9 A1: ajuste de precio
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  a public.acuerdos_formales;
  v_cambio uuid;
begin
  if public.rol_actual() <> 'coordinador' then
    raise exception 'Solo la coordinación registra cambios de alcance (UC9)';
  end if;

  select * into a from public.acuerdos_formales where id = p_acuerdo for update;
  if not found then
    raise exception 'El acuerdo no existe o no tienes acceso a él';
  end if;
  if not a.vigente then
    raise exception 'Solo se modifica el alcance de un acuerdo vigente (UC9)';
  end if;

  -- UC9 E1: sin justificación no hay cambio
  if coalesce(btrim(p_justificacion), '') = '' then
    raise exception 'El cambio de alcance exige una justificación (UC9)';
  end if;
  if not privado.alcance_completo(p_ambientes) then
    raise exception 'El nuevo alcance debe tener ambientes, y cada ambiente partidas con materiales';
  end if;

  -- La versión anterior queda conservada (RNF-02)
  insert into public.historial_cambios
    (acuerdo_id, version_anterior, version_nueva, precio_anterior, precio_nuevo,
     autor_id, detalle_justificacion)
  values
    (a.id, a.alcance_acordado, p_ambientes, a.precio_total,
     coalesce(p_precio_nuevo, a.precio_total), auth.uid(), p_justificacion)
  returning id into v_cambio;

  perform set_config('app.cambio_alcance', 'on', true);
  update public.acuerdos_formales
  set alcance_acordado = p_ambientes,
      precio_total = coalesce(p_precio_nuevo, a.precio_total)
  where id = a.id;
  update public.alcances set ambientes = p_ambientes where proyecto_id = a.proyecto_id;
  perform set_config('app.cambio_alcance', 'off', true);

  -- UC9 paso 5: notificar a las partes
  perform privado.encolar_notificacion(
    a.proyecto_id, 'CAMBIO_ALCANCE', 'contratista',
    'Cambio de alcance registrado', format('Motivo: %s', p_justificacion), a.contratista_id);
  perform privado.encolar_notificacion(
    a.proyecto_id, 'CAMBIO_ALCANCE', 'cliente',
    'Cambio de alcance en tu proyecto', format('Motivo: %s', p_justificacion));

  return v_cambio;
end;
$$;

revoke execute on function public.registrar_cambio_alcance(uuid, jsonb, text, numeric) from anon, public;
grant execute on function public.registrar_cambio_alcance(uuid, jsonb, text, numeric) to authenticated;

-- ---------------------------------------------------------------------
-- UC5 regla: la empresa ajusta su umbral de desviación
-- (la política empresas_editar ya existe); aquí solo se permite ese campo.
-- ---------------------------------------------------------------------
create function privado.reglas_empresa()
returns trigger
language plpgsql
as $$
begin
  if (new.nit, new.nombre) is distinct from (old.nit, old.nombre) and not privado.es_sistema() then
    raise exception 'Solo se puede ajustar el umbral de desviación';
  end if;
  return new;
end;
$$;

create trigger empresas_reglas
  before update on public.empresas
  for each row execute function privado.reglas_empresa();

grant execute on all functions in schema privado to authenticated, service_role;