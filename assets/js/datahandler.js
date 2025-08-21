import { fetchAdmin, fetchAttr } from "./api";

// exposed admin level data fetch endpoint
async function fetchAdminLevelData(admin_lvl) {
  let payload = {
    product_id: "attr_gnd",
    product_level: 4,
    extents: ["*"],
    extent_level: 4
  };

  if (admin_lvl === 3) {
    payload = {
      product_id: "attr_dsd",
      product_level: parseInt(3, 10),
      extents: ["*"],
      extent_level: 3
    };
  } else if (admin_lvl === 2) {
    payload = {
      product_id: "attr_dist",
      product_level: parseInt(2, 10),
      extents: ["*"],
      extent_level: 2
    };
  } else if (admin_lvl === 1) {
    payload = {
      product_id: "attr_prov",
      product_level: parseInt(1, 10),
      extents: ["*"],
      extent_level: 1
    };
  }

  let data = await fetchAttr(payload);
  return data;
}

async function fetchProducts() {
  const payload = {
    product_id: "products",
    product_level: 1,
    extents: ["*"],
    extent_level: 1
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
  return res;
}

// exposed geo data fetch endpoint
async function fetchSpatialData(spatialPayload) {
  // if (!spatialPayload) {
  //   spatialPayload = getSpatialPayload();
  // }
  const res = await fetchAdmin(spatialPayload);
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

function spatialAttributeMerge(spatialDataset, attributeDataset) {
  if (!spatialDataset || !attributeDataset) {
    return null;
  }

  const extentLevel = parseInt(window.AppConfig.derived_extent_level || window.AppConfig.product_level, 10);

  for (let i = 0; i < spatialDataset.features.length; i++) {
    const props = spatialDataset.features[i].properties;
    let match;

    if (extentLevel === 1) {
      match = attributeDataset.find(item => Number(item.prov_code) === Number(props.prov_c));
      // console.log("Matching prov_code:", match);
    } 
    else if (extentLevel === 2) {
      match = attributeDataset.find(item => Number(item.dist_code) === Number(props.dist_c));
      // console.log("Matching dist_code:", match);
    } 
    else if (extentLevel === 3) {
      match = attributeDataset.find(item => Number(item.dsd_code) === Number(props.dsd_c));
      // console.log("Matching dsd_code:", match);
    } 
    else if (extentLevel === 4) {
      match = attributeDataset.find(item => Number(item.gnd_code) === Number(props.gnd_c));
      // console.log("Matching gnd_code:", match);
    }

    if (match) {
      Object.assign(props, match);
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
