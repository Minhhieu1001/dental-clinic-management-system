/**
 * Utility functions for date formatting, age calculation and birthday countdowns.
 */

/**
 * Format a date/datetime string or Date object to DD/MM/YYYY
 * @param {string|Date|Array} date
 * @param {string} fallback
 * @returns {string}
 */
export function formatDate(date, fallback = '-') {
    if (!date) return fallback;

    // Handle [YYYY, MM, DD] array from Java LocalDateTime if serialized as array
    if (Array.isArray(date)) {
        const [y, m, d] = date;
        return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }

    // Handle ISO string or "YYYY-MM-DD"
    if (typeof date === 'string') {
        const clean = date.split('T')[0];
        if (clean.includes('-')) {
            const parts = clean.split('-');
            if (parts.length === 3) {
                return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
            }
        }
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Format a datetime string to DD/MM/YYYY HH:mm
 * @param {string|Date|Array} date
 * @param {string} fallback
 * @returns {string}
 */
export function formatDateTime(date, fallback = '-') {
    if (!date) return fallback;

    // Handle [YYYY, MM, DD, HH, mm] array from Java LocalDateTime
    if (Array.isArray(date)) {
        const [y, m, d, hh = 0, mm = 0] = date;
        return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Calculate age from date of birth
 * @param {string|Date|Array} dob
 * @returns {number|null}
 */
export function calculateAge(dob) {
    if (!dob) return null;
    let birthDate;
    if (Array.isArray(dob)) {
        birthDate = new Date(dob[0], dob[1] - 1, dob[2]);
    } else {
        birthDate = new Date(dob);
    }
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age > 0 ? age : 0;
}

/**
 * Calculate days remaining until next birthday
 * @param {string|Date|Array} dob
 * @returns {number|null}
 */
export function calculateDaysUntilBirthday(dob) {
    if (!dob) return null;
    let birthDate;
    if (Array.isArray(dob)) {
        birthDate = new Date(dob[0], dob[1] - 1, dob[2]);
    } else {
        birthDate = new Date(dob);
    }
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextBday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    nextBday.setHours(0, 0, 0, 0);

    if (nextBday < today) {
        nextBday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
