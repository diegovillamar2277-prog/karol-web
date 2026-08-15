-- Migración: control de stock (entradas de mercancía) + encargos.
-- Pégalo en Supabase > SQL Editor > New query y dale Run.
-- No borra nada existente, solo agrega columnas/tablas nuevas.

-- 1. Stock disponible por producto. Se ajusta solo (ver trigger abajo).
alter table productos
  add column if not exists cantidad_disponible numeric(10, 2) not null default 0;

-- 2. Marca si una venta es de un encargo (producto que no salió de su
--    inventario normal, por eso NO debe descontar stock).
alter table movimientos
  add column if not exists es_encargo boolean not null default false;

-- 3. Encargos: lo que un cliente pidió y ella no tenía en stock.
create table if not exists encargos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  descripcion text not null, -- qué pidió (texto libre, no siempre es un producto del catálogo)
  precio_acordado numeric(10, 2) not null,
  anticipo numeric(10, 2) not null default 0,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'entregado', 'cancelado')),
  movimiento_id uuid references movimientos(id), -- se llena cuando se entrega y se registra la venta
  creado_en timestamptz not null default now(),
  entregado_en timestamptz
);

create index if not exists idx_encargos_estado on encargos (estado);

-- 4. Trigger: cada vez que se inserta un movimiento, ajusta el stock del
--    producto automáticamente. Compra = entra mercancía (+). Venta = sale
--    mercancía (-), EXCEPTO si es_encargo = true (ese producto nunca estuvo
--    en su inventario regular, así que no hay nada que descontar).
--    Nunca se hace UPDATE manual de cantidad_disponible desde la app — solo
--    este trigger la toca, para que el número siempre cuadre con el ledger.
create or replace function ajustar_stock() returns trigger
language plpgsql
as $$
begin
  if new.producto_id is not null then
    if new.tipo = 'compra' then
      update productos set cantidad_disponible = cantidad_disponible + new.cantidad
      where id = new.producto_id;
    elsif new.tipo = 'venta' and not new.es_encargo then
      update productos set cantidad_disponible = cantidad_disponible - new.cantidad
      where id = new.producto_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ajustar_stock on movimientos;
create trigger trg_ajustar_stock
  after insert on movimientos
  for each row execute function ajustar_stock();

-- 5. Función para listar encargos con el nombre del cliente ya descifrado.
create or replace function listar_encargos(p_clave text)
returns table (
  id uuid,
  cliente_nombre text,
  descripcion text,
  precio_acordado numeric,
  anticipo numeric,
  estado text,
  creado_en timestamptz,
  entregado_en timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select
    e.id,
    case when e.cliente_id is null then null
         else pgp_sym_decrypt(c.nombre_cifrado, p_clave)::text end as cliente_nombre,
    e.descripcion,
    e.precio_acordado,
    e.anticipo,
    e.estado,
    e.creado_en,
    e.entregado_en
  from encargos e
  left join clientes c on c.id = e.cliente_id
  order by
    case e.estado when 'pendiente' then 0 else 1 end,
    e.creado_en desc;
end;
$$;
