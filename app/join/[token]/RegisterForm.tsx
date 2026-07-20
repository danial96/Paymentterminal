"use client";
import { useState } from "react";
import { submitRegistration } from "@/app/actions/hrm-registration";

export default function RegisterForm({ token }: { token: string }) {
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await submitRegistration(token, {
      firstName: fd.get("firstName") as string,
      lastName: fd.get("lastName") as string,
      fatherName: fd.get("fatherName") as string,
      phone: fd.get("phone") as string,
      personalEmail: fd.get("personalEmail") as string,
      cnic: fd.get("cnic") as string,
      dateOfBirth: fd.get("dateOfBirth") as string,
      gender: fd.get("gender") as string,
      currentAddress: fd.get("currentAddress") as string,
      emergencyContactName: fd.get("emergencyContactName") as string,
      emergencyContact: fd.get("emergencyContact") as string,
      emergencyContactRelation: fd.get("emergencyContactRelation") as string,
      linkedInUrl: fd.get("linkedInUrl") as string,
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else setDone((result as { success: true; name: string }).name || "");
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <div className="text-4xl">✓</div>
        <p className="text-white font-semibold text-lg">Registration Submitted!</p>
        <p className="text-white/60 text-sm">Thank you, {done}. HR will review your details and activate your account soon.</p>
      </div>
    );
  }

  const inputClass = "w-full rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-white/50 focus:outline-none focus:bg-white/15 transition-colors";
  const selectClass = "w-full rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none focus:bg-white/15 transition-colors";
  const labelClass = "block text-xs font-semibold text-white/80 mb-1 uppercase tracking-wide";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>First Name *</label>
          <input name="firstName" required className={inputClass} placeholder="Ali" />
        </div>
        <div>
          <label className={labelClass}>Last Name *</label>
          <input name="lastName" required className={inputClass} placeholder="Khan" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Father Name</label>
        <input name="fatherName" className={inputClass} placeholder="Muhammad Khan" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Phone *</label>
          <input name="phone" required className={inputClass} placeholder="03XX-XXXXXXX" />
        </div>
        <div>
          <label className={labelClass}>Personal Email</label>
          <input name="personalEmail" type="email" className={inputClass} placeholder="you@gmail.com" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>CNIC</label>
          <input name="cnic" className={inputClass} placeholder="XXXXX-XXXXXXX-X" />
        </div>
        <div>
          <label className={labelClass}>Date of Birth</label>
          <input name="dateOfBirth" type="date" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Gender</label>
        <select name="gender" className={selectClass} style={{ background: "rgba(80,61,152,0.6)" }}>
          <option value="">Select</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Current Address</label>
        <textarea name="currentAddress" rows={2} className={inputClass} placeholder="House #, Street, City" />
      </div>

      <div>
        <label className={labelClass}>LinkedIn Profile URL</label>
        <input name="linkedInUrl" type="text" className={inputClass} placeholder="https://linkedin.com/in/yourname" />
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">Emergency Contact</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Name</label>
            <input name="emergencyContactName" className={inputClass} placeholder="Contact Name" />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input name="emergencyContact" className={inputClass} placeholder="03XX-XXXXXXX" />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelClass}>Relation</label>
          <input name="emergencyContactRelation" className={inputClass} placeholder="Father / Spouse / Sibling" />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}
      >
        {loading ? "Submitting..." : "Submit Registration"}
      </button>
    </form>
  );
}
