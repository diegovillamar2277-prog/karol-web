"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { registrarEntradaStock } from "@/lib/actions/productos";

type Producto = {
  id: string;
  nombre: string;
  costo_referencia: number | null;
  precio_sugerido: number | null;
};

export default function FormularioEntrada({ productos }: { productos: Producto[] }) {
  const [estado, accion, enviando] = useActionState(registrarEntradaStock, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [nombre, setNombre] = useState("");
  const [costo, setCosto] = useState("");
  const [precioSugerido, setPrecioSugerido] = useState("");

  useEffect(() => {
    if (estado?.success) {
      formRef.current?.reset();
      setNombre("");
      setCosto("");
      setPrecioSugerido("");
    }
  }, [estado]);

  // Si el nombre escrito coincide con un producto que ya diste de alta
  // antes, autocompleta costo y precio sugerido con lo último que
  // registraste — no hay que volver a escribirlos.
  function alCambiarNombre(valor: string) {
    setNombre(valor);
    const coincidencia = productos.find(
      (p) => p.nombre.trim().toLowerCase() === valor.trim().toLowerCase()
    );
    if (coincidencia) {
      if (coincidencia.costo_referencia != null) setCosto(String(coincidencia.costo_referencia));
      if (coincidencia.precio_sugerido != null) setPrecioSugerido(String(coincidencia.precio_sugerido));
    }
  }

  return (
    <form action={accion} ref={formRef} className="tarjeta" style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ marginBottom: "0.35rem", fontSize: "1.1rem" }}>Registrar mercancía que llegó</h2>
      <p className="texto-suave" style={{ marginBottom: "1rem" }}>
        Si el nombre coincide con un producto que ya tenías, se autocompleta el costo y el
        precio sugerido.
      </p>

      {estado?.error && <p className="mensaje-error">{estado.error}</p>}
      {estado?.success && (
        <p className="mensaje-error" style={{ background: "var(--exito-bg)", color: "var(--accent)" }}>
          Stock actualizado.
        </p>
      )}

      <div className="campo">
        <label htmlFor="nombre">Producto</label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          autoFocus
          list="catalogo-productos"
          value={nombre}
          onChange={(e) => alCambiarNombre(e.target.value)}
          autoComplete="off"
        />
        <datalist id="catalogo-productos">
          {productos.map((p) => (
            <option key={p.id} value={p.nombre} />
          ))}
        </datalist>
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="cantidad">Cantidad que llegó</label>
          <input id="cantidad" name="cantidad" type="number" step="0.01" min="0.01" required />
        </div>
        <div className="campo">
          <label htmlFor="costo">Costo unitario (lo que pagaste)</label>
          <input
            id="costo"
            name="costo"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
          />
        </div>
      </div>

      <div className="campo">
        <label htmlFor="precio_sugerido">Precio sugerido de venta (opcional)</label>
        <input
          id="precio_sugerido"
          name="precio_sugerido"
          type="number"
          step="0.01"
          min="0"
          value={precioSugerido}
          onChange={(e) => setPrecioSugerido(e.target.value)}
        />
      </div>

      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Guardando..." : "Agregar a inventario"}
      </button>
    </form>
  );
}
