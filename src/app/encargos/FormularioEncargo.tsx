"use client";

import { useActionState, useRef, useEffect } from "react";
import { crearEncargo } from "@/lib/actions/encargos";

export default function FormularioEncargo() {
  const [estado, accion, enviando] = useActionState(crearEncargo, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.success) {
      formRef.current?.reset();
    }
  }, [estado]);

  return (
    <form action={accion} ref={formRef} className="tarjeta" style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ marginBottom: "0.35rem", fontSize: "1.1rem" }}>Nuevo encargo</h2>
      <p className="texto-suave" style={{ marginBottom: "1rem" }}>
        Para cuando alguien pide algo que no tienes en stock — lo consigues aparte y luego lo entregas.
      </p>

      {estado?.error && <p className="mensaje-error">{estado.error}</p>}
      {estado?.success && (
        <p className="mensaje-error" style={{ background: "var(--exito-bg)", color: "var(--accent)" }}>
          Encargo registrado.
        </p>
      )}

      <div className="campo">
        <label htmlFor="descripcion">¿Qué pidió?</label>
        <input id="descripcion" name="descripcion" type="text" required autoFocus />
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="cliente">Cliente</label>
          <input id="cliente" name="cliente" type="text" required />
        </div>
        <div className="campo">
          <label htmlFor="telefono">Teléfono</label>
          <input id="telefono" name="telefono" type="text" />
        </div>
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="precio">Precio acordado</label>
          <input id="precio" name="precio" type="number" step="0.01" min="0.01" required />
        </div>
        <div className="campo">
          <label htmlFor="anticipo">Anticipo (opcional)</label>
          <input id="anticipo" name="anticipo" type="number" step="0.01" min="0" defaultValue={0} />
        </div>
      </div>

      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Guardando..." : "Registrar encargo"}
      </button>
    </form>
  );
}
