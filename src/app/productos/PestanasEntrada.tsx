"use client";

import { useState } from "react";
import FormularioEntrada from "./FormularioEntrada";
import FormularioSet from "./FormularioSet";

type Producto = {
  id: string;
  nombre: string;
  costo_referencia: number | null;
  precio_sugerido: number | null;
};

export default function PestanasEntrada({ productos }: { productos: Producto[] }) {
  const [pestana, setPestana] = useState<"individual" | "set">("individual");

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => setPestana("individual")}
          className={pestana === "individual" ? "boton" : "boton-secundario"}
          style={{ width: "auto", padding: "0.5rem 1rem" }}
        >
          Producto individual
        </button>
        <button
          type="button"
          onClick={() => setPestana("set")}
          className={pestana === "set" ? "boton" : "boton-secundario"}
          style={{ width: "auto", padding: "0.5rem 1rem" }}
        >
          SET (varios productos)
        </button>
      </div>

      {pestana === "individual" ? (
        <FormularioEntrada productos={productos} />
      ) : (
        <FormularioSet productos={productos} />
      )}
    </div>
  );
}
