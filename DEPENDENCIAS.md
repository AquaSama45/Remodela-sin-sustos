# 📦 Dependencias y Requisitos del Sistema

Para instalar automáticamente todas las dependencias del proyecto, ejecuta en la terminal:

```bash
npm install
```

---

## 🖥️ 1. Dependencias del Frontend (SPA)

| Paquete | Versión | Propósito en el Sistema |
| :--- | :---: | :--- |
| **`react`** | `^19.3.1` | Biblioteca base para la construcción de interfaces declarativas por componentes. |
| **`react-dom`** | `^19.3.1` | Renderizado de componentes React en el DOM del navegador. |
| **`react-router-dom`** | `^7.18.5` | Enrutamiento del lado del cliente, navegación por roles y protección de rutas con `RequireRole`. |
| **`@tanstack/react-query`** | `^5.62.8` | Gestión de estado asíncrono, caché automática de 5 min y revalidación en segundo plano. |
| **`@supabase/supabase-js`** | `^2.47.10` | Cliente oficial para autenticación (JWT) y consultas directas a Supabase (PostgreSQL + RLS). |
| **`lucide-react`** | `^0.468.0` | Conjunto de iconos limpios para controles táctiles, semáforos de hitos y alertas. |

---

## ⚙️ 2. Dependencias del Backend (API Express)

| Paquete | Versión | Propósito en el Sistema |
| :--- | :---: | :--- |
| **`express`** | `^4.21.2` | Framework web para los endpoints REST de la API de negocio (`server/routes/`). |
| **`zod`** | `^3.24.1` | Validación estricta de esquemas de datos en tiempo de ejecución (alcance, cotizaciones, avances, hitos). |
| **`dotenv`** | `^16.4.7` | Carga de variables de entorno desde el archivo `.env` en entornos de desarrollo local. |

---

## 🛠️ 3. Herramientas de Desarrollo y Compilación

| Paquete | Versión | Propósito en el Sistema |
| :--- | :---: | :--- |
| **`vite`** | `^8.3.8` | Bundler y servidor de desarrollo ultra-rápido con HMR (Hot Module Replacement). |
| **`@vitejs/plugin-react`** | `^6.3.0` | Plugin oficial de Vite para soporte de JSX y React Fast Refresh. |
| **`tailwindcss`** | `^3.4.19` | Framework CSS utilitario para diseño responsivo, mobile-first y estilos de impresión `@media print`. |
| **`postcss`** | `^8.5.33` | Herramienta para transformar estilos CSS con plugins de JavaScript. |
| **`autoprefixer`** | `^10.6.2` | Agrega automáticamente prefijos de compatibilidad a las reglas CSS para todos los navegadores. |

---

## 📋 Comandos Operativos

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo frontend (Vite)
npm run dev

# 3. Compilar aplicación para producción
npm run build

# 4. Probar la compilación de producción localmente
npm run preview

# 5. Ejecutar la API backend en modo desarrollo
node server/dev.js
```
