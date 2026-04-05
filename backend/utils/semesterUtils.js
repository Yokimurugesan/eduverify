/**
 * Normalizes semester names to a standard "Semester X" format.
 * Supports "I Semester", "1st Semester", "First Semester", etc.
 * @param {string} sem - The semester string to normalize
 * @returns {string} Normalized string (e.g., "Semester 1")
 */
function normalizeSemester(sem) {
    if (!sem) return "";
    
    // Convert to uppercase and trim
    let s = sem.toUpperCase().trim();

    // Map Roman Numerals to Numbers
    const romanMap = {
        "I": "1", "II": "2", "III": "3", "IV": "4",
        "V": "5", "VI": "6", "VII": "7", "VIII": "8"
    };

    // Check for "I SEMESTER", "II SEMESTER", etc.
    for (const [roman, num] of Object.entries(romanMap)) {
        if (s.startsWith(roman + " ")) {
            return `Semester ${num}`;
        }
    }

    // Check for numerical starts like "1ST", "2ND", "1 "
    const numMatch = s.match(/^(\d+)(ST|ND|RD|TH)?\s*(SEMESTER)?/);
    if (numMatch) {
        return `Semester ${numMatch[1]}`;
    }

    // Direct match for "SEMESTER 1" etc.
    const directMatch = s.match(/SEMESTER\s*(\d+)/);
    if (directMatch) {
        return `Semester ${directMatch[1]}`;
    }

    // Default: return as is (but trimmed)
    return sem.trim();
}

/**
 * Checks if two semester strings are equivalent after normalization.
 */
function areSemestersEqual(sem1, sem2) {
    return normalizeSemester(sem1) === normalizeSemester(sem2);
}

module.exports = {
    normalizeSemester,
    areSemestersEqual
};
