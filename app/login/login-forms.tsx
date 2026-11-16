"use client";

import { useActionState, useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, Lock, Phone, User } from "lucide-react";
import { SubmitButton } from "@/components/client";
import { SproutMark } from "@/components/login-art";
import { login, parentSetup } from "./actions";
import type { ActionState } from "@/lib/action";

function Error({ state }: { state: ActionState }) {
  if (!state?.error) return null;
  return <p className="flex items-center gap-2 rounded-xl bg-[#fbe4e4] px-3 py-2.5 text-sm font-medium text-[#b3404a]"><AlertCircle className="h-4 w-4 shrink-0" />{state.error}</p>;
}

function Field({ icon: Icon, label, trailing, children }: { icon: React.ElementType; label: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-2.5 shadow-sm backdrop-blur-sm">
      <Icon className="h-[18px] w-[18px] shrink-0 text-[#1a2238]" strokeWidth={2.2} />
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
        {children}
      </div>
      {trailing}
    </div>
  );
}

const inputCls = "w-full bg-transparent text-[15px] font-medium text-[#1a2238] placeholder:text-slate-400 outline-none";

export function LoginForms() {
  const [setup, setSetup] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [s1, a1] = useActionState(login, null);
  const [s3, a3] = useActionState(parentSetup, null);

  return (
    <div className="rounded-[28px] border border-white/40 bg-white/40 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:bg-white/25">
      <div className="text-center">
        <SproutMark size={44} className="mx-auto" />
        <h2 className="mt-2 font-display text-2xl font-bold text-[#1a2238]">{setup ? "Create password" : <>Welcome Back <span aria-hidden="true">👋</span></>}</h2>
        <p className="mt-1 text-sm text-[#1a2238]/70">{setup ? "For parents, using the school's details" : "Sign in to continue"}</p>
      </div>

      {!setup && (
        <form action={a1} className="mt-6 space-y-3">
          <Field icon={User} label="Employee ID or Student ID">
            <input name="id" required className={`${inputCls} uppercase`} placeholder="E.g. EMP001 or LS20260001" autoComplete="username" />
          </Field>
          <Field icon={Lock} label="Password" trailing={
            <button type="button" onClick={() => setShowPw((v) => !v)} className="shrink-0 text-slate-400 hover:text-slate-600" aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          }>
            <input name="password" type={showPw ? "text" : "password"} required className={inputCls} placeholder="Enter your password" autoComplete="current-password" />
          </Field>
          <Error state={s1} />
          <SubmitButton className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#ffcd1f] py-3.5 text-[15px] font-bold text-[#1a2238] shadow-lg transition hover:bg-[#f3c200] active:scale-[.99]">
            Sign In <ArrowRight className="h-4 w-4" />
          </SubmitButton>
          <button type="button" onClick={() => setSetup(true)} className="flex w-full items-center justify-center gap-1.5 pt-1 text-center text-sm font-semibold text-[#0d5a33]">
            <KeyRound className="h-3.5 w-3.5 shrink-0" />
            <span>Parent, first time here? <span className="underline underline-offset-2">Create your password →</span></span>
          </button>
        </form>
      )}

      {setup && (
        <form action={a3} className="mt-6 space-y-3">
          <p className="rounded-2xl bg-white/70 px-3.5 py-2.5 text-xs text-[#1a2238]/80">Use the Student ID given by the school and the mobile number you registered at admission.</p>
          <Field icon={User} label="Student ID">
            <input name="studentCode" required className={`${inputCls} uppercase`} placeholder="e.g. LS20260001" />
          </Field>
          <Field icon={Phone} label="Registered mobile number">
            <input name="phone" required className={inputCls} inputMode="tel" placeholder="98xxxxxxxx" />
          </Field>
          <Field icon={Lock} label="New password" trailing={
            <button type="button" onClick={() => setShowNewPw((v) => !v)} className="shrink-0 text-slate-400 hover:text-slate-600" aria-label={showNewPw ? "Hide password" : "Show password"}>
              {showNewPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          }>
            <input name="password" type={showNewPw ? "text" : "password"} minLength={6} required className={inputCls} placeholder="At least 6 characters" autoComplete="new-password" />
          </Field>
          <Field icon={Lock} label="Confirm password">
            <input name="confirm" type={showNewPw ? "text" : "password"} minLength={6} required className={inputCls} placeholder="Type it again" autoComplete="new-password" />
          </Field>
          <Error state={s3} />
          <SubmitButton className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#ffcd1f] py-3.5 text-[15px] font-bold text-[#1a2238] shadow-lg transition hover:bg-[#f3c200] active:scale-[.99]">
            Create password &amp; sign in <ArrowRight className="h-4 w-4" />
          </SubmitButton>
          <button type="button" onClick={() => setSetup(false)} className="w-full pt-1 text-center text-sm font-semibold text-[#1a2238]/60">← Back to sign in</button>
        </form>
      )}
    </div>
  );
}
