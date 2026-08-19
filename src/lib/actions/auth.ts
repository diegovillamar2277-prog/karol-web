"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { getSesion, hashPin, verificarPin } from "@/lib/auth";

// Ya no está limitado a un solo usuario: puede haber más de una cuenta (la
// dueña real y, aparte, una cuenta de prueba). No hay PIN "por usuario" en
// el formulario de login porque solo se captura el PIN — se compara contra
// todas las cuentas hasta encontrar cuál coincide (con solo 2-3 cuentas
// esto es instantáneo).
export type EstadoFormulario = { error?: string } | null;

export async function crearUsuario(_estado: EstadoFormulario, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const pin = String(formData.get("pin") || "").trim();

  if (!nombre || pin.length < 4) {
    return { error: "Nombre y PIN (mínimo 4 dígitos) son obligatorios." };
  }

  const supabase = supabaseServer();
  const pinHash = await hashPin(pin);
  const { error } = await supabase.from("usuarios").insert({ nombre, pin_hash: pinHash });

  if (error) {
    return { error: "No se pudo crear la cuenta: " + error.message };
  }

  redirect("/login");
}

export async function iniciarSesion(_estado: EstadoFormulario, formData: FormData) {
  const pin = String(formData.get("pin") || "").trim();
  const supabase = supabaseServer();

  const { data: usuarios, error } = await supabase.from("usuarios").select("*");

  if (error || !usuarios || usuarios.length === 0) {
    return { error: "No hay ninguna cuenta creada todavía." };
  }

  let usuarioEncontrado: { id: string; nombre: string } | null = null;
  for (const usuario of usuarios) {
    if (await verificarPin(pin, usuario.pin_hash)) {
      usuarioEncontrado = usuario;
      break;
    }
  }

  if (!usuarioEncontrado) {
    return { error: "PIN incorrecto." };
  }

  const sesion = await getSesion();
  sesion.usuarioId = usuarioEncontrado.id;
  sesion.nombre = usuarioEncontrado.nombre;
  await sesion.save();

  redirect("/dashboard");
}

export async function cerrarSesion() {
  const sesion = await getSesion();
  sesion.destroy();
  redirect("/login");
}
