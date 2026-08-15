import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { obtenerGananciaDelMes } from "@/lib/actions/ventas";
import Encabezado from "@/components/Encabezado";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function DashboardPage() {
  const sesion = await getSesion();
  if (!sesion.usuarioId) {
    redirect("/login");
  }

  const { totalVentas, totalCosto, ganancia } = await obtenerGananciaDelMes();
  const nombreMes = new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  return (
    <>
      <Encabezado nombre={sesion.nombre} />
      <div className="contenedor">
        <h1 style={{ marginBottom: "0.25rem", fontSize: "1.4rem" }}>Resumen del mes</h1>
        <p className="texto-suave" style={{ marginBottom: "1.5rem", textTransform: "capitalize" }}>
          {nombreMes}
        </p>

        <div className="grid-metricas">
          <div className="metrica">
            <div className="etiqueta">Total vendido</div>
            <div className="valor">{formatoMoneda(totalVentas)}</div>
          </div>
          <div className="metrica">
            <div className="etiqueta">Costo de lo vendido</div>
            <div className="valor">{formatoMoneda(totalCosto)}</div>
          </div>
          <div className="metrica ganancia">
            <div className="etiqueta">Ganancia neta</div>
            <div className="valor">{formatoMoneda(ganancia)}</div>
          </div>
        </div>

        <div className="tarjeta">
          <p className="texto-suave">
            Esta cifra se calcula con cada venta registrada este mes: lo que cobraste menos
            lo que te costó el producto. Ve a{" "}
            <a href="/ventas" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Ventas
            </a>{" "}
            para registrar una nueva.
          </p>
        </div>
      </div>
    </>
  );
}
