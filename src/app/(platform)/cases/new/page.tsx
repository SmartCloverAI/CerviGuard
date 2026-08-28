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
          Submit a de-identified image for model-assisted analysis. Storage, encryption, and metadata
          controls follow the configuration of the deployed environment.
        </p>
      </div>
      <NewCaseForm />
      <aside className="card bg-slate-50 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-800">Upload & privacy guidance</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Ensure identifying patient markers are obscured prior to upload.</li>
          <li>Accepted formats: JPEG, PNG, WEBP. Maximum size: 20 MB.</li>
          <li>
            Processing typically completes in seconds. Complex cases may take longer depending on
            model load.
          </li>
          <li>
            Case details and imagery are limited to the submitting clinician and administrators.
          </li>
        </ul>
      </aside>
    </div>
  );
}
