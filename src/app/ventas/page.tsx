import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { listarVentasRecientes } from "@/lib/actions/ventas";
import Encabezado from "@/components/Encabezado";
import FormularioVenta from "./FormularioVenta";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

type VentaFila = {
  id: string;
  cantidad: number;
  costo_unitario: number | null;
  precio_unitario: number | null;
  creado_en: string;
  productos: { nombre: string } | { nombre: string }[] | null;
};

export default async function VentasPage() {
  const sesion = await getSesion();
  if (!sesion.usuarioId) {
    redirect("/login");
  }

  const ventas = (await listarVentasRecientes()) as VentaFila[];

  return (
    <>
      <Encabezado nombre={sesion.nombre} />
      <div className="contenedor">
        <h1 style={{ marginBottom: "1.25rem", fontSize: "1.4rem" }}>Ventas</h1>

        <FormularioVenta />

        <div className="tarjeta" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Costo</th>
                <th>Precio</th>
                <th>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 && (
                <tr>
                  <td colSpan={6} className="vacio">
                    Todavía no has registrado ninguna venta.
                  </td>
                </tr>
              )}
              {ventas.map((venta) => {
                const producto = Array.isArray(venta.productos)
                  ? venta.productos[0]?.nombre
                  : venta.productos?.nombre;
                const costo = (venta.costo_unitario || 0) * venta.cantidad;
                const precio = (venta.precio_unitario || 0) * venta.cantidad;
                const gananciaLinea = precio - costo;

                return (
                  <tr key={venta.id}>
                    <td>{new Date(venta.creado_en).toLocaleDateString("es-MX")}</td>
                    <td>{producto || "—"}</td>
                    <td>{venta.cantidad}</td>
                    <td>{formatoMoneda(costo)}</td>
                    <td>{formatoMoneda(precio)}</td>
                    <td className="etiqueta-ganancia-positiva">{formatoMoneda(gananciaLinea)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
