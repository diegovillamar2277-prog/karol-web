"use client";

import { useActionState, useRef, useEffect, useMemo, useState } from "react";
import { registrarVenta } from "@/lib/actions/ventas";

type Producto = {
  id: string;
  nombre: string;
  costo_referencia: number | null;
  cantidad_disponible: number;
};

export default function FormularioVenta({ productos }: { productos: Producto[] }) {
  const [estado, accion, enviando] = useActionState(registrarVenta, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [productoId, setProductoId] = useState("");

  useEffect(() => {
    if (estado?.success) {
      formRef.current?.reset();
      setProductoId("");
    }
  }, [estado]);

  const productoSeleccionado = useMemo(
    () => productos.find((p) => p.id === productoId),
    [productos, productoId]
  );

  const disponibles = productos.filter((p) => p.cantidad_disponible > 0);

  return (
    <form action={accion} ref={formRef} className="tarjeta" style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Registrar venta</h2>

      {estado?.error && <p className="mensaje-error">{estado.error}</p>}
      {estado?.success && (
        <p className="mensaje-error" style={{ background: "var(--exito-bg)", color: "var(--accent)" }}>
          Venta registrada.
        </p>
      )}

      {disponibles.length === 0 ? (
        <p className="texto-suave">
          No tienes productos en stock todavía. Ve a{" "}
          <a href="/productos" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Inventario
          </a>{" "}
          para registrar lo que te llegó.
        </p>
      ) : (
        <>
          <div className="campo">
            <label htmlFor="producto_id">Producto</label>
            <select
              id="producto_id"
              name="producto_id"
              required
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              style={{
                padding: "0.65rem 0.75rem",
                border: "1px solid var(--borde)",
                borderRadius: "8px",
                fontSize: "1rem",
                background: "var(--bg)",
                color: "var(--texto)",
              }}
            >
              <option value="">Elige un producto...</option>
              {disponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — quedan {p.cantidad_disponible}
                </option>
              ))}
            </select>
          </div>

          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="cantidad">Cantidad vendida</label>
              <input
                id="cantidad"
                name="cantidad"
                type="number"
                step="0.01"
                min="0.01"
                max={productoSeleccionado?.cantidad_disponible || undefined}
                defaultValue={1}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="precio">Precio de venta (lo que cobraste)</label>
              <input id="precio" name="precio" type="number" step="0.01" min="0" required />
            </div>
          </div>

          {productoSeleccionado && (
            <p className="texto-suave" style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}>
              Costo registrado de este producto: $
              {(productoSeleccionado.costo_referencia || 0).toFixed(2)} c/u (se aplica solo, no
              hace falta capturarlo).
            </p>
          )}

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
        </>
      )}
    </form>
  );
}
