import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/core/db";
import { sendPasswordResetEmail } from "@/core/email/password-reset";

const bodySchema = z.object({
  email: z.string().email(),
});

function appBaseUrl() {
  const fromEnv = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email no válido" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true },
    });

    // Misma respuesta siempre (no filtrar si el email existe)
    const generic = {
      ok: true,
      message:
        "Si hay una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.",
    };

    if (!user?.password) {
      return NextResponse.json(generic);
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.$transaction([
      db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      db.passwordResetToken.create({
        data: { tokenHash, userId: user.id, expiresAt },
      }),
    ]);

    const resetUrl = `${appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (e) {
      console.error("[forgot-password] email:", e);
      if (process.env.NODE_ENV === "development") {
        console.info("[forgot-password] Enlace (sin Resend):", resetUrl);
      }
    }

    return NextResponse.json(generic);
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
