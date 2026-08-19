"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { registrarEntradaSet } from "@/lib/actions/productos";

type Producto = {
  id: string;
  nombre: string;
  costo_referencia: number | null;
  precio_sugerido: number | null;
};

type Fila = {
  nombre: string;
  cantidad: string;
  costoUnitario: string;
  precioSugerido: string;
  costoEditadoManualmente: boolean;
};

function filaVacia(): Fila {
  return { nombre: "", cantidad: "1", costoUnitario: "", precioSugerido: "", costoEditadoManualmente: false };
}

export default function FormularioSet({ productos }: { productos: Producto[] }) {
  const [estado, accion, enviando] = useActionState(registrarEntradaSet, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [costoTotal, setCostoTotal] = useState("");
  const [filas, setFilas] = useState<Fila[]>([filaVacia(), filaVacia()]);

  useEffect(() => {
    if (estado?.success) {
      formRef.current?.reset();
      setCostoTotal("");
      setFilas([filaVacia(), filaVacia()]);
    }
  }, [estado]);

  // Reparte el costo total en partes iguales entre las filas que el
  // usuario NO haya ajustado a mano. Se recalcula cada vez que cambia el
  // total, la cantidad de filas, o las cantidades por fila.
  function repartirCosto(filasActuales: Fila[], total: string) {
    const totalNum = Number(total) || 0;
    const totalUnidadesSinEditar = filasActuales.reduce(
      (suma, f) => (f.costoEditadoManualmente ? suma : suma + (Number(f.cantidad) || 0)),
      0
    );
    const costoYaAsignado = filasActuales.reduce(
      (suma, f) => (f.costoEditadoManualmente ? suma + (Number(f.costoUnitario) || 0) * (Number(f.cantidad) || 0) : suma),
      0
    );
    const restante = Math.max(totalNum - costoYaAsignado, 0);
    const costoPorUnidad = totalUnidadesSinEditar > 0 ? restante / totalUnidadesSinEditar : 0;

    return filasActuales.map((f) =>
      f.costoEditadoManualmente ? f : { ...f, costoUnitario: costoPorUnidad ? costoPorUnidad.toFixed(2) : "" }
    );
  }

  function alCambiarTotal(valor: string) {
    setCostoTotal(valor);
    setFilas((prev) => repartirCosto(prev, valor));
  }

  function actualizarFila(indice: number, cambios: Partial<Fila>) {
    setFilas((prev) => {
      const nuevas = prev.map((f, i) => (i === indice ? { ...f, ...cambios } : f));
      return repartirCosto(nuevas, costoTotal);
    });
  }

  function alCambiarNombreFila(indice: number, valor: string) {
    const coincidencia = productos.find(
      (p) => p.nombre.trim().toLowerCase() === valor.trim().toLowerCase()
    );
    actualizarFila(indice, {
      nombre: valor,
      precioSugerido: coincidencia?.precio_sugerido != null ? String(coincidencia.precio_sugerido) : "",
    });
  }

  function alEditarCostoManual(indice: number, valor: string) {
    setFilas((prev) => {
      const nuevas = prev.map((f, i) =>
        i === indice ? { ...f, costoUnitario: valor, costoEditadoManualmente: valor !== "" } : f
      );
      return repartirCosto(nuevas, costoTotal);
    });
  }

  function agregarFila() {
    setFilas((prev) => repartirCosto([...prev, filaVacia()], costoTotal));
  }

  function quitarFila(indice: number) {
    setFilas((prev) => repartirCosto(prev.filter((_, i) => i !== indice), costoTotal));
  }

  const itemsJson = JSON.stringify(
    filas
      .filter((f) => f.nombre.trim())
      .map((f) => ({
        nombre: f.nombre.trim(),
        cantidad: Number(f.cantidad) || 0,
        costoUnitario: Number(f.costoUnitario) || 0,
        precioSugerido: f.precioSugerido ? Number(f.precioSugerido) : null,
      }))
  );

  const sumaAsignada = filas.reduce(
    (s, f) => s + (Number(f.costoUnitario) || 0) * (Number(f.cantidad) || 0),
    0
  );

  return (
    <form action={accion} ref={formRef} className="tarjeta" style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ marginBottom: "0.35rem", fontSize: "1.1rem" }}>Registrar un SET</h2>
      <p className="texto-suave" style={{ marginBottom: "1rem" }}>
        Para cuando compras varias variantes juntas por un solo precio (ej. un set de 4
        labiales de colores distintos). El costo se reparte en partes iguales — puedes
        ajustarlo a mano por producto si sabes que unos costaron más que otros.
      </p>

      {estado?.error && <p className="mensaje-error">{estado.error}</p>}
      {estado?.success && (
        <p className="mensaje-error" style={{ background: "var(--exito-bg)", color: "var(--accent)" }}>
          Set registrado — cada variante quedó en tu inventario.
        </p>
      )}

      <input type="hidden" name="items" value={itemsJson} />

      <div className="campo">
        <label htmlFor="costo_total">Costo total del set</label>
        <input
          id="costo_total"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={costoTotal}
          onChange={(e) => alCambiarTotal(e.target.value)}
        />
      </div>

      <p className="texto-suave" style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
        Productos dentro del set
      </p>

      {filas.map((fila, indice) => (
        <div
          key={indice}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 0.7fr 0.9fr 0.9fr auto",
            gap: "0.5rem",
            marginBottom: "0.5rem",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Nombre (ej. Labial rojo)"
            list="catalogo-productos-set"
            value={fila.nombre}
            onChange={(e) => alCambiarNombreFila(indice, e.target.value)}
            style={{
              padding: "0.55rem 0.6rem",
              border: "1px solid var(--borde)",
              borderRadius: "8px",
              background: "var(--bg)",
              color: "var(--texto)",
              fontSize: "0.9rem",
            }}
          />
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Cant."
            value={fila.cantidad}
            onChange={(e) => actualizarFila(indice, { cantidad: e.target.value })}
            style={{
              padding: "0.55rem 0.6rem",
              border: "1px solid var(--borde)",
              borderRadius: "8px",
              background: "var(--bg)",
              color: "var(--texto)",
              fontSize: "0.9rem",
            }}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Costo c/u"
            value={fila.costoUnitario}
            onChange={(e) => alEditarCostoManual(indice, e.target.value)}
            title="Se reparte automático, pero puedes escribir un valor a mano"
            style={{
              padding: "0.55rem 0.6rem",
              border: fila.costoEditadoManualmente ? "1px solid var(--accent)" : "1px solid var(--borde)",
              borderRadius: "8px",
              background: "var(--bg)",
              color: "var(--texto)",
              fontSize: "0.9rem",
            }}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio sug."
            value={fila.precioSugerido}
            onChange={(e) => actualizarFila(indice, { precioSugerido: e.target.value })}
            style={{
              padding: "0.55rem 0.6rem",
              border: "1px solid var(--borde)",
              borderRadius: "8px",
              background: "var(--bg)",
              color: "var(--texto)",
              fontSize: "0.9rem",
            }}
          />
          <button
            type="button"
            onClick={() => quitarFila(indice)}
            className="boton-secundario"
            style={{ width: "auto", padding: "0.5rem 0.6rem", fontSize: "0.8rem" }}
            disabled={filas.length <= 1}
          >
            ✕
          </button>
        </div>
      ))}

      <datalist id="catalogo-productos-set">
        {productos.map((p) => (
          <option key={p.id} value={p.nombre} />
        ))}
      </datalist>

      <button
        type="button"
        onClick={agregarFila}
        className="boton-secundario"
        style={{ width: "auto", padding: "0.4rem 0.8rem", fontSize: "0.85rem", marginBottom: "1rem" }}
      >
        + Agregar producto al set
      </button>

      {Number(costoTotal) > 0 && (
        <p className="texto-suave" style={{ marginBottom: "1rem" }}>
          Repartido hasta ahora: ${sumaAsignada.toFixed(2)} de ${Number(costoTotal).toFixed(2)}
          {Math.abs(sumaAsignada - Number(costoTotal)) > 0.01 && (
            <span style={{ color: "var(--peligro)" }}> — no cuadra con el total, revisa las cantidades</span>
          )}
        </p>
      )}

      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Guardando..." : "Registrar set completo"}
      </button>
    </form>
  );
}
