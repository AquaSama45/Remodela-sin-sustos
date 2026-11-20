// scripts/seed.mjs
// Datos de prueba del caso ancla (Obra Clara S.A.S.), con los mismos nombres
// que usa el frontend. Se corre en tu PC, NUNCA desde el navegador:
//   node --env-file=.env scripts/seed.mjs
// Usa la secret key (salta RLS). Se puede correr varias veces sin duplicar.
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const password = process.env.SEED_PASSWORD;

if (!url || !secretKey || !password) {
  console.error(
    "Faltan VITE_SUPABASE_URL, SUPABASE_SECRET_KEY o SEED_PASSWORD en el .env",
  );
  process.exit(1);
}

const db = createClient(url, secretKey, { auth: { persistSession: false } });

// IDs fijos: así el script no duplica datos si se corre de nuevo
const EMPRESA = "10000000-0000-4000-8000-000000000001";
const CLI = {
  gomez: "20000000-0000-4000-8000-000000000001",
  arango: "20000000-0000-4000-8000-000000000002",
  morales: "20000000-0000-4000-8000-000000000003",
};
const CON = {
  carlos: "30000000-0000-4000-8000-000000000001",
  gustavo: "30000000-0000-4000-8000-000000000002",
  mateo: "30000000-0000-4000-8000-000000000003",
};
const PROY = {
  laureles: "40000000-0000-4000-8000-000000000001",
  sabaneta: "40000000-0000-4000-8000-000000000002",
  belen: "40000000-0000-4000-8000-000000000003",
};

async function guardar(tabla, filas, conflicto = "id") {
  const { error } = await db
    .from(tabla)
    .upsert(filas, { onConflict: conflicto });
  if (error) throw new Error(`${tabla}: ${error.message}`);
  console.log(`✔ ${tabla} (${filas.length})`);
}

// Crea el usuario en Supabase Auth (o lo encuentra si ya existe) y completa su perfil
async function usuario({
  email,
  nombre,
  cargo,
  rol,
  empresa_id = null,
  cliente_id = null,
  contratista_id = null,
}) {
  let { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { rol },
    user_metadata: { nombre },
  });

  let id = data?.user?.id;
  if (error) {
    if (!/already|registered|exists/i.test(error.message))
      throw new Error(`${email}: ${error.message}`);
    const { data: lista, error: e2 } = await db.auth.admin.listUsers({
      perPage: 1000,
    });
    if (e2) throw new Error(e2.message);
    id = lista.users.find((u) => u.email === email)?.id;
  }

  // El trigger crear_perfil ya creó la fila; aquí la vinculamos a su entidad de negocio
  const { error: e3 } = await db
    .from("perfiles")
    .update({ nombre, cargo, rol, empresa_id, cliente_id, contratista_id })
    .eq("id", id);
  if (e3) throw new Error(`perfil ${email}: ${e3.message}`);
  console.log(`✔ usuario ${rol.padEnd(11)} ${email}`);
}

async function main() {
  await guardar("empresas", [
    {
      id: EMPRESA,
      nit: "901234567-1",
      nombre: "Obra Clara S.A.S.",
      umbral_desviacion: 10,
    },
  ]);

  await guardar("clientes", [
    { id: CLI.gomez, empresa_id: EMPRESA, nombre: "Familia Gómez" },
    { id: CLI.arango, empresa_id: EMPRESA, nombre: "Dra. Patricia Arango" },
    { id: CLI.morales, empresa_id: EMPRESA, nombre: "Andrés Felipe Morales" },
  ]);

  await guardar("contratistas", [
    {
      id: CON.carlos,
      nombre: "Carlos Pérez",
      tipo_contratista: "Contratista Integral (Llave en mano)",
    },
    {
      id: CON.gustavo,
      nombre: "Gustavo Osorio",
      tipo_contratista: "Maestro de Obra (Por administración)",
    },
    {
      id: CON.mateo,
      nombre: "Mateo Henao",
      tipo_contratista: "Taller de Acabados",
    },
  ]);

  // Correos con dominio .test (reservado, no existe): ningún correo de prueba llega a una persona real
  await usuario({
    email: "diana.cardona@obraclara.test",
    nombre: "Diana Cardona",
    cargo: "Coordinadora General",
    rol: "coordinador",
    empresa_id: EMPRESA,
  });
  await usuario({
    email: "auxiliar@obraclara.test",
    nombre: "Laura Restrepo",
    cargo: "Auxiliar de Coordinación",
    rol: "auxiliar",
    empresa_id: EMPRESA,
  });
  await usuario({
    email: "gerencia@obraclara.test",
    nombre: "Gerencia General",
    cargo: "Dirección de Operaciones",
    rol: "gerencia",
    empresa_id: EMPRESA,
  });
  await usuario({
    email: "carlos.integral@obrasmedellin.test",
    nombre: "Carlos Pérez",
    cargo: "Contratista Integral (Llave en mano)",
    rol: "contratista",
    contratista_id: CON.carlos,
  });
  await usuario({
    email: "gustavo.maestro@obras.test",
    nombre: "Gustavo Osorio",
    cargo: "Maestro de Obra (Por administración)",
    rol: "contratista",
    contratista_id: CON.gustavo,
  });
  await usuario({
    email: "mateo.taller@acabadosbelen.test",
    nombre: "Mateo Henao",
    cargo: "Taller de Acabados",
    rol: "contratista",
    contratista_id: CON.mateo,
  });
  await usuario({
    email: "familia.gomez@cliente.test",
    nombre: "Familia Gómez",
    cargo: "Cliente Propietario (Apt Laureles)",
    rol: "cliente",
    cliente_id: CLI.gomez,
  });

  await guardar("proyectos", [
    {
      id: PROY.laureles,
      empresa_id: EMPRESA,
      cliente_id: CLI.gomez,
      nombre: "Apt 78 m² Laureles (Cocina y Baño)",
      direccion_inmueble: "Laureles, Medellín",
      presupuesto_asignado: 21900000,
    },
    {
      id: PROY.sabaneta,
      empresa_id: EMPRESA,
      cliente_id: CLI.arango,
      nombre: "Casa 120 m² Sabaneta (Por Etapas)",
      direccion_inmueble: "Sabaneta, Antioquia",
      presupuesto_asignado: 38500000,
    },
    {
      id: PROY.belen,
      empresa_id: EMPRESA,
      cliente_id: CLI.morales,
      nombre: "Apt 63 m² Belén (Cocina integral)",
      direccion_inmueble: "Belén, Medellín",
      presupuesto_asignado: 14700000,
    },
  ]);

  // Laureles tiene dos contratistas para poder probar la comparación de cotizaciones (UC3)
  await guardar(
    "proyecto_contratistas",
    [
      { proyecto_id: PROY.laureles, contratista_id: CON.carlos },
      { proyecto_id: PROY.laureles, contratista_id: CON.mateo },
      { proyecto_id: PROY.sabaneta, contratista_id: CON.gustavo },
      { proyecto_id: PROY.belen, contratista_id: CON.mateo },
    ],
    "proyecto_id,contratista_id",
  );

  // Alcance en BORRADOR, con la misma estructura del formulario AlcanceForm
  await guardar(
    "alcances",
    [
      {
        proyecto_id: PROY.laureles,
        ambientes: [
          {
            nombre: "Cocina",
            partidas: [
              {
                nombre: "Demolición y adecuaciones hidrosanitarias",
                materiales: [
                  "Tubería PVC 1/2 pulgada",
                  "Soldadura PVC",
                  "Cinta teflón",
                ],
              },
              {
                nombre: "Enchapes y acabados",
                materiales: [
                  "Porcelanato 60x60 rectificado",
                  "Pegacor flexible gris",
                  "Boquilla impermeable",
                ],
              },
            ],
          },
          {
            nombre: "Baño Principal",
            partidas: [
              {
                nombre: "Enchape de paredes y piso antideslizante",
                materiales: ["Cerámica antideslizante", "Pegante", "Boquilla"],
              },
            ],
          },
        ],
      },
    ],
    "proyecto_id",
  );

  console.log(
    "\nListo. Contraseña de todos los usuarios: la de SEED_PASSWORD en tu .env",
  );
}

main().catch((e) => {
  console.error("✖", e.message);
  process.exit(1);
});
