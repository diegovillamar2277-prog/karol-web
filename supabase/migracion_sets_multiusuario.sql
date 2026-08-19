-- Migración: precio sugerido, SETs con reparto de costo, y multi-usuario con
-- datos compartidos marcados por quién los creó.
-- Pégalo en Supabase > SQL Editor > New query > Run. No borra nada existente.

-- 1. Precio sugerido por producto (para autocompletar el precio de venta).
alter table productos
  add column if not exists precio_sugerido numeric(10, 2);

-- 2. Quién creó cada registro, para poder limpiar datos de prueba sin tocar
--    los reales. Los datos siguen siendo de UN solo negocio (compartidos);
--    esto solo etiqueta el autor, no separa inventarios.
alter table productos  add column if not exists creado_por uuid references usuarios(id);
alter table movimientos add column if not exists creado_por uuid references usuarios(id);
alter table clientes    add column if not exists creado_por uuid references usuarios(id);
alter table encargos    add column if not exists creado_por uuid references usuarios(id);

create index if not exists idx_productos_creado_por on productos (creado_por);
create index if not exists idx_movimientos_creado_por on movimientos (creado_por);
create index if not exists idx_clientes_creado_por on clientes (creado_por);
create index if not exists idx_encargos_creado_por on encargos (creado_por);

-- 3. crear_cliente ahora también guarda quién lo dio de alta.
create or replace function crear_cliente(
  p_nombre text,
  p_telefono text,
  p_clave text,
  p_creado_por uuid default null
) returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into clientes (nombre_cifrado, telefono_cifrado, creado_por)
  values (
    pgp_sym_encrypt(p_nombre, p_clave),
    case when p_telefono is null then null else pgp_sym_encrypt(p_telefono, p_clave) end,
    p_creado_por
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- Nota: la cuenta de prueba se crea normal desde /login ("Crear otra cuenta").
-- Para limpiar SOLO lo que generó esa cuenta, usa
-- supabase/limpiar_datos_de_usuario.sql con su id (no borra la cuenta real
-- ni nada que no lleve su creado_por).
