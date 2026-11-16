export type ActionState = { ok: boolean; message?: string; error?: string; at?: number } | null;

export const ok = (message: string): ActionState => ({ ok: true, message, at: Date.now() });
export const fail = (error: string): ActionState => ({ ok: false, error, at: Date.now() });
