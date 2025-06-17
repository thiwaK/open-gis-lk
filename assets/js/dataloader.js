import {fetchAdmin} from './api';
import {hideLoading, showLoading, updateMap} from './uifunctions';

async function loadAndParseCSV(url, lang, code, name, idKey = null, idList = null) {

    const csvText = await fetchData(url);

    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            quoteChar: "'",
            complete: async function (results) {
                let rows;

                if (idKey != null && idList != null) {
                    results.data = results.data?.filter(record => record[code] && idList.includes(String(record[idKey])));
                }

                if (lang === 'en' && Array.isArray(results?.data)) {
                    rows = results.data.map(record => ({
                        code: record[code],
                        name_en: record[name]
                    }));
                }
                resolve(rows);
            },
            error: function (error) {

                reject(error);
            }
        });
    });
}

async function fetchData(url) {
    showLoading();

    const cached = localStorage.getItem(url);
    const oneDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    let csvText;

    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;

            if (age < oneDay) {
                csvText = parsed.content;
            } else {
                // expired — fetch new
                const response = await fetch(url);
                csvText = await response.text();
                localStorage.setItem(url, JSON.stringify({
                    content: csvText,
                    timestamp: Date.now()
                }));
            }
        } catch (e) {
            // corrupted or non-JSON — fallback to fresh fetch
            const response = await fetch(url);
            csvText = await response.text();
            localStorage.setItem(url, JSON.stringify({
                content: csvText,
                timestamp: Date.now()
            }));
        }
    } else {
        // no cached data — fetch
        const response = await fetch(url);
        csvText = await response.text();
        localStorage.setItem(url, JSON.stringify({
            content: csvText,
            timestamp: Date.now()
        }));
    }

    hideLoading();
    return csvText;
}

function isValidGeoJSON(geojson) {
    if (typeof geojson !== 'object' || geojson === null) return false;

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


export {loadAndParseCSV, fetchData, isValidGeoJSON};