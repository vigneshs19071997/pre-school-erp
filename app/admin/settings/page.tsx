import { requireStaff } from "@/lib/auth";
import { getSchool, getLoginPhotoUrl } from "@/lib/school";
import { getGeofence } from "@/lib/geo";
import { PageHeader, Field, Card } from "@/components/ui";
import { ActionForm, SubmitButton, GeofenceFields } from "@/components/client";
import { saveSettings, saveLoginPhoto } from "./actions";

export default async function Settings() {
  await requireStaff("settings.manage");
  const [s, geo, loginPhotoUrl] = await Promise.all([getSchool(), getGeofence(), getLoginPhotoUrl()]);
  return (
    <>
      <PageHeader title="School settings" emoji="⚙️" subtitle="Shown on the login page, receipts and payslips" />
      <div className="space-y-6">
        <ActionForm action={saveSettings} reset={false}>
          <div className="card max-w-3xl space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="School name"><input name="name" defaultValue={s.name} className="input" /></Field>
              <Field label="Tagline"><input name="tagline" defaultValue={s.tagline} className="input" /></Field>
              <Field label="Phone"><input name="phone" defaultValue={s.phone} className="input" /></Field>
              <Field label="Email"><input name="email" defaultValue={s.email} className="input" /></Field>
              <Field label="Academic year"><input name="academicYear" defaultValue={s.academicYear} className="input" /></Field>
              <Field label="Address" className="sm:col-span-2"><textarea name="address" rows={2} defaultValue={s.address} className="input" /></Field>
            </div>
          </div>
          <Card title="Attendance geofence" className="mt-6 max-w-3xl">
            <p className="mb-4 text-sm text-slate-500">Staff must check in/out from within this radius of the school. Stand at the school and tap the button below, or enter coordinates manually.</p>
            <GeofenceFields defaultLat={geo.lat?.toString() ?? ""} defaultLng={geo.lng?.toString() ?? ""} defaultRadius={String(geo.radius)} />
          </Card>
          <SubmitButton className="btn-primary mt-6">Save settings</SubmitButton>
        </ActionForm>

        <Card title="Login page photo" className="max-w-3xl">
          <p className="mb-4 text-sm text-slate-500">Shown behind the sign-in form on the login page. Any staff member with access to Settings can change it — the new photo appears right away, no deploy needed.</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {loginPhotoUrl ? (
              <img src={loginPhotoUrl} alt="Current login page photo" className="h-28 w-28 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="grid h-28 w-28 shrink-0 place-items-center rounded-2xl bg-slate-50 text-xs text-slate-400 ring-1 ring-slate-200">No photo yet</div>
            )}
            <ActionForm action={saveLoginPhoto} reset={true} className="flex-1 space-y-3">
              <Field label="Upload a new photo"><input type="file" name="photo" accept="image/*" required className="input text-xs" /></Field>
              <SubmitButton pendingText="Uploading…">Upload photo</SubmitButton>
            </ActionForm>
          </div>
        </Card>
      </div>
    </>
  );
}
