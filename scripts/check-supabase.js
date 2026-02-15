/**
 * Valida la conexión a Supabase leyendo .env y haciendo una petición de prueba.
 * Ejecutar: node scripts/check-supabase.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ No se encontró archivo .env');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*VITE_SUPABASE_(URL|PUBLISHABLE_KEY|PROJECT_ID)\s*=\s*["']?([^"'\s#]+)["']?/);
    if (m) {
      const k = m[1];
      if (k === 'URL') env.url = m[2].trim();
      else if (k === 'PUBLISHABLE_KEY') env.key = m[2].trim();
      else if (k === 'PROJECT_ID') env.projectId = m[2].trim();
    }
  });
  return env;
}

async function checkConnection() {
  const { url, key } = loadEnv();
  if (!url || !key) {
    console.error('❌ Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en .env');
    process.exit(1);
  }

  console.log('🔍 Comprobando conexión a Supabase...');
  console.log('   URL:', url);

  const restUrl = `${url.replace(/\/$/, '')}/rest/v1/products?select=id&limit=1`;
  const res = await fetch(restUrl, {
    method: 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  const text = await res.text();

  if (res.ok) {
    console.log('\n✅ Conexión con Supabase correcta.');
    console.log('   La API responde y la tabla "products" es accesible.');
    return;
  }

  if (res.status === 401) {
    console.log('\n⚠️  Supabase responde pero la clave (anon key) no es válida.');
    console.log('   Revisa VITE_SUPABASE_PUBLISHABLE_KEY en .env (anon key del proyecto).');
    process.exit(1);
  }

  if (res.status === 404) {
    console.log('\n⚠️  Conexión con el servidor OK, pero se recibió 404.');
    console.log('   Suele indicar que la tabla "products" no existe aún.');
    console.log('   Ejecuta las migraciones en Supabase (README, sección Supabase).');
    console.log('   Si ya las aplicaste, revisa VITE_SUPABASE_PUBLISHABLE_KEY (anon key del proyecto).');
    process.exit(1);
  }

  if (res.status === 406 || (res.status >= 500 && text.includes('relation'))) {
    console.log('\n⚠️  Conexión OK, pero la tabla "products" no existe o no está accesible.');
    console.log('   Ejecuta las migraciones en Supabase (ver README, sección Supabase).');
    process.exit(1);
  }

  console.log('\n❌ Error:', res.status, res.statusText);
  if (text) console.log('   Respuesta:', text.slice(0, 300));
  process.exit(1);
}

checkConnection().catch((err) => {
  console.error('\n❌ Error de conexión:', err.message);
  if (err.cause) console.error('   Causa:', err.cause.message || err.cause);
  const { projectId } = loadEnv();
  if (projectId && (err.cause?.code === 'ENOTFOUND' || err.message?.includes('fetch failed'))) {
    console.error('\n   Tip: Si tu proyecto tiene otro ID, la URL debe ser:');
    console.error('   VITE_SUPABASE_URL=https://' + projectId + '.supabase.co');
  }
  process.exit(1);
});
