import bcrypt from "bcryptjs";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SesionData = {
  usuarioId?: string;
  nombre?: string;
};

// iron-session cifra y firma la cookie de sesión completa; el navegador
// nunca ve el PIN ni el id en texto plano fuera de esa cookie cifrada.
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string, // >= 32 caracteres, en .env.local
  cookieName: "karol_sesion",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSesion() {
  const cookieStore = await cookies();
  return getIronSession<SesionData>(cookieStore, sessionOptions);
}

// El PIN nunca se guarda ni se compara en texto plano: se hashea con
// bcrypt (10 rondas de salt) al crear el usuario, y se compara con
// bcrypt.compare al iniciar sesión.
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verificarPin(
  pin: string,
  pinHash: string
): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}
