"use client";

import { useActionState, useRef, useEffect } from "react";
import { registrarEntradaStock } from "@/lib/actions/productos";

export default function FormularioEntrada() {
  const [estado, accion, enviando] = useActionState(registrarEntradaStock, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.success) {
      formRef.current?.reset();
    }
  }, [estado]);

  return (
    <form action={accion} ref={formRef} className="tarjeta" style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ marginBottom: "0.35rem", fontSize: "1.1rem" }}>Registrar mercancía que llegó</h2>
      <p className="texto-suave" style={{ marginBottom: "1rem" }}>
        Si el producto ya existe se le suma al stock que ya tenías. Si es nuevo, se da de alta.
      </p>

      {estado?.error && <p className="mensaje-error">{estado.error}</p>}
      {estado?.success && (
        <p className="mensaje-error" style={{ background: "var(--exito-bg)", color: "var(--accent)" }}>
          Stock actualizado.
        </p>
      )}

      <div className="campo">
        <label htmlFor="nombre">Producto</label>
        <input id="nombre" name="nombre" type="text" required autoFocus />
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="cantidad">Cantidad que llegó</label>
          <input id="cantidad" name="cantidad" type="number" step="0.01" min="0.01" required />
        </div>
        <div className="campo">
          <label htmlFor="costo">Costo unitario (lo que pagaste)</label>
          <input id="costo" name="costo" type="number" step="0.01" min="0.01" required />
        </div>
      </div>

      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Guardando..." : "Agregar a inventario"}
      </button>
    </form>
  );
}
