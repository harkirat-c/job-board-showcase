export function formatTimeAgo(value) {
    if (!value) return '';

    const dateValue = typeof value === 'object' && value.$date ? value.$date : value;
    const timestamp = new Date(dateValue).getTime();
    if (Number.isNaN(timestamp)) return '';

    const secondsDiff = Math.floor((timestamp - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    const intervals = [
        ['year', 60 * 60 * 24 * 365],
        ['month', 60 * 60 * 24 * 30],
        ['week', 60 * 60 * 24 * 7],
        ['day', 60 * 60 * 24],
        ['hour', 60 * 60],
        ['minute', 60],
        ['second', 1]
    ];

    for (const [unit, seconds] of intervals) {
        if (Math.abs(secondsDiff) >= seconds || unit === 'second') {
            return rtf.format(Math.trunc(secondsDiff / seconds), unit);
        }
    }

    return '';
}
