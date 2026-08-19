"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import { getSesion } from "@/lib/auth";

async function requireSesion() {
  const sesion = await getSesion();
  if (!sesion.usuarioId) {
    throw new Error("No hay sesión activa.");
  }
  return sesion;
}

// Busca un producto existente por nombre (normalizado) o lo crea. Si ya
// existía, actualiza su costo de referencia y — solo si se manda uno nuevo —
// su precio sugerido, para que la próxima vez que llegue este producto se
// autocompleten ambos.
async function reusarOCrearProducto(
  supabase: ReturnType<typeof supabaseServer>,
  nombre: string,
  costoUnitario: number,
  precioSugerido: number | null,
  usuarioId: string
): Promise<{ id: string } | { error: string }> {
  const { data: existentes } = await supabase
    .from("productos")
    .select("id")
    .ilike("nombre", nombre.trim());

  if (existentes && existentes.length > 0) {
    const productoId = existentes[0].id;
    const actualizacion: Record<string, number> = { costo_referencia: costoUnitario };
    if (precioSugerido != null) actualizacion.precio_sugerido = precioSugerido;
    await supabase.from("productos").update(actualizacion).eq("id", productoId);
    return { id: productoId };
  }

  const { data: nuevo, error } = await supabase
    .from("productos")
    .insert({
      nombre,
      costo_referencia: costoUnitario,
      precio_sugerido: precioSugerido,
      creado_por: usuarioId,
    })
    .select("id")
    .single();

  if (error || !nuevo) {
    return { error: "No se pudo dar de alta el producto: " + nombre };
  }
  return { id: nuevo.id };
}

export type EstadoEntrada = { error?: string; success?: boolean } | null;

// Registrar mercancía que le acaba de llegar (un solo producto).
export async function registrarEntradaStock(_estado: EstadoEntrada, formData: FormData) {
  const sesion = await requireSesion();
  const supabase = supabaseServer();

  const nombre = String(formData.get("nombre") || "").trim();
  const cantidad = Number(formData.get("cantidad") || 0);
  const costoUnitario = Number(formData.get("costo") || 0);
  const precioSugeridoRaw = String(formData.get("precio_sugerido") || "").trim();
  const precioSugerido = precioSugeridoRaw ? Number(precioSugeridoRaw) : null;

  if (!nombre || !cantidad || costoUnitario <= 0) {
    return { error: "Nombre, cantidad y costo son obligatorios." };
  }

  const resultado = await reusarOCrearProducto(
    supabase,
    nombre,
    costoUnitario,
    precioSugerido,
    sesion.usuarioId as string
  );
  if ("error" in resultado) return { error: resultado.error };

  // El trigger ajustar_stock suma esta cantidad al stock del producto.
  const { error: errorMovimiento } = await supabase.from("movimientos").insert({
    tipo: "compra",
    producto_id: resultado.id,
    cantidad,
    costo_unitario: costoUnitario,
    creado_por: sesion.usuarioId,
  });

  if (errorMovimiento) {
    return { error: "No se pudo registrar la entrada: " + errorMovimiento.message };
  }

  revalidatePath("/productos");
  revalidatePath("/ventas");
  return { success: true };
}

export type ItemSet = {
  nombre: string;
  cantidad: number;
  costoUnitario: number;
  precioSugerido: number | null;
};

export type EstadoSet = { error?: string; success?: boolean } | null;

// Registrar un SET: se pagó un costo total por varias variantes distintas
// (ej. 4 colores de labial). El costo ya viene repartido por línea (por
// default en partes iguales, pero se pudo ajustar a mano en el formulario).
// Cada variante se registra como su propio producto/movimiento de compra.
export async function registrarEntradaSet(_estado: EstadoSet, formData: FormData) {
  const sesion = await requireSesion();
  const supabase = supabaseServer();

  const itemsRaw = String(formData.get("items") || "[]");
  let items: ItemSet[] = [];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { error: "No se pudieron leer los productos del set." };
  }

  const validos = items.filter((i) => i.nombre?.trim() && i.cantidad > 0 && i.costoUnitario >= 0);
  if (validos.length === 0) {
    return { error: "Agrega al menos un producto del set." };
  }

  for (const item of validos) {
    const resultado = await reusarOCrearProducto(
      supabase,
      item.nombre.trim(),
      item.costoUnitario,
      item.precioSugerido,
      sesion.usuarioId as string
    );
    if ("error" in resultado) return { error: resultado.error };

    const { error: errorMovimiento } = await supabase.from("movimientos").insert({
      tipo: "compra",
      producto_id: resultado.id,
      cantidad: item.cantidad,
      costo_unitario: item.costoUnitario,
      nota: "Parte de un SET",
      creado_por: sesion.usuarioId,
    });

    if (errorMovimiento) {
      return { error: `Se registraron algunos productos, pero falló "${item.nombre}": ${errorMovimiento.message}` };
    }
  }

  revalidatePath("/productos");
  revalidatePath("/ventas");
  return { success: true };
}

// Catálogo completo (incluye productos en 0 stock) — se usa tanto para la
// tabla de inventario como para el autocompletar al registrar entradas,
// así nunca hay que retipear un producto que ya diste de alta antes.
export async function listarInventario() {
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
