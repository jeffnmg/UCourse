import { Resend } from "resend";
import { FROM_EMAIL } from "./index";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: "Restablecer contraseña — UCourse",
    html: `
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en UCourse.</p>
      <p><a href="${resetUrl}" style="color:#9333ea;font-weight:600;">Elegir nueva contraseña</a></p>
      <p>Este enlace caduca en una hora. Si no fuiste tú, ignora este mensaje.</p>
      <p style="color:#64748b;font-size:12px;">UCourse · Virtual University</p>
    `,
  });
}
