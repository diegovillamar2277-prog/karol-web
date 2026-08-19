import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { listarInventario } from "@/lib/actions/productos";
import Encabezado from "@/components/Encabezado";
import PestanasEntrada from "./PestanasEntrada";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function ProductosPage() {
  const sesion = await getSesion();
  if (!sesion.usuarioId) {
    redirect("/login");
  }

  const inventario = await listarInventario();

  return (
    <>
      <Encabezado nombre={sesion.nombre} />
      <div className="contenedor">
        <h1 style={{ marginBottom: "1.25rem", fontSize: "1.4rem" }}>Inventario</h1>

        <PestanasEntrada productos={inventario} />

        <div className="tarjeta" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock actual</th>
                <th>Costo de referencia</th>
                <th>Precio sugerido</th>
              </tr>
            </thead>
            <tbody>
              {inventario.length === 0 && (
                <tr>
                  <td colSpan={4} className="vacio">
                    Todavía no has registrado ningún producto. Usa el formulario de arriba
                    cuando te llegue mercancía.
                  </td>
                </tr>
              )}
              {inventario.map((producto) => (
                <tr key={producto.id}>
                  <td>{producto.nombre}</td>
                  <td
                    style={
                      producto.cantidad_disponible <= 0
                        ? { color: "var(--peligro)", fontWeight: 600 }
                        : undefined
                    }
                  >
                    {producto.cantidad_disponible}
                  </td>
                  <td>{formatoMoneda(producto.costo_referencia || 0)}</td>
                  <td>{producto.precio_sugerido != null ? formatoMoneda(producto.precio_sugerido) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
