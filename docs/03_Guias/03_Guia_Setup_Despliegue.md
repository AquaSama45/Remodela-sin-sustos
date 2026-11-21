---
title: Guía de Setup y Despliegue
project: Remodela sin sustos
version: 1.0.0
date: 2026-11-21
tags: [setup, despliegue, vercel, supabase, entorno]
---

# 🚀 Guía de Setup y Despliegue

## 1. Configuración de Entorno Local

### 1.1 Clonación e Instalación
```bash
git clone https://github.com/AquaSama45/Remodela-sin-sustos.git
cd Remodela-sin-sustos
npm install
```

### 1.2 Archivo de Entorno (`.env`)
Crear el archivo `.env` en la raíz del repositorio con los valores aprovisionados de Supabase y Resend:
```env
VITE_SUPABASE_URL=https://gbrbzrywoczjyjbndsfa.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xPjzWyDTlmG9nNL1Y0XASw_6Y9_4Lpt
SUPABASE_SECRET_KEY=sb_secret_lSCuUDf2xTuwwTYlz4nDVA_Uy7MvjEn
SEED_PASSWORD=Remodela2026
RESEND_API_KEY=re_AG1djDHw_Bob97X9XPJ9nTw283AQkEfPC
CORREO_REDIRIGIR_A=juanesacevedop1101@gmail.com
```

---

## 2. Scripts de Población y Pruebas Automáticas

El repositorio incluye scripts en NodeJS para poblar la base de datos y verificar la lógica de negocio de punta a punta:

### 2.1 Carga Inicial de Datos (Seed)
Crea las empresas, proyectos del caso ancla (Laureles, Sabaneta, Belén) y usuarios de prueba:
```bash
node scripts/seed.mjs
```

### 2.2 Prueba del Flujo de Cotización (UC1 a UC4)
Valida la creación de alcance, envío de cotizaciones estructuradas, comparación matricial y firma de acuerdo:
```bash
node scripts/flujo-cotizacion.mjs
```

### 2.3 Prueba del Flujo de Obra y Pagos (UC5 a UC8)
Valida reporte de avance, detección de sobrecosto, alerta y liberación de pagos por hitos:
```bash
node scripts/flujo-obra.mjs
```

### 2.4 Monitoreo de Salud de la API
```bash
node scripts/probar-api.mjs
```

---

## 3. Despliegue en Producción (Vercel)

El proyecto está configurado mediante `vercel.json` para desplegar el frontend de Vite y la API Express como Serverless Function:

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Pasos en Vercel:
1. Conectar el repositorio de GitHub `AquaSama45/Remodela-sin-sustos`.
2. Seleccionar el preset **Vite**.
3. Cargar las 5 variables de entorno requeridas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SECRET_KEY` (Sensitive)
   - `RESEND_API_KEY` (Sensitive)
   - `CORREO_REDIRIGIR_A`
4. Ejecutar el Deploy.
5. Verificar salud en: `https://TU-DOMINIO.vercel.app/api/health` $\rightarrow$ `{"baseDatos":"ok"}`.
