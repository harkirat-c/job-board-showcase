export function formatPhoneNumber(value) {
    const digits = `${value ?? ''}`.replace(/\D/g, '');
    if (!digits) return '';

    const hasCountryCode = digits.startsWith('1') && digits.length > 10;
    const localDigits = hasCountryCode ? digits.slice(1, 11) : digits.slice(0, 10);

    if (hasCountryCode) {
        if (localDigits.length <= 3) {
            return `+1 (${localDigits}`;
        }
        if (localDigits.length <= 6) {
            return `+1 (${localDigits.slice(0, 3)}) ${localDigits.slice(3)}`;
        }
        return `+1 (${localDigits.slice(0, 3)}) ${localDigits.slice(3, 6)}-${localDigits.slice(6)}`;
    }

    if (localDigits.length <= 3) {
        return `(${localDigits}`;
    }
    if (localDigits.length <= 6) {
        return `(${localDigits.slice(0, 3)}) ${localDigits.slice(3)}`;
    }
    return `(${localDigits.slice(0, 3)}) ${localDigits.slice(3, 6)}-${localDigits.slice(6)}`;
}
