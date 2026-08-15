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

// Registrar una venta: producto, costo (lo que le costó a ella) y precio
// (lo que cobró). Nunca se guardan en la misma columna — es la lección real
// que ya sacamos de licoreria-app: mezclar costo y precio cobrado rompe la
// integridad del reporte de ganancia en cuanto alguien edita algo después.
export type EstadoVenta = { error?: string; success?: boolean } | null;

export async function registrarVenta(_estado: EstadoVenta, formData: FormData) {
  await requireSesion();
  const supabase = supabaseServer();

  const productoNombre = String(formData.get("producto") || "").trim();
  const cantidad = Number(formData.get("cantidad") || 1);
  const costoUnitario = Number(formData.get("costo") || 0);
  const precioUnitario = Number(formData.get("precio") || 0);
  const clienteNombre = String(formData.get("cliente") || "").trim();
  const clienteTelefono = String(formData.get("telefono") || "").trim();

  if (!productoNombre || !precioUnitario) {
    return { error: "Producto y precio de venta son obligatorios." };
  }

  // Reusa el producto si ya existe (por nombre, normalizado) o lo crea.
  const nombreNormalizado = productoNombre.trim().toLowerCase();
  const { data: existentes } = await supabase
    .from("productos")
    .select("id, nombre")
    .ilike("nombre", nombreNormalizado);

  let productoId: string;
  if (existentes && existentes.length > 0) {
    productoId = existentes[0].id;
  } else {
    const { data: nuevoProducto, error: errorProducto } = await supabase
      .from("productos")
      .insert({ nombre: productoNombre, costo_referencia: costoUnitario })
      .select("id")
      .single();
    if (errorProducto || !nuevoProducto) {
      return { error: "No se pudo registrar el producto." };
    }
    productoId = nuevoProducto.id;
  }

  // Cliente opcional, cifrado si se captura.
  let clienteId: string | null = null;
  if (clienteNombre) {
    const { data: idCliente, error: errorCliente } = await supabase.rpc("crear_cliente", {
      p_nombre: clienteNombre,
      p_telefono: clienteTelefono || null,
      p_clave: CLAVE_CIFRADO,
    });
    if (errorCliente) {
      return { error: "No se pudo registrar el cliente: " + errorCliente.message };
    }
    clienteId = idCliente as string;
  }

  const { error: errorMovimiento } = await supabase.from("movimientos").insert({
    tipo: "venta",
    producto_id: productoId,
    cliente_id: clienteId,
    cantidad,
    costo_unitario: costoUnitario,
    precio_unitario: precioUnitario,
  });

  if (errorMovimiento) {
    return { error: "No se pudo registrar la venta: " + errorMovimiento.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/ventas");
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
