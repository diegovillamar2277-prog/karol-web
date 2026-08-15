"use client";

import { useActionState } from "react";
import { iniciarSesion } from "@/lib/actions/auth";

export default function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, null);

  return (
    <form action={accion}>
      {estado?.error && <p className="mensaje-error">{estado.error}</p>}
      <div className="campo">
        <label htmlFor="pin">PIN</label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          required
          autoFocus
        />
      </div>
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
