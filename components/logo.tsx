const TONES = { brand: "#2b6b4d", coral: "#943349" } as const;

/** The school crest: a gold-trimmed shield in the brand colour, with an optional monogram letter. */
export function Logo({ initial, size = 40, tone = "brand", className }: {
  initial?: string; size?: number; tone?: keyof typeof TONES; className?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className}
      role={initial ? "img" : undefined} aria-label={initial ? undefined : undefined} aria-hidden={initial ? undefined : true}>
      <path d="M32 4 L54 13 V29 C54 46 44 56 32 61 C20 56 10 46 10 29 V13 Z" fill={TONES[tone]} stroke="#b8862a" strokeWidth="2.5" />
      <path d="M17 23 H47" stroke="#b8862a" strokeWidth="1.4" opacity="0.55" />
      {initial && (
        <text x="32" y="43" textAnchor="middle" fontFamily="'Playfair Display', Georgia, serif" fontSize="22" fontWeight="700" fill="#f3e9c7">
          {initial}
        </text>
      )}
    </svg>
  );
}
