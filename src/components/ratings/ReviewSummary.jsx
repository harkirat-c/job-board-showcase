import StarRating from '../StarRating';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function resolveImageUrl(url) {
    if (!url) return '';
    return /^https?:\/\//i.test(url) ? url : `${API_BASE}${url}`;
}

function ReviewSummary({
    title,
    description,
    avatarSrc,
    avatarAlt,
    averageRating = null,
    className = ''
}) {
    const resolvedAvatarSrc = resolveImageUrl(avatarSrc);


    return (
        <section className={`flex items-start gap-4 ${className}`.trim()}>
            {resolvedAvatarSrc ? (
                <img
                    src={resolvedAvatarSrc}
                    alt={avatarAlt}
                    className="h-20 w-20 shrink-0 rounded-full border border-violet-200 bg-violet-50 object-cover"
                />
            ) : (
                <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-2xl font-semibold text-violet-300"
                    role="img"
                    aria-label={avatarAlt}
                >
                    {avatarAlt?.trim()?.[0]?.toUpperCase() ?? '?'}
                </div>
            )}

            <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                {averageRating !== null && (
                    <div className="mt-2 flex items-center gap-2">
                        <StarRating value={Math.round(averageRating)} readOnly size="sm" />
                        <span className="text-sm text-slate-600">{averageRating.toFixed(1)}/5</span>
                    </div>
                )}
                {description && (
                    <p
                        className="mt-1 text-sm leading-5 text-slate-600"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                        title={description}
                    >
                        {description}
                    </p>
                )}
            </div>
        </section>
    );
}

export default ReviewSummary;
