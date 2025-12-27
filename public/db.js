// IndexedDB Helper for SMTP Tester
// Manages persistent storage for test history, settings, and preferences

const DB_NAME = 'SMTPTesterDB';
const DB_VERSION = 1;
const STORES = {
    HISTORY: 'testHistory',
    SETTINGS: 'settings',
    PREFERENCES: 'preferences'
};

class SMTPDatabase {
    constructor() {
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create test history store
                if (!db.objectStoreNames.contains(STORES.HISTORY)) {
                    const historyStore = db.createObjectStore(STORES.HISTORY, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                    historyStore.createIndex('host', 'host', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                }

                // Create preferences store
                if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
                    db.createObjectStore(STORES.PREFERENCES, { keyPath: 'key' });
                }
            };
        });
    }

    // Save test result to history
    async saveTest(testData) {
        const transaction = this.db.transaction([STORES.HISTORY], 'readwrite');
        const store = transaction.objectStore(STORES.HISTORY);

        const record = {
            ...testData,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(record);
            request.onsuccess = () => {
                this.cleanupOldHistory(); // Keep only last 50 records
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Get test history (last N records)
    async getHistory(limit = 50) {
        const transaction = this.db.transaction([STORES.HISTORY], 'readonly');
        const store = transaction.objectStore(STORES.HISTORY);
        const index = store.index('timestamp');

        return new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev'); // Reverse order (newest first)
            const results = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Clean up old history (keep only last 50)
    async cleanupOldHistory() {
        const transaction = this.db.transaction([STORES.HISTORY], 'readwrite');
        const store = transaction.objectStore(STORES.HISTORY);
        const index = store.index('timestamp');

        return new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            let count = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    count++;
                    if (count > 50) {
                        cursor.delete();
                    }
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Save user settings (last used configuration)
    async saveSettings(settings) {
        const transaction = this.db.transaction([STORES.SETTINGS], 'readwrite');
        const store = transaction.objectStore(STORES.SETTINGS);

        const record = {
            key: 'lastConfig',
            ...settings,
            updatedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get user settings
    async getSettings() {
        const transaction = this.db.transaction([STORES.SETTINGS], 'readonly');
        const store = transaction.objectStore(STORES.SETTINGS);

        return new Promise((resolve, reject) => {
            const request = store.get('lastConfig');
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    // Save preference (e.g., theme)
    async savePreference(key, value) {
        const transaction = this.db.transaction([STORES.PREFERENCES], 'readwrite');
        const store = transaction.objectStore(STORES.PREFERENCES);

        const record = { key, value };

        return new Promise((resolve, reject) => {
            const request = store.put(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get preference
    async getPreference(key) {
        const transaction = this.db.transaction([STORES.PREFERENCES], 'readonly');
        const store = transaction.objectStore(STORES.PREFERENCES);

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result ? request.result.value : null);
            request.onerror = () => reject(request.error);
        });
    }

    // Clear all history
    async clearHistory() {
        const transaction = this.db.transaction([STORES.HISTORY], 'readwrite');
        const store = transaction.objectStore(STORES.HISTORY);

        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Create singleton instance
const db = new SMTPDatabase();

// Initialize on load
db.init().catch(err => console.error('Failed to initialize database:', err));

// Export for use in other scripts
window.smtpDB = db;
