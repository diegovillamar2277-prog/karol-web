import { createClient } from "@supabase/supabase-js";

// Cliente de servidor con la service-role key. Solo se usa dentro de
// Server Actions / código que corre en el servidor — nunca se expone al
// navegador. No usamos RLS (Row Level Security): todos los permisos se
// verifican en código de servidor antes de tocar la base de datos.
export function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno"
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
