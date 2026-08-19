"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import { getSesion } from "@/lib/auth";

const CLAVE_CIFRADO = process.env.ENCRYPTION_KEY as string;

async function requireSesion() {
  const sesion = await getSesion();
  if (!sesion.usuarioId) {
    throw new Error("No hay sesión activa.");
  }
  return sesion;
}

// Productos activos con su stock actual, para el selector de "Registrar venta".
export async function obtenerProductosConStock() {
  await requireSesion();
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, costo_referencia, precio_sugerido, cantidad_disponible")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error || !data) return [];
  return data;
}

// Registrar una venta de algo que YA ESTABA en su stock: ella solo elige
// el producto (de lo que ya tiene registrado) y anota cuánto vendió y en
// cuánto. El costo se toma del producto — nunca lo captura a mano — así
// no hay forma de que costo y precio se mezclen o se equivoquen.
export type EstadoVenta = { error?: string; success?: boolean } | null;

export async function registrarVenta(_estado: EstadoVenta, formData: FormData) {
  const sesion = await requireSesion();
  const supabase = supabaseServer();

  const productoId = String(formData.get("producto_id") || "").trim();
  const cantidad = Number(formData.get("cantidad") || 0);
  const precioUnitario = Number(formData.get("precio") || 0);
  const clienteNombre = String(formData.get("cliente") || "").trim();
  const clienteTelefono = String(formData.get("telefono") || "").trim();

  if (!productoId || !cantidad || !precioUnitario) {
    return { error: "Elige el producto, la cantidad y el precio de venta." };
  }

  const { data: producto, error: errorProducto } = await supabase
    .from("productos")
    .select("id, costo_referencia, cantidad_disponible")
    .eq("id", productoId)
    .single();

  if (errorProducto || !producto) {
    return { error: "Ese producto ya no existe en tu inventario." };
  }

  if (cantidad > producto.cantidad_disponible) {
    return {
      error: `Solo tienes ${producto.cantidad_disponible} en stock de ese producto.`,
    };
  }

  let clienteId: string | null = null;
  if (clienteNombre) {
    const { data: idCliente, error: errorCliente } = await supabase.rpc("crear_cliente", {
      p_nombre: clienteNombre,
      p_telefono: clienteTelefono || null,
      p_clave: CLAVE_CIFRADO,
      p_creado_por: sesion.usuarioId,
    });
    if (errorCliente) {
      return { error: "No se pudo registrar el cliente: " + errorCliente.message };
    }
    clienteId = idCliente as string;
  }

  // El trigger ajustar_stock en Supabase descuenta el stock automáticamente
  // al insertar este movimiento (tipo = venta, es_encargo = false).
  const { error: errorMovimiento } = await supabase.from("movimientos").insert({
    tipo: "venta",
    producto_id: producto.id,
    cliente_id: clienteId,
    cantidad,
    costo_unitario: producto.costo_referencia,
    precio_unitario: precioUnitario,
    creado_por: sesion.usuarioId,
  });

  if (errorMovimiento) {
    return { error: "No se pudo registrar la venta: " + errorMovimiento.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/ventas");
  revalidatePath("/productos");
  return { success: true };
}

export async function obtenerGananciaDelMes() {
  await requireSesion();
  const supabase = supabaseServer();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("movimientos")
    .select("cantidad, costo_unitario, precio_unitario")
    .eq("tipo", "venta")
    .gte("creado_en", inicioMes.toISOString());

  if (error || !data) {
    return { totalVentas: 0, totalCosto: 0, ganancia: 0 };
  }

  let totalVentas = 0;
  let totalCosto = 0;
  for (const mov of data) {
    totalVentas += (mov.precio_unitario || 0) * (mov.cantidad || 0);
    totalCosto += (mov.costo_unitario || 0) * (mov.cantidad || 0);
  }

  return { totalVentas, totalCosto, ganancia: totalVentas - totalCosto };
}

export async function listarVentasRecientes() {
  await requireSesion();
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("movimientos")
    .select("id, cantidad, costo_unitario, precio_unitario, creado_en, productos(nombre)")
    .eq("tipo", "venta")
    .order("creado_en", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data;
}
