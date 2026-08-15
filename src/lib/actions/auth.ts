"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { getSesion, hashPin, verificarPin } from "@/lib/auth";

// Alta inicial: solo funciona si todavía no existe ningún usuario.
// Es la única forma de crear la cuenta — no hay registro abierto porque
// esta app es de un solo usuario (la dueña del negocio).
export type EstadoFormulario = { error?: string } | null;

export async function crearUsuarioInicial(_estado: EstadoFormulario, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const pin = String(formData.get("pin") || "").trim();

  if (!nombre || pin.length < 4) {
    return { error: "Nombre y PIN (mínimo 4 dígitos) son obligatorios." };
  }

  const supabase = supabaseServer();
  const { count } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    return { error: "Ya existe una cuenta. Usa la pantalla de inicio de sesión." };
  }

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

  const { data: usuarios, error } = await supabase.from("usuarios").select("*").limit(1);

  if (error || !usuarios || usuarios.length === 0) {
    return { error: "No hay ninguna cuenta creada todavía." };
  }

  const usuario = usuarios[0];
  const valido = await verificarPin(pin, usuario.pin_hash);

  if (!valido) {
    return { error: "PIN incorrecto." };
  }

  const sesion = await getSesion();
  sesion.usuarioId = usuario.id;
  sesion.nombre = usuario.nombre;
  await sesion.save();

  redirect("/dashboard");
}

export async function cerrarSesion() {
  const sesion = await getSesion();
  sesion.destroy();
  redirect("/login");
}
