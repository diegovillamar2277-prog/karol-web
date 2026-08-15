-- Borra TODOS los datos de prueba (usuario, productos, movimientos, clientes,
-- encargos y pagos) para dejar la base vacía antes de que la dueña real
-- empiece a usarla. Pégalo en Supabase > SQL Editor > New query > Run.

delete from pagos_aplicados;
delete from encargos;
delete from movimientos;
delete from clientes;
delete from productos;
delete from usuarios;
