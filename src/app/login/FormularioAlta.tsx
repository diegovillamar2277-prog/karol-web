"use client";

import { useActionState } from "react";
import { crearUsuario } from "@/lib/actions/auth";

export default function FormularioAlta() {
  const [estado, accion, enviando] = useActionState(crearUsuario, null);

  return (
    <form action={accion}>
      <p className="texto-suave" style={{ marginBottom: "1rem" }}>
        Crea una cuenta con un nombre y un PIN que uses solo tú.
      </p>
      {estado?.error && <p className="mensaje-error">{estado.error}</p>}
      <div className="campo">
        <label htmlFor="nombre">Tu nombre</label>
        <input id="nombre" name="nombre" type="text" required autoFocus />
      </div>
      <div className="campo">
        <label htmlFor="pin">PIN (mínimo 4 dígitos)</label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          minLength={4}
          autoComplete="new-password"
          required
        />
      </div>
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Creando..." : "Crear cuenta"}
      </button>
    </form>
  );
}
