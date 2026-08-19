import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import FormularioLogin from "./FormularioLogin";
import FormularioAlta from "./FormularioAlta";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ nueva?: string }>;
}) {
  const sesion = await getSesion();
  if (sesion.usuarioId) {
    redirect("/dashboard");
  }

  const { nueva } = await searchParams;

  const supabase = supabaseServer();
  const { count } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true });

  const hayUsuario = Boolean(count && count > 0);
  const mostrarAlta = !hayUsuario || nueva === "1";

  return (
    <div className="pagina-centrada">
      <div className="tarjeta tarjeta-angosta">
        <h1 style={{ marginBottom: "1.25rem", fontSize: "1.3rem" }}>
          {mostrarAlta ? "Bienvenida" : "Iniciar sesión"}
        </h1>
        {mostrarAlta ? <FormularioAlta /> : <FormularioLogin />}

        <p className="texto-suave" style={{ marginTop: "1.25rem", textAlign: "center" }}>
          {mostrarAlta ? (
            hayUsuario && (
              <a href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>
                Ya tengo cuenta, iniciar sesión
              </a>
            )
          ) : (
            <a href="/login?nueva=1" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Crear otra cuenta
            </a>
          )}
        </p>
      </div>
    </div>
  );
}
