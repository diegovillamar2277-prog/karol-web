import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control del negocio",
  description: "Registro de ventas y ganancia del negocio",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
