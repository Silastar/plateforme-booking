import 'server-only'
import nodemailer from 'nodemailer'

type Mail = { to: string; subject: string; text: string; html: string }

// Sans SMTP configuré, l'e-mail est écrit dans les journaux du conteneur (lien compris) :
// pratique en développement, à remplacer par un vrai serveur d'envoi avant la mise en ligne.
const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' }
        : undefined,
    })
  : null

export async function sendMail(mail: Mail) {
  if (!transport) {
    console.info(`[mail] À : ${mail.to}\n[mail] Objet : ${mail.subject}\n${mail.text}\n[mail] ---`)
    return
  }
  await transport.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, ...mail })
}
