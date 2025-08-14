import {setCache, getCache} from './db';

function isValidJSON(jsonString) {
    try {
        JSON.parse(jsonString);
        return true;
    } catch (e) {
        return false;
    }
}

function isValidGeoJSON(geojson) {

    if (typeof geojson !== 'object' || geojson === null) {
        return false;
    }

    const validTypes = ['Feature', 'FeatureCollection', 'Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'];

    if (!geojson.type || !validTypes.includes(geojson.type)) return false;

    if (geojson.type === 'FeatureCollection') {
        return Array.isArray(geojson.features) && geojson.features.every(f => isValidGeoJSON(f));
    }

    if (geojson.type === 'Feature') {
        return typeof geojson.geometry === 'object' && isValidGeoJSON(geojson.geometry);
    }

    if (geojson.coordinates === undefined) return false;

    return true;
}

async function fetchNow(url) {

    // console.log("fetchNow", url.toString());
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

    let response = await fetchNow(url);
    
    if (!isValidJSON(response)){
        console.log("invalidJSON");
        return;
    }
    response = JSON.parse(response);
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
