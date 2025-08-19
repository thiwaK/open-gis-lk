import { fetchAdmin, fetchAttr } from "./api";

// exposed admin level data fetch endpoint
async function fetchAdminLevelData(admin_lvl) {
  let payload = {
    id: "attr_gnd",
    level: 4,
    aoi: ["*"],
  };

  if (admin_lvl === 3) {
    payload = {
      id: "attr_dsd",
      level: parseInt(3, 10),
      aoi: "*",
    };
  } else if (admin_lvl === 2) {
    payload = {
      id: "attr_dist",
      level: parseInt(2, 10),
      aoi: "*",
    };
  } else if (admin_lvl === 1) {
    payload = {
      id: "attr_prov",
      level: parseInt(1, 10),
      aoi: "*",
    };
  }

  let data = await fetchAttr(payload);
  return data;
}

async function fetchProducts() {
  const payload = {
    id: "products",
    level: 1,
    aoi: ["*"],
  };

  let data = await fetchAttr(payload);
  if (!data) {
    console.error("Invalid product data received");
    return [];
  }

  return data;
}

// exposed attr data fetch endpoint
async function fetchAttributeData(attributePayload) {
  // if (!attributePayload) {
  //   attributePayload = getAttributePayload();
  // }
  const res = await fetchAttr(attributePayload);
  console.log("fetchAttributeData", res);
  return res;
}

// exposed geo data fetch endpoint
async function fetchSpatialData(spatialPayload) {
  // if (!spatialPayload) {
  //   spatialPayload = getSpatialPayload();
  // }
  const res = await fetchAdmin(spatialPayload);
  console.log("fetchSpatialData", res);
  return res;
}

function getBBox(data) {
  const features = data.features;

  if (!Array.isArray(features)) {
    return null;
  }

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  features.forEach((feature) => {
    const rings = feature.geometry?.coordinates || [];
    rings.forEach((ring) => {
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

function getSpatialPayload() {
  /*
    - `aoi` indicate the are of interest or extent.
      aoi is a array contains one or more area codes (aoi always code).

    - `level` indicate the admin level that `aoi` specifies.
      level is always a single integer number.

    - `id` id of the attribute dataset.
    */

  let payload = {
    id: window.AppConfig.product_id,
    level: parseInt(window.AppConfig.extent_level, 10),
    aoi: window.AppConfig.extents,
  };

  return payload;
}

function getAttributePayload() {
  /*
    - must use `id` parameter to uniqely identify the attribute dataset
    - `aoi` indicate the are of interest or extent
    - `level` indicate the admin level that `aoi` specifies.
    */

  let payload = {
    id: window.AppConfig.product_id,
    level: parseInt(window.AppConfig.product_level, 10),
    aoi: window.AppConfig.extents,
  };
  return payload;
}

function spatialAttributeMerge(spatialDataset, attributeDataset) {

  if (!spatialDataset || !attributeDataset) {
    return null;
  }

  let match;
  
  for (var i = 0; i < spatialDataset.features.length; i++) {

    if (parseInt(window.AppConfig.extent_level, 10) == 1) {
      attributeDataset.find(item => {
        if (Number(item.prov_code) === Number(spatialDataset.features[i].properties.prov_c)){
          match = item;
        }
      });
    }
    else if (parseInt(window.AppConfig.extent_level, 10) == 2) {
      attributeDataset.find(item => {
        if (Number(item.dist_code) === Number(spatialDataset.features[i].properties.dist_c)){
          match = item;
        }
      });
    } 
    else if (parseInt(window.AppConfig.extent_level, 10) == 3) {
      attributeDataset.find(item => {
        if (Number(item.dsd_code) === Number(spatialDataset.features[i].properties.dsd_c)){
          match = item;
        }
      });
    } 
    else if (parseInt(window.AppConfig.extent_level, 10) == 4) {
      attributeDataset.find(item => {
        if (Number(item.gnd_code) === Number(spatialDataset.features[i].properties.gnd_c)){
          match = item;
        }
      });
    }
    

    if (match) {
      Object.assign(spatialDataset.features[i].properties, match);
    }

  }

  return spatialDataset;
  
}

export {
  fetchAttributeData,
  fetchSpatialData,
  fetchAdminLevelData,
  getBBox,
  spatialAttributeMerge,
  fetchProducts
};
