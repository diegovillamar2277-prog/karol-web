import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { listarEncargos, entregarEncargo, cancelarEncargo } from "@/lib/actions/encargos";
import Encabezado from "@/components/Encabezado";
import FormularioEncargo from "./FormularioEncargo";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default async function EncargosPage() {
  const sesion = await getSesion();
  if (!sesion.usuarioId) {
    redirect("/login");
  }

  const encargos = await listarEncargos();

  return (
    <>
      <Encabezado nombre={sesion.nombre} />
      <div className="contenedor">
        <h1 style={{ marginBottom: "1.25rem", fontSize: "1.4rem" }}>Encargos</h1>

        <FormularioEncargo />

        <div className="tarjeta" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Qué pidió</th>
                <th>Precio</th>
                <th>Anticipo</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {encargos.length === 0 && (
                <tr>
                  <td colSpan={7} className="vacio">
                    No hay encargos registrados.
                  </td>
                </tr>
              )}
              {encargos.map((e: any) => (
                <tr key={e.id}>
                  <td>{new Date(e.creado_en).toLocaleDateString("es-MX")}</td>
                  <td>{e.cliente_nombre || "—"}</td>
                  <td>{e.descripcion}</td>
                  <td>{formatoMoneda(e.precio_acordado)}</td>
                  <td>{e.anticipo > 0 ? formatoMoneda(e.anticipo) : "—"}</td>
                  <td>{ETIQUETA_ESTADO[e.estado] || e.estado}</td>
                  <td>
                    {e.estado === "pendiente" ? (
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <form action={entregarEncargo} style={{ display: "flex", gap: "0.35rem" }}>
                          <input type="hidden" name="encargo_id" value={e.id} />
                          <input
                            type="number"
                            name="costo"
                            step="0.01"
                            min="0"
                            placeholder="costo"
                            required
                            style={{
                              width: "80px",
                              padding: "0.4rem 0.5rem",
                              border: "1px solid var(--borde)",
                              borderRadius: "6px",
                              background: "var(--bg)",
                              color: "var(--texto)",
                              fontSize: "0.85rem",
                            }}
                          />
                          <button
                            type="submit"
                            className="boton"
                            style={{ width: "auto", padding: "0.4rem 0.7rem", fontSize: "0.85rem" }}
                          >
                            Entregar
                          </button>
                        </form>
                        <form action={cancelarEncargo}>
                          <input type="hidden" name="encargo_id" value={e.id} />
                          <button
                            type="submit"
                            className="boton-secundario"
                            style={{ width: "auto", padding: "0.4rem 0.7rem", fontSize: "0.85rem" }}
                          >
                            Cancelar
                          </button>
                        </form>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
