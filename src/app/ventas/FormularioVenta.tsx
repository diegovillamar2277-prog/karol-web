"use client";

import { useActionState, useRef, useEffect } from "react";
import { registrarVenta } from "@/lib/actions/ventas";

export default function FormularioVenta() {
  const [estado, accion, enviando] = useActionState(registrarVenta, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.success) {
      formRef.current?.reset();
    }
  }, [estado]);

  return (
    <form action={accion} ref={formRef} className="tarjeta" style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Registrar venta</h2>

      {estado?.error && <p className="mensaje-error">{estado.error}</p>}
      {estado?.success && (
        <p className="mensaje-error" style={{ background: "var(--exito-bg)", color: "var(--accent)" }}>
          Venta registrada.
        </p>
      )}

      <div className="campo">
        <label htmlFor="producto">Producto</label>
        <input id="producto" name="producto" type="text" required autoFocus />
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="cantidad">Cantidad</label>
          <input id="cantidad" name="cantidad" type="number" step="0.01" defaultValue={1} required />
        </div>
        <div className="campo">
          <label htmlFor="costo">Costo (lo que te costó)</label>
          <input id="costo" name="costo" type="number" step="0.01" min="0" required />
        </div>
      </div>

      <div className="campo">
        <label htmlFor="precio">Precio de venta (lo que cobraste)</label>
        <input id="precio" name="precio" type="number" step="0.01" min="0" required />
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="cliente">Cliente (opcional)</label>
          <input id="cliente" name="cliente" type="text" />
        </div>
        <div className="campo">
          <label htmlFor="telefono">Teléfono (opcional)</label>
          <input id="telefono" name="telefono" type="text" />
        </div>
      </div>

      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Guardando..." : "Guardar venta"}
      </button>
    </form>
  );
}
