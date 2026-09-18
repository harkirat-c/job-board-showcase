function StarRating({
    value = 0,
    max = 5,
    onChange,
    size = 'md',
    className = '',
    readOnly = false,
    showValue = false
}) {
    const starSize = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
    }[size] || 'h-5 w-5';

    const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;

    const Star = ({ filled }) => (
        <svg viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={starSize} aria-hidden="true">
            <path d="M10 1.5l2.9 5.88 6.5.94-4.7 4.58 1.11 6.48L10 16.18l-5.81 3.05 1.11-6.48-4.7-4.58 6.5-.94L10 1.5z" />
        </svg>
    );

    if (readOnly || !onChange) {
        return (
            <div className={`inline-flex items-center gap-1 text-amber-400 ${className}`.trim()} aria-label={`${safeValue} out of ${max} stars`}>
                {Array.from({ length: max }, (_, index) => (
                    <Star key={index} filled={index < safeValue} />
                ))}
                {showValue && (
                    <span className="ml-1 text-sm text-slate-500">{safeValue.toFixed(1)}/5</span>
                )}
            </div>
        );
    }

    return (
        <div className={`inline-flex items-center gap-1 ${className}`.trim()} role="radiogroup" aria-label="Rating">
            {Array.from({ length: max }, (_, index) => {
                const starValue = index + 1;
                const active = starValue <= safeValue;

                return (
                    <button
                        key={starValue}
                        type="button"
                        onClick={() => onChange(starValue)}
                        className={`cursor-pointer text-amber-400 transition hover:scale-105 ${active ? '' : 'opacity-40 hover:opacity-100'}`}
                        aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
                        aria-pressed={active}
                    >
                        <Star filled={active} />
                    </button>
                );
            })}
        </div>
    );
}

export default StarRating;