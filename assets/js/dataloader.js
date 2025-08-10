import {fetchAdmin, fetchAttr} from './api';
import {hideLoading, showLoading, updateMap} from './uifunctions';

async function loadAndParseCSV(url, lang, code, name, idKey = null, idList = null) {

    const csvText = await fetchCSV(url);

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

async function fetchCSV(url) {
    showLoading();

    const cached = localStorage.getItem(url);
    const expTime = 24 * 60 * 60 * 1000 * 7; // 1 week in milliseconds
    let csvText;

    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;

            if (age < expTime) {
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

async function fetchAttributeData() {
    const attributePayload = getAttributePayload();
    const res = await fetchAttr(attributePayload);
    return res;
}

async function fetchSpatialData() {
    const spatialPayload = getSpatialPayload();
    const res = await fetchAdmin(spatialPayload);
    return res;
}

function getBBox(data) {
  const features = data.features;

  if (!Array.isArray(features)) {
    return null;
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  features.forEach(feature => {

    const rings = feature.geometry?.coordinates || [];
    rings.forEach(ring => {
      ring.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    });
  });

  return { xmin: minX, ymin: minY, xmax: maxX, ymax: maxY };
}


async function fetchData() {
    const spatialdata = await fetchSpatialData();
    await updateMap(spatialdata);

    const bbox = getBBox(spatialdata);
    console.log(bbox);

    // await fetchAttributeData(bbox)
}

async function fetchSpatialData__(payload_){
    let payload;
    let qDataset;
    let qDatasetLevelCode;
    let qDatasetLevelName;
    let qCheckResult;

    // if document.config.product.level, result will 
    switch(parseInt(admin_lvl, 10)) {
        case 1:
            qDataset = "data/province.csv";
            qDatasetLevelCode = "prov_code";
            qDatasetLevelName = "prov_name";
            break;
        
        case 2:
            qDataset = "data/district.csv";
            qDatasetLevelCode = "dist_code";
            qDatasetLevelName = "dist_name";
            break;
        
        case 3:
            qDataset = "data/dsd.csv";
            qDatasetLevelCode = "dsd_code";
            qDatasetLevelName = "dsd_name";
            break;
        
        case 4:
            qDataset = "data/gnd.csv";
            qDatasetLevelCode = "admin_code";
            qDatasetLevelName = "gnd_name";
            break;
    }

    switch(parseInt(admin_lvl, 10)) {
        case 1:
            qCheckResult = "prov_code";
            break;
        case 2:
            qCheckResult = "dist_code";
            break;
        case 3:
            qCheckResult = "dsd_code";
            break;
        case 4:
            qCheckResult = "admin_code";
            break;
    }
    
    let result = await loadAndParseCSV(qDataset, 'en', qDatasetLevelCode, qDatasetLevelName, qCheckResult, checked);
    if (document.config.product.type === "name"){
        result = result.map(obj => obj.name_en);
    }else{
        result = result.map(obj => obj.code);
    }

    // use checked. above code make not impact. they can be used to resolve level differences.
    result = checked;
    switch(parseInt(admin_lvl, 10)) {
        case 1:
            payload = {
                level: 1,
                aoi: result,
                id: 'poly_province'
            };
            break;
        
        case 2:
            payload = {
                level: 2,
                aoi: result,
                id: 'poly_district'
            };
            break;
        
        case 3:
            payload = {
                level: 3,
                aoi: result,
                id: 'poly_dsd'
            };
            break;
        
        case 4:
            payload = {
                level: 4,
                aoi: result,
                id: 'poly_gnd'
            };
            break;
    }

    document.config.extent = payload; 
    
    if (document.config.product.level != null){
        payload['level'] = document.config.product.level;
    }
    
    updateMap(payload, parseInt(payload['level'], 10));

}

function getSpatialPayload() {
    /*
    - `aoi` indicate the are of interest or extent.
      aoi is a array contains one or more area codes (aoi always code).

    - `level` indicate the admin level that `aoi` specifies.
      level is always a single integer number.

    - `id` id of the attribute dataset.
    */

    let payload = {
        id:document.config.extent.id,
        level:parseInt(document.config.extent.level, 10),
        aoi:document.config.extent.aoi
    }
    payload['id'] = document.config.product.id;
    return payload;
    
}

function getAttributePayload() {
    /*
    - must use `id` parameter to uniqely identify the attribute dataset
    - `aoi` indicate the are of interest or extent
    - `level` indicate the admin level that `aoi` specifies.
    */
    
    let payload = {
        id:document.config.product.id,
        level:parseInt(document.config.extent.level, 10),
        aoi:document.config.extent.aoi
    }
    return payload;
}

export {loadAndParseCSV, fetchCSV, isValidGeoJSON, isValidJSON, fetchData};