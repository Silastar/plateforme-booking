type Locale = 'fr' | 'en'
type Kind = 'verify' | 'reset' | 'exists'

const COPY: Record<Locale, Record<Kind, { subject: string; intro: string; cta: string }>> & {
  [L in Locale]: { hello: string; ignore: string; site: string }
} = {
  fr: {
    hello: 'Salut',
    ignore: "Si tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail.",
    site: '[NOM DU SITE]',
    verify: {
      subject: 'Confirme ton adresse e-mail',
      intro: 'Plus qu’un clic pour activer ton compte :',
      cta: 'Confirmer mon e-mail',
    },
    reset: {
      subject: 'Nouveau mot de passe',
      intro: 'Tu as demandé à changer ton mot de passe. Le lien est valable une heure :',
      cta: 'Choisir un nouveau mot de passe',
    },
    exists: {
      subject: 'Tu as déjà un compte',
      intro:
        'Quelqu’un (toi, sans doute) a voulu créer un compte avec cette adresse, mais elle est déjà inscrite. Connecte-toi, ou choisis un nouveau mot de passe si tu l’as oublié :',
      cta: 'Me connecter',
    },
  },
  en: {
    hello: 'Hey',
    ignore: "If you didn't ask for this, just ignore this email.",
    site: '[SITE NAME]',
    verify: {
      subject: 'Confirm your email address',
      intro: 'One click left to activate your account:',
      cta: 'Confirm my email',
    },
    reset: {
      subject: 'New password',
      intro: 'You asked to change your password. The link is valid for one hour:',
      cta: 'Choose a new password',
    },
    exists: {
      subject: 'You already have an account',
      intro:
        'Someone (probably you) tried to create an account with this address, but it is already registered. Log in, or choose a new password if you forgot it:',
      cta: 'Log me in',
    },
  },
}

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

export function authMail(kind: Kind, locale: string, name: string, url: string) {
  const l: Locale = locale === 'en' ? 'en' : 'fr'
  const c = COPY[l]
  const k = c[kind]
  const subject = `${k.subject} · ${c.site}`
  const text = `${c.hello} ${name},\n\n${k.intro}\n${url}\n\n${c.ignore}\n\n${c.site}`
  const html = `<div style="font-family:Arial,sans-serif;background:#0c0b0a;color:#f4efe4;padding:32px">
<p style="font-size:22px;font-weight:bold;text-transform:uppercase;margin:0 0 24px">${escape(c.site)}</p>
<p>${escape(c.hello)} ${escape(name)},</p>
<p>${escape(k.intro)}</p>
<p><a href="${escape(url)}" style="display:inline-block;background:#f5b82e;color:#0c0b0a;padding:14px 20px;font-weight:bold;text-transform:uppercase;text-decoration:none">${escape(k.cta)}</a></p>
<p style="color:#b9b1a3;font-size:13px">${escape(c.ignore)}</p>
</div>`
  return { subject, text, html }
}

const LINEUP = {
  fr: {
    invite: {
      subject: '{band} t’invite dans son line-up',
      intro: '{actor} t’invite à rejoindre le line-up de {band}. Réponds depuis ton compte :',
      cta: 'Voir l’invitation',
    },
    request: {
      subject: '{actor} veut rejoindre {band}',
      intro:
        '{actor} demande à rejoindre le line-up de {band}. Accepte ou refuse depuis la page du groupe :',
      cta: 'Voir la demande',
    },
  },
  en: {
    invite: {
      subject: '{band} invites you to its lineup',
      intro: '{actor} invites you to join the {band} lineup. Answer from your account:',
      cta: 'See the invite',
    },
    request: {
      subject: '{actor} wants to join {band}',
      intro: '{actor} asks to join the {band} lineup. Accept or decline from the band page:',
      cta: 'See the request',
    },
  },
} as const

// Invitation d'un musicien par un groupe, ou demande d'un musicien pour rejoindre un groupe.
export function lineupMail(
  kind: 'invite' | 'request',
  locale: string,
  name: string,
  vars: { band: string; actor: string },
  url: string,
) {
  const l: Locale = locale === 'en' ? 'en' : 'fr'
  const fill = (s: string) => s.replace('{band}', vars.band).replace('{actor}', vars.actor)
  const k = LINEUP[l][kind]
  const c = COPY[l]
  const subject = `${fill(k.subject)} · ${c.site}`
  const intro = fill(k.intro)
  const text = `${c.hello} ${name},\n\n${intro}\n${url}\n\n${c.site}`
  const html = `<div style="font-family:Arial,sans-serif;background:#0c0b0a;color:#f4efe4;padding:32px">
<p style="font-size:22px;font-weight:bold;text-transform:uppercase;margin:0 0 24px">${escape(c.site)}</p>
<p>${escape(c.hello)} ${escape(name)},</p>
<p>${escape(intro)}</p>
<p><a href="${escape(url)}" style="display:inline-block;background:#f5b82e;color:#0c0b0a;padding:14px 20px;font-weight:bold;text-transform:uppercase;text-decoration:none">${escape(fill(k.cta))}</a></p>
</div>`
  return { subject, text, html }
}
