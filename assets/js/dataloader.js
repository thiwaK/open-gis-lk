import {fetchAdmin, fetchAttr} from './api';

async function fetchAdminLevelData(admin_lvl){
    
    let payload = {
        id:"attr_gnd",
        level:4,
        aoi:["*"]
    }

    if (admin_lvl === 3) {
        payload = {
            id:"attr_dsd",
            level:parseInt(3, 10),
            aoi:"*"
        }
    }
    else if (admin_lvl === 2) {
        payload = {
            id:"attr_dist",
            level:parseInt(2, 10),
            aoi:"*"
        }
    }
    else if (admin_lvl === 1) {
        payload = {
            id:"attr_prov",
            level:parseInt(1, 10),
            aoi:"*"
        }
    }
    
    let data = await fetchAttr(payload);
    return data;
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


export {fetchData, fetchAdminLevelData};