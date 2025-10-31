"use client";

import { useState } from "react";

interface CaseResponse {
  case: {
    id: string;
    status: string;
  };
}

export default function NewCaseForm() {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Please select an image to upload.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File exceeds the 20MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    if (notes) {
      formData.append("notes", notes);
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload failed");
      }
      const body: CaseResponse = await response.json();
      window.location.href = `/cases/${body.case.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit case");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-dashed border-teal-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Cervical image</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const next = event.target.files?.[0];
            setFile(next ?? null);
            setError(null);
          }}
        />
        <p className="mt-1 text-xs text-slate-500">
          We encrypt images client-side before transit to our decentralized, secure and privacy-oriented network.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Notes (optional)</label>
        <textarea
          rows={4}
          placeholder="Clinical observations, patient anonymized reference, etc."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={500}
        />
        <p className="mt-1 text-xs text-slate-400">{notes.length}/500 characters</p>
      </div>
      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="px-6 py-3">
        {isSubmitting ? "Uploading & analyzing…" : "Submit case"}
      </button>
      <p className="text-xs text-slate-500">
        By uploading you confirm the image has been de-identified and consent is handled offline, in
        line with SmartClover pilot guidelines.
      </p>
    </form>
  );
}
