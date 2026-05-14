/** Origen por defecto; en producción define RESEND_FROM_EMAIL con un dominio verificado en Resend. */
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "no-reply@virtualuniversity.app";
