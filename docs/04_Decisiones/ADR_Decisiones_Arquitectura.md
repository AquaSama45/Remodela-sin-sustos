---
title: Registro de Decisiones de Arquitectura (ADR)
project: Remodela sin sustos
version: 1.0.0
date: 2026-11-21
tags: [adr, decisiones, arquitectura, c4]
---

# 📋 Registro de Decisiones de Arquitectura (ADR)

Este documento registra formalmente las decisiones arquitectónicas que adaptaron y simplificaron el modelo C4 original, fundamentadas en el tamaño del equipo (2 personas), el plazo de entrega y los requisitos de calidad.

---

### ADR-01: Una sola SPA con rutas por rol en vez de 3 aplicaciones separadas
* **Estado:** Aprobado e Implementado.
* **Contexto:** El C4 Nivel 2 inicial planteaba tres aplicaciones cliente independientes (*Web de Gestión*, *App Móvil de Campo* y *Portal de Cliente*). Con un equipo de dos personas, mantener tres repositorios y tres pipelines triplica la carga sin beneficio funcional.
* **Decisión:** Desarrollar una sola SPA en React con rutas protegidas por roles (`/`, `/campo`, `/cliente`).
* **Consecuencias:** Un solo repositorio, un solo deploy en Vercel, reutilización de componentes de tablas, formularios y estilos, y cumplimiento de RNF-01 y RNF-05 con layouts adaptados.

---

### ADR-02: Supabase (BaaS) como plataforma backend integrada
* **Estado:** Aprobado e Implementado.
* **Contexto:** Construir autenticación JWT, RBAC, ORM y endpoints CRUD desde cero consume el 70% del tiempo de desarrollo disponible.
* **Decisión:** Adoptar Supabase (PostgreSQL gestionado + Auth + PostgREST + RLS).
* **Consecuencias:** Autenticación y seguridad de datos resueltas y probadas. El esfuerzo del equipo se concentra en las reglas de negocio diferenciadoras del dominio.

---

### ADR-03: Reglas de negocio críticas en triggers y funciones PostgreSQL
* **Estado:** Aprobado e Implementado.
* **Contexto:** Reglas como *un solo alcance oficial*, *acuerdo único vigente*, *prohibición de doble pago* e *historial inmutable* no pueden ser vulneradas por llamadas directas al API ni por clientes modificados.
* **Decisión:** Escribir las reglas de integridad como restricciones (`CHECK`), índices únicos parciales y triggers (`BEFORE UPDATE`, `BEFORE DELETE`) en PL/pgSQL directamente dentro de Postgres.
* **Consecuencias:** Las reglas son 100% transaccionales, se ejecutan con latencia cero de red, no tienen condiciones de carrera y cumplen RNF-02 por construcción.

---

### ADR-04: Control de acceso con Row Level Security (RLS)
* **Estado:** Aprobado e Implementado.
* **Contexto:** RNF-03 exige que ningún contratista consulte cotizaciones de otro contratista ni clientes vean obras ajenas.
* **Decisión:** Activar RLS en el 100% de tablas con políticas basadas en los claims del JWT (`auth.uid()`, rol y proyectos vinculados), empleando funciones `SECURITY DEFINER` para evitar recursión.
* **Consecuencias:** El filtro de seguridad se aplica en el motor de base de datos antes de entregar cualquier fila, eliminando el riesgo de que un endpoint olvide validar la autorización.

---

### ADR-05: Correo transaccional mediante cola asíncrona en PostgreSQL
* **Estado:** Aprobado e Implementado.
* **Contexto:** Enviar correos sincrónicamente desde los controladores o triggers expone a fallos de red externos que podrían revertir operaciones de negocio válidas (como registrar un avance).
* **Decisión:** Los triggers de negocio insertan la alerta en una tabla técnica `notificaciones`. Un servicio desacoplado recoge los mensajes pendientes y los despacha mediante Resend / Brevo.
* **Consecuencias:** Si el servicio de correo externo falla, la operación de obra queda guardada y el correo se reintenta sin afectar al usuario final.
