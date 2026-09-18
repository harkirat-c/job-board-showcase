import ReviewSummary from './ReviewSummary';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import { useCallback, useEffect, useState } from 'react';
import { getCurrentUser, getUserRole } from '../../utils/user';

function getApplicantName(applicant) {
    if (typeof applicant?.name === 'string' && applicant.name.trim()) {
        return applicant.name;
    }

    if (applicant?.name?.first || applicant?.name?.last) {
        return `${applicant.name.first ?? ''} ${applicant.name.last ?? ''}`.trim();
    }

    if (applicant?.firstName || applicant?.lastName) {
        return `${applicant.firstName ?? ''} ${applicant.lastName ?? ''}`.trim();
    }

    return 'Anonymous';
}

function formatRatings(ratingsData = []) {
    return ratingsData.map((r) => {
        const applicant = r.applicant;
        const applicantName = getApplicantName(applicant);

        return {
            id: r._id,
            applicantId: r.applicantId,
            reviewerName: applicantName,
            avatarSrc: applicant?.profile || '',
            avatarAlt: applicantName,
            rating: r.rating,
            comment: r.comment,
        };
    });
}

function normalizeId(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        if (typeof value.$oid === 'string') return value.$oid;
        if (typeof value.id === 'string') return value.id;
        if (typeof value._id === 'string') return value._id;
    }
    return String(value);
}

function ReviewSection({
    employerId,
    className = ''
}) {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const [employer, setEmployer] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [averageRating, setAverageRating] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formRating, setFormRating] = useState(4);
    const [formComment, setFormComment] = useState('');

    const fetchRatingsAndAverage = useCallback(async () => {
        const ratingsRes = await fetch(`${API_BASE}/ratings/employer/${employerId}`);
        if (!ratingsRes.ok) throw new Error('Failed to fetch ratings');
        const ratingsData = await ratingsRes.json();

        const avgRes = await fetch(`${API_BASE}/ratings/employer/${employerId}/avg`);
        if (avgRes.ok) {
            const avgData = await avgRes.json();
            setAverageRating(avgData.avgRating);
        } else {
            setAverageRating(null);
        }

        setRatings(formatRatings(ratingsData));
    }, [API_BASE, employerId]);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError('');

                const employerRes = await fetch(`${API_BASE}/employers/${employerId}`);
                if (!employerRes.ok) throw new Error('Failed to fetch employer');
                const employerData = await employerRes.json();
                setEmployer(employerData);

                await fetchRatingsAndAverage();
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message || 'Failed to load ratings');
            } finally {
                setLoading(false);
            }
        }

        if (employerId) {
            fetchData();
        }
    }, [employerId, API_BASE, fetchRatingsAndAverage]);

    useEffect(() => {
        if (!employerId) return;

        const events = new EventSource(`${API_BASE}/events`);

        const onRatingCreated = async (event) => {
            try {
                const payload = JSON.parse(event.data || '{}');
                const payloadEmployerId = normalizeId(payload?.employerId);
                const currentEmployerId = normalizeId(employerId);
                if (payloadEmployerId && currentEmployerId && payloadEmployerId !== currentEmployerId) return;
                await fetchRatingsAndAverage();
            } catch (err) {
                console.error('Failed to process realtime rating event:', err);
            }
        };

        events.addEventListener('rating-created', onRatingCreated);

        return () => {
            events.removeEventListener('rating-created', onRatingCreated);
            events.close();
        };
    }, [API_BASE, employerId, fetchRatingsAndAverage]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setSubmitError('');

        const currentUser = getCurrentUser();
        if (!currentUser?.id) {
            setSubmitError('Please log in to submit a review.');
            return;
        }

        if (getUserRole(currentUser) !== 'applicant') {
            setSubmitError('Only applicants can submit reviews.');
            return;
        }

        const alreadyReviewed = ratings.some((review) => review.applicantId === currentUser.id);
        if (alreadyReviewed) {
            setSubmitError('You have already reviewed this employer.');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch(`${API_BASE}/ratings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employerId,
                    applicantId: currentUser.id,
                    rating: formRating,
                    comment: formComment
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (res.status === 409) {
                    throw new Error('You have already reviewed this employer.');
                }
                throw new Error(errData.message || 'Failed to submit review');
            }

            await res.json();

            await fetchRatingsAndAverage();

            setFormRating(4);
            setFormComment('');
        } catch (err) {
            console.error('Error submitting review:', err);
            setSubmitError(err.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <section className={`w-full rounded-2xl bg-white text-slate-900 shadow-sm ${className}`.trim()}>
                <div className="p-4 text-center md:p-5">
                    <p className="text-slate-600">Loading reviews...</p>
                </div>
            </section>
        );
    }

    if (error && !employer) {
        return (
            <section className={`w-full rounded-2xl bg-white text-slate-900 shadow-sm ${className}`.trim()}>
                <div className="p-4 text-center md:p-5">
                    <p className="text-red-600">{error}</p>
                </div>
            </section>
        );
    }

    return (
        <section className={`w-full rounded-2xl bg-white text-slate-900 shadow-sm ${className}`.trim()}>
            <h1 className="ml-4 pt-4 text-2xl font-bold">About the Employer</h1>
            <div className="grid gap-6 p-4 md:p-5 lg:grid-cols-[minmax(220px,1fr)_minmax(280px,1.2fr)_minmax(260px,1fr)] lg:items-start">
                <ReviewSummary
                    title={employer?.name || 'Employer'}
                    description={employer?.description}
                    avatarSrc={employer?.logo}
                    avatarAlt={employer?.name || 'Employer avatar'}
                    averageRating={averageRating}
                />

                <ReviewForm
                    heading="Tell Us About Your Experience"
                    rating={formRating}
                    onRatingChange={setFormRating}
                    comment={formComment}
                    onCommentChange={setFormComment}
                    onSubmit={handleSubmitReview}
                    errorMessage={submitError}
                    submitLabel="Submit"
                    placeholder="Write a review here..."
                    disabled={submitting}
                />

                <ReviewList title="Reviews" reviews={ratings} />
            </div>
        </section>
    );
}

export default ReviewSection;
