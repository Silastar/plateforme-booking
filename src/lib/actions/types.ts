export type FormState = { status: 'idle' | 'saved' | 'error'; errors: Record<string, string> }
export const IDLE: FormState = { status: 'idle', errors: {} }
