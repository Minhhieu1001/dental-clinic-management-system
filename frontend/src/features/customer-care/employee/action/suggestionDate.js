// Compare calendar dates in Vietnam, independent of the browser's time zone.
export function getSuggestionDateLabel(suggestion, now = new Date()) {
    if (suggestion.type === 'TREATMENT_PROGRESS') return 'Chờ thực hiện';
    if (!['BIRTHDAY', 'DEBT', 'FOLLOW_UP'].includes(suggestion.type) || !suggestion.suggestedDate) return '';

    const raw = suggestion.suggestedDate;
    const date = Array.isArray(raw)
        ? `${raw[0]}-${String(raw[1]).padStart(2, '0')}-${String(raw[2]).padStart(2, '0')}`
        : String(raw).split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    const value = (type) => parts.find((part) => part.type === type).value;
    const today = `${value('year')}-${value('month')}-${value('day')}`;
    return date < today ? 'Đã qua' : date > today ? 'Chưa đến' : 'Hôm nay';
}
