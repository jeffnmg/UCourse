import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/core/db";

const bodySchema = z.object({
  token: z.string().min(20),
  password: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Token o contraseña no válidos. La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const row = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true } } },
    });

    if (!row || row.usedAt || row.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "El enlace no es válido o ha caducado. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: row.userId },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.deleteMany({
        where: { userId: row.userId },
      }),
    ]);

    return NextResponse.json({ ok: true, message: "Contraseña actualizada. Ya puedes iniciar sesión." });
  } catch (error) {
    console.error("[reset-password]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
