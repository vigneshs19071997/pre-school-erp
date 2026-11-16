/** Decorative assets for the login page, built from the school's sprout-and-shield mark. */

export function ShieldLogo({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 132" width={size} height={size * (132 / 120)} className={className} aria-hidden="true">
      <path d="M60 3 111 25v43c0 29-22 49-51 61C31 117 9 97 9 68V25Z" fill="#fff" />
      <path d="M60 15 99 32v35c0 22-16 38-39 49C37 105 21 89 21 67V32Z" fill="#08743d" stroke="#f5c400" strokeWidth="3" />
      <path d="M59 84V51" stroke="#ffd21a" strokeWidth="5" strokeLinecap="round" />
      <path d="M57 58C35 57 34 39 35 32c16 1 27 10 22 26Z" fill="#a6df28" />
      <path d="M63 58c22-1 23-19 22-26-16 1-27 10-22 26Z" fill="#b6ed39" />
      <path d="M59 61 44 46M62 61l15-15" stroke="#08743d" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

/** Just the leaf, for small inline uses (e.g. the card header). */
export function SproutMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="20 28 80 60" width={size} height={size * 0.75} className={className} aria-hidden="true">
      <path d="M59 84V51" stroke="#ffd21a" strokeWidth="5" strokeLinecap="round" />
      <path d="M57 58C35 57 34 39 35 32c16 1 27 10 22 26Z" fill="#a6df28" />
      <path d="M63 58c22-1 23-19 22-26-16 1-27 10-22 26Z" fill="#b6ed39" />
    </svg>
  );
}

export function Squiggle({ width = 130, className }: { width?: number; className?: string }) {
  return (
    <svg viewBox="0 0 140 14" width={width} height={width * (14 / 140)} className={className} aria-hidden="true">
      <path d="M2 9c19-11 38 7 58-1s39 9 59-2" stroke="#ffd21a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" className={className} aria-hidden="true">
      <path d="M8 8 15 15" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M4 24 13 24" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M8 40 15 33" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/** Rolling hills strip — sits behind the sign-in card at the bottom of the page. */
export function Hills({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M0 95C230 20 400 45 610 88s430 54 830-42v134H0Z" fill="#9bd344" />
      <path d="M0 125c250-80 440-30 680 8s490 12 760-58v105H0Z" fill="#78b936" />
      <path d="M0 147c280-50 510-10 760 5s470-4 680-50v78H0Z" fill="#a8db4d" />
      <g fill="#8acb35">
        <path d="M38 128C6 90 16 48 22 25c32 22 42 57 16 103Z" />
        <path d="M40 130c-1-40 12-68 37-84 2 39-11 68-37 84Z" />
        <path d="M1390 135c-27-40-17-74-10-96 30 25 38 60 10 96Z" />
        <path d="M1393 138c1-40 15-67 40-81 0 39-14 68-40 81Z" />
      </g>
    </svg>
  );
}

/** Warm wood-table gradient standing in for the hero photo until a real one is supplied. */
export const HERO_PHOTO_FALLBACK =
  "radial-gradient(ellipse 120% 100% at 75% 35%, rgba(0,0,0,0) 0%, rgba(20,40,20,.25) 60%), linear-gradient(160deg, #e3c48f 0%, #d1a86a 45%, #b98a52 100%)";
