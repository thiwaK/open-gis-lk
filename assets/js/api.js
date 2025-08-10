import {isValidGeoJSON, isValidJSON} from './dataloader';

let dataURL = new URL(`https://opengislk.alwaysdata.net/getData`);
let attributeDataURL = new URL(`https://opengislk.alwaysdata.net/getAttributeData`);

function joinData(geojson, csvData, key = 'id') {
  const csvLookup = {};

  // Build a lookup table
  csvData.forEach(row => {
    csvLookup[row[key]] = row;
  });

  // Inject CSV attributes into GeoJSON
  geojson.features.forEach(feature => {
    const id = feature.properties[key];
    if (csvLookup[id]) {
      feature.properties = {
        ...feature.properties,
        ...csvLookup[id]
      };
    }
  });

  return geojson;
}

async function fetchAttr_(datasetId) {

    const url = "https://opengislk.alwaysdata.net/getAttributeData"
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Accept", "*/*");
        xhr.setRequestHeader("Accept-Language", "en-US,en;q=0.5");
        xhr.setRequestHeader("Content-Type", "application/json");  // JSON content type

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    reject(xhr.status);
                }
            }
        };

        xhr.onerror = () => reject(xhr.statusText);

        const data = JSON.stringify({ id: datasetId });
        xhr.send(data);
    });
}

const DB_NAME = 'OpenGISLK';
const DB_VERSION = 3;
const STORE_NAME = 'cache';

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

async function getCache(url) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const recExists = await recordExists(store, url);
    if (!recExists){
        return null;
    }

    return new Promise((resolve, reject) => {
        const getRequest = store.get(url);
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

async function setCache(url, content) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const data = {
        url,
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

async function fetchNow(url) {

    const cached = await getCache(url.toString());
    if (cached != null){
        return cached;
    }

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {

                    setCache(url.toString(), xhr.responseText);
                    resolve(xhr.responseText);
                } else {
                    reject(xhr.status);
                }
            }
        };

        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
    });
}

function postNow(url, data) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);

        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    reject(xhr.status);
                }
            }
        };

        xhr.onerror = () => reject(xhr.statusText);
        xhr.send(JSON.stringify(data));
    });
}

async function fetchAttr(payload){
    // response = await postNow(dataURL, payload);
    // return response;

    const url = new URL(attributeDataURL.toString());
    Object.entries(payload).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const response = await fetchNow(url);
    return response;
}

async function fetchAdmin(payload){
    // response = await postNow(dataURL, payload);
    // return response;

    const url = new URL(dataURL.toString());
    Object.entries(payload).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    let response = await fetchNow(url);
    
    if (!isValidJSON(response)){
        console.log("invalidJSON");
        return;
    }
    response = JSON.parse(response);

    // if (!isValidGeoJSON(response)) {
    //     console.log("invalidGeoJSON");
    //     return;
    // }
    return response;
}

export {fetchAdmin, fetchAttr};
