-- Borra SOLO lo que creó la cuenta de prueba "Claude Pruebas" — nunca toca
-- datos creados por otras cuentas (como la real de la dueña del negocio).
-- Pégalo en Supabase > SQL Editor > New query > Run.

delete from pagos_aplicados
where movimiento_venta_id in (
  select id from movimientos
  where creado_por = (select id from usuarios where nombre = 'Claude Pruebas')
);

delete from movimientos
where creado_por = (select id from usuarios where nombre = 'Claude Pruebas');

delete from encargos
where creado_por = (select id from usuarios where nombre = 'Claude Pruebas');

delete from clientes
where creado_por = (select id from usuarios where nombre = 'Claude Pruebas');

-- Solo borra productos que esa cuenta dio de alta Y que ya no tienen NINGÚN
-- movimiento de nadie (si alguien más ya vendió/compró ese producto, se
-- conserva aunque lo haya creado la cuenta de prueba).
delete from productos
where creado_por = (select id from usuarios where nombre = 'Claude Pruebas')
  and not exists (select 1 from movimientos m where m.producto_id = productos.id);

-- Por último, borra la cuenta de prueba misma (opcional — coméntalo si
-- quieres conservar la cuenta para que yo pueda seguir probando después).
delete from usuarios where nombre = 'Claude Pruebas';
