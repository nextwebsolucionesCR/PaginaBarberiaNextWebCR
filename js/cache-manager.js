
/**
 * APP CACHE MANAGER
 * Handles localStorage caching with expiration.
 */

const AppCache = {
    /**
     * Get data from cache
     * @param {string} key - Storage key
     * @param {number} maxAgeMinutes - Cache duration in minutes
     * @returns {any|null} Data or null if expired/missing
     */
    get: (key, maxAgeMinutes = 15) => {
        try {
            const record = JSON.parse(localStorage.getItem(key));
            if (!record) return null;

            const now = new Date().getTime();
            const ageMs = now - record.timestamp;
            const maxAgeMs = maxAgeMinutes * 60 * 1000;

            if (ageMs > maxAgeMs) {
                // Expired
                localStorage.removeItem(key);
                return null;
            }

            return record.data;
        } catch (e) {
            console.warn('Cache parse error', e);
            localStorage.removeItem(key);
            return null;
        }
    },

    /**
     * Save data to cache
     * @param {string} key 
     * @param {any} data 
     */
    set: (key, data) => {
        try {
            const record = {
                timestamp: new Date().getTime(),
                data: data
            };
            localStorage.setItem(key, JSON.stringify(record));
        } catch (e) {
            console.warn('Cache write error', e);
        }
    },

    /**
     * Clear specific cache key
     * @param {string} key 
     */
    clear: (key) => {
        localStorage.removeItem(key);
    },

    /**
     * Clear all app cache
     */
    clearAll: () => {
        localStorage.clear(); // Or filter by prefix if sharing domain
    }
};

window.AppCache = AppCache;
