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

export type EstadoEncargo = { error?: string; success?: boolean } | null;

// Un encargo es algo que un cliente pidió y ella NO tiene en su inventario
// normal — lo va a conseguir aparte. No toca el stock: es una promesa de
// entrega, no una venta de lo que ya tenía guardado.
export async function crearEncargo(_estado: EstadoEncargo, formData: FormData) {
  const sesion = await requireSesion();
  const supabase = supabaseServer();

  const descripcion = String(formData.get("descripcion") || "").trim();
  const precioAcordado = Number(formData.get("precio") || 0);
  const anticipo = Number(formData.get("anticipo") || 0);
  const clienteNombre = String(formData.get("cliente") || "").trim();
  const clienteTelefono = String(formData.get("telefono") || "").trim();

  if (!descripcion || !precioAcordado) {
    return { error: "Describe qué pidió y el precio que acordaron." };
  }
  if (!clienteNombre) {
    return { error: "El nombre del cliente es obligatorio en un encargo (para poder avisarle)." };
  }

  const { data: clienteId, error: errorCliente } = await supabase.rpc("crear_cliente", {
    p_nombre: clienteNombre,
    p_telefono: clienteTelefono || null,
    p_clave: CLAVE_CIFRADO,
    p_creado_por: sesion.usuarioId,
  });
  if (errorCliente) {
    return { error: "No se pudo registrar el cliente: " + errorCliente.message };
  }

  const { error: errorEncargo } = await supabase.from("encargos").insert({
    cliente_id: clienteId,
    descripcion,
    precio_acordado: precioAcordado,
    anticipo,
    creado_por: sesion.usuarioId,
  });

  if (errorEncargo) {
    return { error: "No se pudo registrar el encargo: " + errorEncargo.message };
  }

  revalidatePath("/encargos");
  return { success: true };
}

export async function listarEncargos() {
  await requireSesion();
  const supabase = supabaseServer();

  const { data, error } = await supabase.rpc("listar_encargos", { p_clave: CLAVE_CIFRADO });
  if (error || !data) return [];
  return data;
}

// Marcar un encargo como entregado: registra la venta correspondiente
// (es_encargo = true, así que NO descuenta stock) y liga el encargo a ese
// movimiento para que quede en el reporte de ganancia del mes.
export async function entregarEncargo(formData: FormData) {
  const sesion = await requireSesion();
  const supabase = supabaseServer();

  const encargoId = String(formData.get("encargo_id") || "");
  const costo = Number(formData.get("costo") || 0);

  if (!encargoId || costo < 0) {
    throw new Error("Falta el id del encargo o el costo no es válido.");
  }

  const { data: encargo, error: errorEncargo } = await supabase
    .from("encargos")
    .select("id, cliente_id, precio_acordado, estado")
    .eq("id", encargoId)
    .single();

  if (errorEncargo || !encargo) {
    throw new Error("No se encontró el encargo.");
  }
  if (encargo.estado !== "pendiente") {
    throw new Error("Este encargo ya no está pendiente.");
  }

  const { data: movimiento, error: errorMovimiento } = await supabase
    .from("movimientos")
    .insert({
      tipo: "venta",
      cliente_id: encargo.cliente_id,
      cantidad: 1,
      costo_unitario: costo,
      precio_unitario: encargo.precio_acordado,
      es_encargo: true,
      nota: "Entrega de encargo",
      creado_por: sesion.usuarioId,
    })
    .select("id")
    .single();

  if (errorMovimiento || !movimiento) {
    throw new Error("No se pudo registrar la venta del encargo.");
  }

  const { error: errorUpdate } = await supabase
    .from("encargos")
    .update({ estado: "entregado", movimiento_id: movimiento.id, entregado_en: new Date().toISOString() })
    .eq("id", encargoId);

  if (errorUpdate) {
    throw new Error("La venta se registró pero no se pudo actualizar el encargo.");
  }

  revalidatePath("/encargos");
  revalidatePath("/dashboard");
  revalidatePath("/ventas");
}

export async function cancelarEncargo(formData: FormData) {
  await requireSesion();
  const supabase = supabaseServer();
  const encargoId = String(formData.get("encargo_id") || "");
  if (!encargoId) return;

  await supabase.from("encargos").update({ estado: "cancelado" }).eq("id", encargoId);
  revalidatePath("/encargos");
}
