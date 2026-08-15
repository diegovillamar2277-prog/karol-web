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

export type EstadoEntrada = { error?: string; success?: boolean } | null;

// Registrar mercancía que le acaba de llegar: si el producto ya existe (por
// nombre) le suma al stock que ya tenía; si es nuevo, lo da de alta. El
// costo que se captura aquí queda como el costo de referencia del producto
// — es el que se usa después al registrar una venta, sin volver a pedirlo.
export async function registrarEntradaStock(_estado: EstadoEntrada, formData: FormData) {
  await requireSesion();
  const supabase = supabaseServer();

  const nombre = String(formData.get("nombre") || "").trim();
  const cantidad = Number(formData.get("cantidad") || 0);
  const costoUnitario = Number(formData.get("costo") || 0);

  if (!nombre || !cantidad || costoUnitario <= 0) {
    return { error: "Nombre, cantidad y costo son obligatorios." };
  }

  const { data: existentes } = await supabase
    .from("productos")
    .select("id")
    .ilike("nombre", nombre.trim());

  let productoId: string;
  if (existentes && existentes.length > 0) {
    productoId = existentes[0].id;
    // Actualiza el costo de referencia al más reciente (lo que acaba de pagar).
    await supabase.from("productos").update({ costo_referencia: costoUnitario }).eq("id", productoId);
  } else {
    const { data: nuevo, error: errorNuevo } = await supabase
      .from("productos")
      .insert({ nombre, costo_referencia: costoUnitario })
      .select("id")
      .single();
    if (errorNuevo || !nuevo) {
      return { error: "No se pudo dar de alta el producto." };
    }
    productoId = nuevo.id;
  }

  // El trigger ajustar_stock suma esta cantidad al stock del producto.
  const { error: errorMovimiento } = await supabase.from("movimientos").insert({
    tipo: "compra",
    producto_id: productoId,
    cantidad,
    costo_unitario: costoUnitario,
  });

  if (errorMovimiento) {
    return { error: "No se pudo registrar la entrada: " + errorMovimiento.message };
  }

  revalidatePath("/productos");
  revalidatePath("/ventas");
  return { success: true };
}

export async function listarInventario() {
  await requireSesion();
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, costo_referencia, cantidad_disponible")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error || !data) return [];
  return data;
}
