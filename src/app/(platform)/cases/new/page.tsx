import { redirect } from "next/navigation";
import { getCurrentAuthenticatedUser } from "@/lib/services/userService";
import NewCaseForm from "./upload-form";

export default async function NewCasePage() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Add new cervical screening case</h1>
        <p className="mt-2 text-sm text-slate-500">
          Images are encrypted and stored through decentralized, secure and privacy-oriented
          technology. Analytic results are written to the shared metadata ledger.
        </p>
      </div>
      <NewCaseForm />
      <aside className="card bg-slate-50 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-800">Upload & privacy guidance</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Ensure identifying patient markers are obscured prior to upload.</li>
          <li>Accepted formats: JPEG, PNG, WEBP. Max size 20 MB for this pilot build.</li>
          <li>
            Processing typically completes in seconds. Complex cases may take longer depending on
            model load.
          </li>
          <li>
            Admins can monitor aggregate activity, but only you and admins can view the original
            imagery.
          </li>
        </ul>
      </aside>
    </div>
  );
}
