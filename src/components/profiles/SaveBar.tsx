'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useRef, useTransition } from 'react'

import { formStyles as styles } from '@/components/forms/fields'
import { useRouter } from '@/i18n/navigation'
import { IDLE, type FormState } from '@/lib/actions/types'

// Message d'état en haut ou en bas d'un formulaire d'édition, et bouton « Enregistrer ».
export function FormStatus({ state }: { state: FormState }) {
  const t = useTranslations('forms')
  if (state.status === 'saved') {
    return (
      <p role="status" className={styles.status}>
        {t('saved')}
      </p>
    )
  }
  if (state.status === 'error') {
    const form = state.errors.form
    return (
      <p role="alert" className={`${styles.status} ${styles.statusError}`}>
        {form ? t(`errors.${form}` as never) : t('fixErrors')}
      </p>
    )
  }
  return null
}

export function SaveButton({ pending }: { pending: boolean }) {
  const t = useTranslations('forms')
  return (
    <button type="submit" className={`btn ${styles.save}`} disabled={pending}>
      {pending ? t('saving') : t('save')}
    </button>
  )
}

// Envoi sans remise à zéro du formulaire (comportement par défaut de React 19 avec <form action>) :
// les champs gardent ce que la personne a saisi, la page se rafraîchit pour afficher les nouveaux fichiers.
export function useEditForm(action: (state: FormState, fd: FormData) => Promise<FormState>) {
  const router = useRouter()
  const [state, dispatch, pending] = useActionState(action, IDLE)
  const [, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status !== 'saved') return
    formRef.current
      ?.querySelectorAll<HTMLInputElement>('input[type=file]')
      .forEach((input) => (input.value = ''))
    router.refresh()
  }, [state, router])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => dispatch(fd))
  }

  return { state, pending, onSubmit, formRef }
}
