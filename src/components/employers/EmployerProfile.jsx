import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getUserRole } from "../../utils/user";
import { formatPhoneNumber } from "../../utils/phone";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function EmployerProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [uploadError, setUploadError] = useState(null);

    const [companyName, setCompanyName] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [industry, setIndustry] = useState("");
    const [logo, setLogo] = useState("");

    const user = getCurrentUser();

    useEffect(() => {
        if (!user) { navigate("/login", { replace: true }); return; }
        if (getUserRole(user) !== "employer") { navigate("/", { replace: true }); return; }

        fetch(`${API_BASE}/employers/${user.id}`)
            .then((r) => { if (!r.ok) throw new Error("Failed to load profile"); return r.json(); })
            .then((data) => {
                setProfile(data);
                setCompanyName(data.companyName || data.name || "");
                setPhone(formatPhoneNumber(data.phone));
                setLocation(data.location ?? "");
                setIndustry(data.industry ?? "");
                setLogo(data.logo ?? "");
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    async function handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        setUploadError(null);
        const form = new FormData();
        form.append("image", file);
        const res = await fetch(`${API_BASE}/upload/image`, { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) { setUploadError(data.error || "Image upload failed"); return; }
        setLogo(data.url);
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/employers/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: companyName, companyName, phone, location, industry, logo }),
            });
            if (!res.ok) throw new Error("Save failed");
            const updated = await res.json();
            setProfile(updated);

            const stored = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({
                ...stored,
                name: companyName,
                companyName,
                phone,
                location,
                industry,
                logo,
            }));

            setEditing(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    function handleEdit() {
        setCompanyName(profile.companyName || profile.name || "");
        setPhone(formatPhoneNumber(profile.phone));
        setLocation(profile.location ?? "");
        setIndustry(profile.industry ?? "");
        setLogo(profile.logo ?? "");
        setUploadError(null);
        setEditing(true);
    }

    if (loading) return <p className="mt-12 text-center text-slate-500">Loading profile…</p>;
    if (error && !profile) return <p className="mt-12 text-center text-red-500">Error: {error}</p>;
    if (!profile) return null;

    const displayName = profile.companyName || profile.name || profile.email;
    const initial = (displayName?.[0] ?? "?").toUpperCase();

    const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-500";
    const labelClass = "mb-1 block text-sm font-medium text-slate-700";

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-6 text-3xl font-bold text-slate-900">Company Profile</h1>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {/* Logo + name header */}
                <div className="flex items-center gap-4 mb-6">
                    {profile.logo ? (
                        <img
                            src={`${API_BASE}${profile.logo}`}
                            alt={displayName}
                            className="h-20 w-20 rounded-full object-cover border border-slate-200"
                        />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-2xl font-bold text-violet-700">
                            {initial}
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">{displayName}</h2>
                        <p className="text-sm text-slate-500">{profile.email}</p>
                        {profile.industry && <p className="text-sm text-slate-400">{profile.industry}</p>}
                        {profile.phone && <p className="text-sm text-slate-400">{profile.phone}</p>}
                    </div>
                </div>

                {!editing ? (
                    /* ── VIEW MODE ── */
                    <div className="flex flex-col gap-5">
                        {profile.location && (
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Location</p>
                                <p className="mt-0.5 text-slate-700">{profile.location}</p>
                            </div>
                        )}
                        {profile.phone && (
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Phone</p>
                                <p className="mt-0.5 text-slate-700">{profile.phone}</p>
                            </div>
                        )}
                        {profile.industry && (
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Industry</p>
                                <p className="mt-0.5 text-slate-700">{profile.industry}</p>
                            </div>
                        )}

                        <button
                            className="mt-2 w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                            onClick={handleEdit}
                        >
                            Edit Profile
                        </button>
                    </div>
                ) : (
                    /* ── EDIT MODE ── */
                    <form onSubmit={handleSave} className="flex flex-col gap-5">
                        <div>
                            <label className={labelClass}>Company Name</label>
                            <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                        </div>

                        <div>
                            <label className={labelClass}>Phone</label>
                            <input
                                className={inputClass}
                                type="tel"
                                inputMode="tel"
                                value={phone}
                                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                                placeholder="e.g. (250) 555-1234"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Location</label>
                            <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kelowna, BC" />
                        </div>

                        <div>
                            <label className={labelClass}>Industry</label>
                            <input className={inputClass} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology" />
                        </div>

                        <div>
                            <label className={labelClass}>Company Logo (JPEG, PNG, GIF, WEBP — max 5MB)</label>
                            <label className="mt-1 flex items-center gap-3 cursor-pointer">
                                <span className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
                                    Choose Image
                                </span>
                                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleLogoUpload} className="hidden" />
                                {logo
                                    ? <img src={`${API_BASE}${logo}`} alt="Preview" className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                                    : <span className="text-sm text-slate-400">No image chosen</span>
                                }
                            </label>
                        </div>

                        {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                            >
                                {saving ? "Saving…" : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default EmployerProfile;