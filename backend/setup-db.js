/**
 * setup-db.js - Ejecuta el schema de Ozone en Supabase
 *
 * USO OPCION A (recomendado - conexión directa PostgreSQL):
 *   Agrega a .env: DATABASE_URL=postgresql://postgres:[PASSWORD]@db.jairlmbadfotyoviehcu.supabase.co:5432/postgres
 *   Encuentra el password en: Supabase Dashboard > Project Settings > Database > Connection string
 *   node setup-db.js
 *
 * USO OPCION B (Management API token):
 *   Agrega a .env: SUPABASE_MGMT_TOKEN=sbp_... (https://supabase.com/dashboard/account/tokens)
 *   node setup-db.js
 *
 * USO OPCION C (manual):
 *   Ve a: https://supabase.com/dashboard/project/jairlmbadfotyoviehcu/sql/new
 *   Pega el contenido de backend/sql/schema.sql y ejecuta
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

const PROJECT_REF = SUPABASE_URL ? SUPABASE_URL.replace('https://', '').split('.')[0] : null;
const SQL_PATH = path.join(__dirname, 'sql', 'schema.sql');

async function checkTablesExist() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { error } = await supabase.from('folders').select('id').limit(1);
  if (error && (error.message?.includes('schema cache') || error.message?.includes("Can't find") || error.code === '42P01')) {
    return false;
  }
  return true;
}

async function executeViaPostgres(sql) {
  const { Client } = require('pg');
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✓ Conectado a PostgreSQL directamente');
  
  try {
    // Ejecutar el SQL completo
    await client.query(sql);
    console.log('✓ Schema ejecutado correctamente via pg directo');
  } finally {
    await client.end();
  }
}

async function executeViaMgmtAPI(sql) {
  const fetch = require('node-fetch'); // node-fetch v2 (CommonJS)
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MGMT_TOKEN}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Management API error ${response.status}: ${text}`);
  }

  return await response.json();
}

function printManualInstructions() {
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│  INSTRUCCIONES PARA EJECUTAR EL SCHEMA MANUALMENTE          │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('\n► OPCIÓN MANUAL (más rápida):');
  console.log('  1. Ve a: https://supabase.com/dashboard/project/jairlmbadfotyoviehcu/sql/new');
  console.log('  2. Copia y pega el contenido de: backend/sql/schema.sql');
  console.log('  3. Haz clic en "Run"');
  console.log('\n► OPCIÓN AUTOMÁTICA con DATABASE_URL:');
  console.log('  1. Ve a: Supabase Dashboard > Project Settings > Database');
  console.log('  2. Copia "Connection string" (URI format)');
  console.log('  3. Agrega a backend/.env: DATABASE_URL=postgresql://postgres:[password]@db.jairlmbadfotyoviehcu.supabase.co:5432/postgres');
  console.log('  4. Ejecuta: node setup-db.js');
  console.log('\n► OPCIÓN AUTOMÁTICA con Management Token:');
  console.log('  1. Ve a: https://supabase.com/dashboard/account/tokens');
  console.log('  2. Crea un token y agrega a .env: SUPABASE_MGMT_TOKEN=sbp_...');
  console.log('  3. Ejecuta: node setup-db.js\n');
}

async function verifyData() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('\n[Verificando datos demo...]');
  const { data: folders, error } = await supabase
    .from('folders')
    .select('name, icon')
    .eq('user_id', '00000000-0000-0000-0000-000000000001')
    .order('order_index');

  if (error) {
    console.error('Error verificando carpetas:', error.message);
    return;
  }

  if (!folders || folders.length === 0) {
    console.log('⚠  No hay carpetas demo. Verifica que el schema se ejecutó correctamente.');
    return;
  }

  console.log(`✓ ${folders.length} carpetas demo encontradas:`);
  folders.forEach(f => console.log(`  ${f.icon} ${f.name}`));
  console.log('\n✓ Base de datos lista. Puedes iniciar el backend con: node src/index.js\n');
}

async function main() {
  console.log('=== Ozone DB Setup ===\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en .env');
    process.exit(1);
  }

  console.log(`Proyecto Supabase: ${PROJECT_REF}`);

  // 1. Verificar si las tablas ya existen
  console.log('\n[1/3] Verificando si el schema ya existe...');
  const tablesExist = await checkTablesExist();

  if (tablesExist) {
    console.log('✓ Las tablas ya existen. Schema OK.');
    await verifyData();
    return;
  }

  console.log('✗ Tablas no encontradas. Necesito ejecutar el schema.');

  // 2. Leer el SQL
  if (!fs.existsSync(SQL_PATH)) {
    console.error(`ERROR: No se encontró ${SQL_PATH}`);
    process.exit(1);
  }
  const sqlContent = fs.readFileSync(SQL_PATH, 'utf8');

  // 3. Intentar ejecutar (en orden de preferencia)
  if (DATABASE_URL) {
    console.log('\n[2/3] Ejecutando schema via conexión directa PostgreSQL...');
    try {
      await executeViaPostgres(sqlContent);
      await verifyData();
      return;
    } catch (err) {
      console.error('Error con pg directo:', err.message);
    }
  }

  if (MGMT_TOKEN) {
    console.log('\n[2/3] Ejecutando schema via Supabase Management API...');
    try {
      await executeViaMgmtAPI(sqlContent);
      console.log('✓ Schema ejecutado correctamente via Management API!');
      await verifyData();
      return;
    } catch (err) {
      console.error('Error con Management API:', err.message);
    }
  }

  // Ninguna opción automática disponible
  console.log('\n[2/3] No se encontró DATABASE_URL ni SUPABASE_MGMT_TOKEN.');
  printManualInstructions();
}

main().catch(err => {
  console.error('\nError fatal:', err.message);
  process.exit(1);
});
