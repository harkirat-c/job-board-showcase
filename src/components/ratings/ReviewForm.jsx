import StarRating from '../StarRating';

function ReviewForm({
    heading = 'Tell Us About Your Experience',
    rating,
    onRatingChange,
    comment,
    onCommentChange,
    onSubmit,
    errorMessage = '',
    submitLabel = 'Submit',
    placeholder = 'Write a review here...',
    disabled = false,
    className = ''
}) {
    return (
        <section className={`flex min-w-0 flex-col gap-3 ${className}`.trim()}>
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">{heading}</h2>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <StarRating value={rating} onChange={onRatingChange} />

                    <button
                        type="submit"
                        disabled={disabled}
                        className="rounded-full bg-slate-800 px-6 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitLabel}
                    </button>
                </div>

                <textarea
                    value={comment}
                    onChange={(e) => onCommentChange?.(e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    disabled={disabled}
                />

                {errorMessage && (
                    <p className="text-sm text-red-600">{errorMessage}</p>
                )}
            </form>
        </section>
    );
}

export default ReviewForm;
