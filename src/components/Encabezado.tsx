import Link from "next/link";
import { cerrarSesion } from "@/lib/actions/auth";

export default function Encabezado({ nombre }: { nombre?: string }) {
  return (
    <header className="encabezado">
      <span className="marca">Mi negocio</span>
      <nav>
        <Link href="/dashboard">Resumen</Link>
        <Link href="/ventas">Ventas</Link>
        {nombre && <span className="texto-suave">{nombre}</span>}
        <form action={cerrarSesion}>
          <button type="submit" className="boton-secundario" style={{ width: "auto", padding: "0.4rem 0.8rem" }}>
            Salir
          </button>
        </form>
      </nav>
    </header>
  );
}
