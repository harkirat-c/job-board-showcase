import { useState } from 'react';
import StarRating from '../StarRating';

function ReviewCard({
    reviewerName,
    avatarSrc,
    avatarAlt = 'Reviewer avatar',
    rating = 0,
    comment,
    truncateAt = 100,
    className = ''
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const safeComment = typeof comment === 'string' ? comment : '';
    const shouldTruncate = safeComment.length > truncateAt;
    const displayedComment =
        shouldTruncate && !isExpanded
            ? `${safeComment.slice(0, truncateAt).trimEnd()}...`
            : safeComment;

    return (
        <article className={`flex items-start gap-3 ${className}`.trim()}>
            {avatarSrc ? (
                <img
                    src={avatarSrc}
                    alt={avatarAlt}
                    className="h-14 w-14 shrink-0 rounded-full border border-violet-200 bg-violet-50 object-cover"
                />
            ) : (
                <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-lg font-semibold text-violet-300"
                    role="img"
                >
                    {avatarAlt?.[0]?.toUpperCase() ?? '?'}
                </div>
            )}

            <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">{reviewerName}</h3>
                <StarRating value={rating} readOnly size="sm" className="mt-1" />
                {comment && (
                    <>
                        <p className="mt-2 whitespace-pre-line text-sm leading-5 text-slate-700">
                            {displayedComment}
                        </p>

                        {shouldTruncate && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded((prev) => !prev)}
                                aria-expanded={isExpanded}
                                className="mt-1 text-sm font-medium text-violet-700 transition hover:text-violet-900"
                            >
                                {isExpanded ? 'See less' : 'See more'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </article>
    );
}

export default ReviewCard;
