const DB_NAME = 'OpenGISLK';
const STORE_NAME = 'cache';
const DB_VERSION = 3;

async function openDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            alert("Sorry! Your browser does not support IndexedDB");
            return reject("No IndexedDB support");
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "url" });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject("IndexedDB error: " + event.target.errorCode);
        };
    });
}

async function recordExists(store, key) {
    return new Promise((resolve, reject) => {
        if (typeof key !== 'string') {
            // console.error('Invalid IndexedDB key:', key);
            return resolve(false);
        }

        const request = store.get(key);
        request.onsuccess = () => {
            resolve(request.result !== undefined);
        };
        request.onerror = () => {
            // console.error("Error checking record existence:", request.error);
            resolve(false);
        };
    });
}

async function getCache(key) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const recExists = await recordExists(store, key);
    if (!recExists){
        return null;
    }

    // this is only for dev
    return null;

    return new Promise((resolve, reject) => {
        const getRequest = store.get(key);
        const expTime = 7 * 24 * 60 * 60 * 1000; // 1 week

        getRequest.onsuccess = () => {
            const result = getRequest.result;

            if (result) {
                const age = Date.now() - result.timestamp;
                if (age < expTime) {
                    resolve(result.content);
                } else {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        };

        getRequest.onerror = () => {
            console.error("IndexedDB read error:", getRequest.error);
            resolve(null);
        };
    });
}

async function setCache(key, content) {
    // console.log("setCache", key, content);

    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const data = {
        url:key,
        content,
        timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
        const putRequest = store.put(data);
        putRequest.onsuccess = () => resolve(true);
        putRequest.onerror = () => {
            console.error("IndexedDB write error:", putRequest.error);
            reject(putRequest.error);
        };
    });
}

export {setCache, getCache};