import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Skills from "../Skills";
import FormField from "./FormField";
import { getCurrentUser } from "../../utils/user";

function validateJobForm({ title, description, payRangeLow, payRangeHigh, location, additionalQuestions }) {
    const errors = {};

    const patterns = {
        title: /^.{3,100}$/,
        description: /^.{10,1500}$/,
        location: /^.{2,100}$/,
        additionalQuestion: /^.{3,200}$/
    };

    title = title.trim();
    description = description.trim();
    location = location.trim();

    if (title === "") {
        errors.title = "Job title is required.";
    }
    else if (!patterns.title.test(title)) {
        errors.title = "Job title must be between 3 and 100 characters.";
    }

    if (description === "") {
        errors.description = "Job description is required.";
    }
    else if (!patterns.description.test(description)) {
        errors.description = "Job description must be between 10 and 1500 characters.";
    }

    if (location === "") {
        errors.location = "Location is required.";
    }
    else if (!patterns.location.test(location)) {
        errors.location = "Location must be between 2 and 100 characters.";
    }

    const low = Number(payRangeLow);
    const high = Number(payRangeHigh);

    if (!Number.isFinite(low) || low < 0 || !low) {
        errors.payRangeLow = "Enter a valid minimum pay.";
    }

    if (!Number.isFinite(high) || high < 0 || !high) {
        errors.payRangeHigh = "Enter a valid maximum pay.";
    }

    if (Number.isFinite(low) && Number.isFinite(high) && high < low) {
        errors.payRangeHigh = "Maximum pay must be greater than or equal to minimum pay.";
    }

    const additionalQuestionErrors = (additionalQuestions || []).map((q) => {
        if (q.trim() === "") {
            return "Additional question cannot be blank.";
        }
        if (!patterns.additionalQuestion.test(q.trim())) {
            return "Additional question must be between 3 and 200 characters.";
        }
        return null;
    });

    if (additionalQuestionErrors.some(Boolean)) {
        errors.additionalQuestions = additionalQuestionErrors;
    }

    return errors;
}

function JobForm({ job, onSave, onCancel, isModal }) {
    const [title, setTitle] = useState(job?.title || "");
    const [description, setDescription] = useState(job?.description || "");
    const [payRangeLow, setPayRangeLow] = useState(job?.payRange?.low ?? "");
    const [payRangeHigh, setPayRangeHigh] = useState(job?.payRange?.high ?? "");
    const [location, setLocation] = useState(job?.location || "");
    const [additionalQuestions, setAdditionalQuestions] = useState(job?.additionalQuestions || []);
    const [additionalQuestionsTouched, setAdditionalQuestionsTouched] = useState((job?.additionalQuestions || []).map(() => false));
    const [skills, setSkills] = useState(job?.skills || []);
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const currentUser = getCurrentUser();

    const navigate = useNavigate();
    const loc = useLocation();
    const creating = !isModal && loc.pathname === "/jobs/new";

    const inputStyle = "rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
    const errors = validateJobForm({ title, description, payRangeLow, payRangeHigh, location, additionalQuestions });

    const shouldShow = (name) => Boolean((touched[name] || submitted) && errors[name]);
    const markTouched = (name) => setTouched((prev) => ({ ...prev, [name]: true }));

    const addQuestion = () => {
        setAdditionalQuestions([...additionalQuestions, ""]);
        setAdditionalQuestionsTouched([...additionalQuestionsTouched, false]);
    };
    const removeQuestion = (i) => {
        setAdditionalQuestions(additionalQuestions.filter((_, index) => index !== i));
        setAdditionalQuestionsTouched(additionalQuestionsTouched.filter((_, index) => index !== i));
    };

    const markAdditionalQuestionTouched = (i) => {
        setAdditionalQuestionsTouched((prev) => prev.map((touchedValue, index) => (index === i ? true : touchedValue)));
    };

    const additionalQuestionErrors = errors.additionalQuestions || [];

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitted(true);

        if (Object.keys(errors).length > 0) {
            return;
        }

        if (!creating && !job?._id) {
            console.error("Missing job id for update");
            return;
        }

        const employerId = (creating ? currentUser?.id : (job?.employerId || currentUser?.id));

        if (!employerId) {
            console.error("Missing employer id");
            return;
        }

        const payload = {
            title,
            description,
            location,
            payRange: {
                low: Number(payRangeLow),
                high: Number(payRangeHigh)
            },
            additionalQuestions: additionalQuestions.map((q) => q.trim()).filter((q) => q !== ""),
            skills,
            employerId,
            postedAt: creating ? new Date().toISOString() : job.postedAt
        }

        setSaving(true);
        
        try {
            if (isModal && onSave) {
                await onSave(payload);
                return;
            }

            const url = creating ? `${API_BASE}/jobs` : `${API_BASE}/jobs/${job._id}`;
            const method = creating ? "POST" : "PATCH";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                console.error("Something went wrong creating/updating the job", res.status);
                return;
            }

            const saved = await res.json();
            console.log("Saved job", saved);

            navigate('/jobs/employers');
        } catch (err) {
            console.error("Request failed", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={isModal ? "space-y-4" : "mx-auto flex min-w-3/4 max-w-2xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm"}>
            {!isModal && (
                <div className="flex items-center justify-between">
                    <legend className="text-2xl font-semibold mb-4">{creating ? "Create New Job" : `Editing "${job.title}"`}</legend>
                </div>
            )}

            <FormField label="Job Title" htmlFor="job-title" error={errors.title} showError={touched.title || submitted}>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => markTouched("title")}
                    id="job-title"
                    type="text"
                    placeholder="Job Title"
                    className={inputStyle}
                />
            </FormField>

            <FormField
                error={errors.description}
                showError={touched.description || submitted}
                labelContent={
                    <label htmlFor="job-description">
                        Job Description <span className={description.length > 1500 ? "text-red-600" : "text-slate-500"}>({description.length}/1500)</span>
                    </label>
                }
            >
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => markTouched("description")}
                    id="job-description"
                    placeholder="Job Description"
                    className={inputStyle}
                    rows={5}
                />
            </FormField>

            <label htmlFor="pay-range" className="text-sm font-medium text-slate-700">Pay Range</label>
            <div className="flex gap-4" id="pay-range">
                <FormField htmlFor="pay-range-low" error={errors.payRangeLow} showError={shouldShow("payRangeLow")}>
                    <input
                        value={payRangeLow}
                        onChange={(e) => setPayRangeLow(e.target.value)}
                        onBlur={() => markTouched("payRangeLow")}
                        id="pay-range-low"
                        type="number"
                        min="0"
                        placeholder="Low"
                        className={`${inputStyle} w-full`}
                    />
                </FormField>
                <FormField htmlFor="pay-range-high" error={errors.payRangeHigh} showError={shouldShow("payRangeHigh")}>
                    <input
                        value={payRangeHigh}
                        onChange={(e) => setPayRangeHigh(e.target.value)}
                        onBlur={() => markTouched("payRangeHigh")}
                        id="pay-range-high"
                        type="number"
                        min="0"
                        placeholder="High"
                        className={`${inputStyle} w-full`}
                    />
                </FormField>
            </div>

            <FormField label="Location" htmlFor="location" error={errors.location} showError={touched.location || submitted}>
                <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onBlur={() => markTouched("location")}
                    id="location"
                    type="text"
                    placeholder="Location"
                    className={inputStyle}
                />
            </FormField>
            {
                (additionalQuestions).map((q, i) => (
                    <FormField
                        key={`additional-questions-${i}`}
                        htmlFor={`additional-question-${i}`}
                        error={additionalQuestionErrors[i]}
                        showError={additionalQuestionsTouched[i] || submitted}
                        labelContent={(
                            <div className="inline-flex justify-between">
                                <label htmlFor={`additional-question-${i}`}>Additional Question {i + 1}</label>
                                <button type="button" onClick={() => removeQuestion(i)} className="mr-1 cursor-pointer text-slate-500 hover:text-red-600" title={`Remove Question ${i + 1}`}>✕</button>
                            </div>
                        )}
                    >
                        <input
                            id={`additional-question-${i}`}
                            type="text"
                            value={q}
                            placeholder={`Additional Question ${i + 1}`}
                            className={inputStyle}
                            onBlur={() => markAdditionalQuestionTouched(i)}
                            onChange={(e) => {
                                const newQuestions = [...additionalQuestions];
                                newQuestions[i] = e.target.value;
                                setAdditionalQuestions(newQuestions);
                            }}
                        />
                    </FormField>
                ))
            }
            <button type="button" onClick={() => addQuestion()} className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">+ Add Additional Question</button>

            <div className="flex flex-col gap-1">
                <label htmlFor="job-skills">Skills</label>
                <Skills id="job-skills" onChange={(e) => setSkills(e.target.value)} skills={skills} />
            </div>

            {isModal ? (
                <div className="flex gap-4 justify-end pt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            ) : (
                <button type="submit" disabled={saving} className="mt-4 cursor-pointer rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700 disabled:opacity-50">
                    {saving ? "Saving..." : (creating ? "Create Job" : "Update Job")}
                </button>
            )}
        </form >
    )
}

export default JobForm;