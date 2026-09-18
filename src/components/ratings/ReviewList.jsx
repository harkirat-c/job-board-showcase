import ReviewCard from './ReviewCard';

function ReviewList({ title = 'Reviews', reviews = [], className = '' }) {
    return (
        <section className={`min-w-0 ${className}`.trim()}>
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                <span className="text-xs text-slate-500">{reviews.length} total</span>
            </div>

            <div className="max-h-72 space-y-4 overflow-y-auto pr-2">
                {reviews.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                        No reviews yet.
                    </p>
                ) : (
                    reviews.map((review, index) => (
                        <ReviewCard
                            key={review.id ?? review._id ?? index}
                            reviewerName={review.reviewerName}
                            avatarSrc={review.avatarSrc}
                            avatarAlt={review.avatarAlt}
                            rating={review.rating}
                            comment={review.comment}
                        />
                    ))
                )}
            </div>
        </section>
    );
}

export default ReviewList;
