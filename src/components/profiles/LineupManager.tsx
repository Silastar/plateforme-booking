'use client'

import { useTranslations } from 'next-intl'

import { formStyles as styles, Input, Section } from '@/components/forms/fields'
import { lineupAction } from '@/lib/actions/lineup'
import type { MemberView } from '@/lib/lineup'

import { MiniForm } from './MiniForm'
import css from './profile.module.css'

export function LineupManager({ bandId, members }: { bandId: string; members: MemberView[] }) {
  const t = useTranslations('lineup')
  const active = members.filter((m) => m.status === 'active')
  const requests = members.filter((m) => m.status === 'requested')
  const invited = members.filter((m) => m.status === 'invited')

  return (
    <div className={`${styles.form} ${styles.accentGroupe}`}>
      <Section n={6} title={t('title')} intro={t('intro')}>
        {requests.length > 0 && (
          <div className={styles.field}>
            <span>{t('requests')}</span>
            {requests.map((m) => (
              <div key={m.id} className={css.facade}>
                <strong>
                  {m.name}
                  {m.role ? ` · ${m.role}` : ''}
                </strong>
                <span style={{ display: 'flex', gap: 8 }}>
                  <MiniForm action={lineupAction} hidden={{ bandId, memberId: m.id, op: 'accept' }}>
                    {({ pending }) => (
                      <button type="submit" className="btn btn--red" disabled={pending}>
                        {t('accept')}
                      </button>
                    )}
                  </MiniForm>
                  <MiniForm
                    action={lineupAction}
                    hidden={{ bandId, memberId: m.id, op: 'decline' }}
                  >
                    {({ pending }) => (
                      <button type="submit" className="btn btn--ghost" disabled={pending}>
                        {t('decline')}
                      </button>
                    )}
                  </MiniForm>
                </span>
              </div>
            ))}
          </div>
        )}

        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {active.map((m) => (
            <li key={m.id} style={{ background: 'var(--c-ink)', padding: 16 }}>
              <MiniForm action={lineupAction} hidden={{ bandId, memberId: m.id, op: 'update' }}>
                {({ pending, errors }) => (
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}
                  >
                    <div style={{ flex: '1 1 180px' }}>
                      <span className="display" style={{ fontSize: 24 }}>
                        {m.name}
                      </span>
                      <div className={styles.help}>
                        {m.hasAccount ? (m.isMe ? t('you') : t('linked')) : t('noAccount')}
                      </div>
                    </div>
                    <div style={{ flex: '1 1 180px' }}>
                      <Input
                        name="role"
                        label={t('role')}
                        errors={{ role: errors[`role-${m.id}`] ?? '' }}
                        defaultValue={m.role}
                        placeholder={t('rolePlaceholder')}
                      />
                    </div>
                    <label className={styles.check}>
                      <input type="checkbox" name="isEssential" defaultChecked={m.isEssential} />
                      {t('essential')}
                    </label>
                    {m.hasAccount && (
                      <label className={styles.check}>
                        <input type="checkbox" name="isAdmin" defaultChecked={m.isAdmin} />
                        {t('admin')}
                      </label>
                    )}
                    <button type="submit" className="btn btn--paper" disabled={pending}>
                      {t('save')}
                    </button>
                  </div>
                )}
              </MiniForm>
              <MiniForm
                action={lineupAction}
                hidden={{ bandId, memberId: m.id, op: 'remove' }}
                confirm={t('confirmRemove', { name: m.name })}
                style={{ marginTop: 8 }}
              >
                {({ pending }) => (
                  <button
                    type="submit"
                    className="btn btn--ghost"
                    disabled={pending}
                    style={{ minHeight: 40, padding: '8px 14px', fontSize: 13 }}
                  >
                    {t('remove')}
                  </button>
                )}
              </MiniForm>
            </li>
          ))}
        </ul>

        {invited.length > 0 && (
          <div className={styles.field}>
            <span>{t('invited')}</span>
            {invited.map((m) => (
              <div key={m.id} className={css.facade}>
                <span>{t('invitedTo', { name: m.name })}</span>
                <MiniForm action={lineupAction} hidden={{ bandId, memberId: m.id, op: 'remove' }}>
                  {({ pending }) => (
                    <button type="submit" className="btn btn--ghost" disabled={pending}>
                      {t('cancelInvite')}
                    </button>
                  )}
                </MiniForm>
              </div>
            ))}
          </div>
        )}

        <div className={styles.grid} style={{ alignItems: 'start' }}>
          <MiniForm
            action={lineupAction}
            hidden={{ bandId, op: 'invite' }}
            resetOnSave
            className={styles.form}
            style={{ gap: 12, background: 'var(--c-ink)', padding: 16 }}
          >
            {({ pending, errors }) => (
              <>
                <strong className="label">{t('inviteTitle')}</strong>
                <span className={styles.help}>{t('inviteHelp')}</span>
                <Input name="email" type="email" label={t('email')} errors={errors} />
                <Input
                  name="role"
                  label={t('role')}
                  errors={errors}
                  placeholder={t('rolePlaceholder')}
                />
                <label className={styles.check}>
                  <input type="checkbox" name="isEssential" defaultChecked />
                  {t('essential')}
                </label>
                <button type="submit" className="btn btn--red" disabled={pending}>
                  {t('invite')}
                </button>
              </>
            )}
          </MiniForm>
          <MiniForm
            action={lineupAction}
            hidden={{ bandId, op: 'add' }}
            resetOnSave
            className={styles.form}
            style={{ gap: 12, background: 'var(--c-ink)', padding: 16 }}
          >
            {({ pending, errors }) => (
              <>
                <strong className="label">{t('addTitle')}</strong>
                <span className={styles.help}>{t('addHelp')}</span>
                <Input name="name" label={t('name')} errors={errors} />
                <Input
                  name="role"
                  label={t('role')}
                  errors={errors}
                  placeholder={t('rolePlaceholder')}
                />
                <label className={styles.check}>
                  <input type="checkbox" name="isEssential" defaultChecked />
                  {t('essential')}
                </label>
                <button type="submit" className="btn btn--paper" disabled={pending}>
                  {t('add')}
                </button>
              </>
            )}
          </MiniForm>
        </div>
      </Section>
    </div>
  )
}
