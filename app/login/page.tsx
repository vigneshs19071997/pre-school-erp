import { CalendarCheck, BarChart3, IndianRupee } from "lucide-react";
import { getSchool, getLoginPhotoUrl } from "@/lib/school";
import { ShieldLogo, Squiggle, Sparkle, Hills, HERO_PHOTO_FALLBACK } from "@/components/login-art";
import { LoginForms } from "./login-forms";

export const dynamic = "force-dynamic";

const FEATURES = [
  { Icon: CalendarCheck, label: "Attendance", bg: "#3fae6b" },
  { Icon: BarChart3, label: "Daily Reports", bg: "#2f9e8f" },
  { Icon: IndianRupee, label: "Fees & HR", bg: "#eaa52e" },
];

function LogoLockup({ name }: { name: string }) {
  return (
    <div className="inline-block">
      <div className="flex items-center gap-3">
        <ShieldLogo size={40} />
        <span className="font-display text-xl font-bold leading-tight text-white">{name}</span>
      </div>
      <Squiggle width={150} className="mt-0.5 ml-12" />
    </div>
  );
}

function Headline({ tagline }: { tagline: string }) {
  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold leading-[1.15] text-white xl:text-[2.75rem]">
        Every little day,
        <br />
        beautifully <span className="text-[#ffd21a]">managed.</span>
      </h1>
      <Squiggle width={190} className="mt-1" />
      <p className="mt-4 max-w-sm text-[15px] text-white/90">
        Attendance, homework, daily updates, progress, fees and more — all in one place.
      </p>
      <p className="mt-6 text-xs font-medium uppercase tracking-wide text-white/60">{tagline}</p>
      <div className="mt-3 flex gap-7">
        {FEATURES.map(({ Icon, label, bg }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <span className="grid h-12 w-12 place-items-center rounded-2xl shadow-lg" style={{ background: bg }}>
              <Icon className="h-5 w-5 text-white" strokeWidth={2.4} />
            </span>
            <span className="text-xs font-semibold text-white">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function LoginPage() {
  const [school, photoUrl] = await Promise.all([getSchool(), getLoginPhotoUrl()]);
  const heroImage = { backgroundImage: photoUrl ? `url(${photoUrl})` : HERO_PHOTO_FALLBACK };

  return (
    <main className="relative bg-[#faf7ef] lg:h-screen lg:overflow-hidden">
      {/* Desktop / tablet: photo shown in full (no forced crop) anchored right, over a solid emerald canvas */}
      <div className="absolute inset-0 hidden bg-[#1f4a30] lg:block">
        <div className="absolute inset-0 bg-no-repeat bg-[length:auto_100%] bg-[position:72%_center] xl:bg-[length:auto_140%] xl:bg-[position:58%_25%]" style={heroImage} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a2b1a] via-[#0a2b1a]/55 to-transparent" />
        <div className="absolute right-[26rem] top-28 text-white/80"><Sparkle /></div>
      </div>
      <div className="absolute left-12 top-10 z-10 hidden lg:block"><LogoLockup name={school.name} /></div>
      <div className="absolute left-12 top-1/2 z-10 hidden max-w-md -translate-y-1/2 lg:block"><Headline tagline={school.tagline} /></div>

      {/* Mobile: hero photo up top, normal document flow so it scrolls safely on short screens */}
      <div className="relative bg-cover bg-top lg:hidden" style={heroImage}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2b1a]/70 via-[#0a2b1a]/30 to-[#0a2b1a]/10" />
        <div className="absolute right-10 top-16 text-white/80"><Sparkle /></div>
        <div className="relative z-10 p-6 pb-20 pt-8">
          <LogoLockup name={school.name} />
          <div className="mt-10"><Headline tagline={school.tagline} /></div>
        </div>
        <Hills className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-20 w-full" />
      </div>

      {/* Sign-in card: rendered once. Mobile: normal flow, pulled up over the hills. Desktop: absolute within <main>. */}
      <div className="relative z-20 mx-4 -mt-9 pb-10 lg:absolute lg:inset-x-auto lg:right-12 lg:top-1/2 lg:mx-0 lg:mt-0 lg:w-full lg:max-w-[380px] lg:-translate-y-1/2 lg:pb-0">
        <LoginForms />
      </div>
    </main>
  );
}
