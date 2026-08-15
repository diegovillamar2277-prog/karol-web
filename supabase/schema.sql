-- Schema inicial: control de gastos/ganancia para reventa por redes sociales
-- Ejecutar en el SQL editor de Supabase (Project > SQL Editor > New query)

-- Extensión para cifrado a nivel de columna (pgcrypto)
create extension if not exists pgcrypto;

-- Dueña del negocio (un solo usuario, PIN con hash bcrypt)
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  pin_hash text not null, -- bcrypt, nunca texto plano
  creado_en timestamptz not null default now()
);

-- Catálogo de productos que revende
create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  costo_referencia numeric(10, 2), -- último costo de compra conocido, solo referencia
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Clientes (nombre cifrado con pgcrypto — dato sensible)
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre_cifrado bytea not null, -- pgp_sym_encrypt(nombre, clave)
  telefono_cifrado bytea, -- pgp_sym_encrypt(telefono, clave)
  creado_en timestamptz not null default now()
);

-- Movimientos: el ledger. NUNCA se edita ni se borra un renglón.
-- Una corrección es un movimiento nuevo que referencia al original (columna corrige_a).
create table if not exists movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('compra', 'venta', 'ajuste')),
  producto_id uuid references productos(id),
  cliente_id uuid references clientes(id), -- solo aplica a ventas
  cantidad numeric(10, 2) not null,
  costo_unitario numeric(10, 2), -- lo que costó (compra o costo del producto vendido)
  precio_unitario numeric(10, 2), -- lo que se cobró (solo ventas)
  monto_cifrado bytea, -- opcional: monto total cifrado si se quiere ocultar aún de vistazo directo en BD
  corrige_a uuid references movimientos(id), -- null si es el movimiento original
  nota text,
  creado_en timestamptz not null default now()
);

-- Pagos aplicados: soporta abonos parciales y pagos dirigidos a una venta específica
create table if not exists pagos_aplicados (
  id uuid primary key default gen_random_uuid(),
  movimiento_venta_id uuid not null references movimientos(id), -- la venta que se está pagando
  monto_aplicado numeric(10, 2) not null,
  creado_en timestamptz not null default now()
);

-- Índices para las consultas más comunes (ganancia del mes, saldo por cliente)
create index if not exists idx_movimientos_tipo_fecha on movimientos (tipo, creado_en);
create index if not exists idx_movimientos_cliente on movimientos (cliente_id);
create index if not exists idx_pagos_venta on pagos_aplicados (movimiento_venta_id);

-- Nota sobre cifrado de columnas (pgcrypto):
-- pgp_sym_encrypt(texto, clave) / pgp_sym_decrypt(dato, clave)
-- La "clave" NUNCA va en este archivo ni en el repo — vive en una variable de
-- entorno de Vercel (ENCRYPTION_KEY) y se pasa como parámetro en cada query
-- desde el Server Action, nunca hardcodeada en SQL.

-- Funciones que hacen el cifrado/descifrado del lado de Postgres, para que
-- el texto plano del nombre/teléfono nunca viaje sin cifrar más que en el
-- momento del insert/select (el Server Action nunca ve la clave más que
-- para pasarla como parámetro).

create or replace function crear_cliente(
  p_nombre text,
  p_telefono text,
  p_clave text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into clientes (nombre_cifrado, telefono_cifrado)
  values (
    pgp_sym_encrypt(p_nombre, p_clave),
    case when p_telefono is null then null else pgp_sym_encrypt(p_telefono, p_clave) end
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function listar_clientes(p_clave text)
returns table (id uuid, nombre text, telefono text, creado_en timestamptz)
language plpgsql
security definer
as $$
begin
  return query
  select
    c.id,
    pgp_sym_decrypt(c.nombre_cifrado, p_clave)::text as nombre,
    case when c.telefono_cifrado is null then null
         else pgp_sym_decrypt(c.telefono_cifrado, p_clave)::text end as telefono,
    c.creado_en
  from clientes c
  order by c.creado_en desc;
end;
$$;
