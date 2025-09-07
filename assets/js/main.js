import * as bootstrap from "bootstrap";
// import './map';
import {
  fetchSpatialData,
  fetchAttributeData,
  fetchAdminLevelData,
  getBBox,
  spatialAttributeMerge,
  fetchProducts
} from "./datahandler";
import { updateMap } from "./map";

// CONFIGURATION
window.AppConfig = {
  product_id: null,
  product_level: null,
  extents: null,
  extent_level: null,
  derived_extent_level: null,
};

// LEVEL MAPPING
const levelMap = {
    0: "Country",
    1: "Province",
    2: "District",
    3: "DSD",
    4: "GND",
    5: "50K_Tile"
};

// UI ELEMENTS
// const adminLvlSelector = document.getElementById("admin-level-selector");
const tabContent = document.getElementById("productTabContent");
const topicsList = document.querySelector("#topics-list"); // UL element


// UI FUNCTIONS

function getSelectedExtentTab() {
  const activeTab = document.querySelector("#extentTab .nav-link.active");
  const selectedTabId = activeTab?.getAttribute("data-bs-target");

  if (selectedTabId) {
    return selectedTabId;
  }

  return null;
}

function getAdminLevel() {
  return adminLvlSelector.value;
}

function showLoading() {
  document.getElementById("loading-overlay").classList.remove("d-none");
}

function hideLoading() {
  document.getElementById("loading-overlay").classList.add("d-none");
}


async function fetchData() {
  showLoading();

  const derivedLevel = getDerivedLevel();
  window.AppConfig.derived_extent_level = Number(derivedLevel.lvl_number);

  try {
    
    let payload = {
      product_id: window.AppConfig.product_id,
      product_level: window.AppConfig.derived_extent_level || window.AppConfig.product_level,
      extents: window.AppConfig.extents,
      extent_level: window.AppConfig.extent_level, 
    };

    // --- fetch spatial data ---//
    const spatialdata = await fetchSpatialData(payload);
    updateMap(spatialdata);

    // --- fetch attribute data ---//
    const attributedata = await fetchAttributeData(payload);
    const mergedData = spatialAttributeMerge(spatialdata, attributedata);
    updateMap(mergedData);

  } catch (error) {
    console.log("Error fetching data:", error);
    return false;
  }

  hideLoading();
  return true;
}

async function populateCategories(){
  
  const data = await fetchProducts();
  
  // category tabs
  data.categories.forEach((category, index) => {
    const tabId = `tab-${category.name.toLowerCase()}`;
    const activeClass = index === 0 ? "active" : "";

    topicsList.innerHTML += `
      <li class="nav-item" title="${category.name}">
        <a href="${category.url}"
          class="nav-link d-flex justify-content-between align-items-center ${activeClass}">
          <span class="item-label">
            <i class="${category.icon} me-2 d-inline-block"></i>
            <span class="d-inline-block">${category.name}</span>
          </span>
          <!--span class="badge bg-secondary">${category.count}</span-->
        </a>
      </li>
    `;


    tabContent.innerHTML += `
      <div class="tab-pane fade ${index === 0 ? "show active" : ""}"
           id="${tabId}" role="tabpanel" aria-labelledby="${tabId}-tab">
        <div class="row g-3" id="dataset-list-${category.name.toLowerCase()}"></div>
      </div>
    `;
  });
}

async function populateProducts() {
  const data = await fetchProducts();
  if (!data?.datasets) return;

  const fragmentMap = {}; // store fragments per tag

  // --- helpers ---
  const renderTags = tags =>
    tags.map(t => `<span class="badge bg-secondary">${t}</span>`).join("");

  const renderLevels = levels =>
    levels
      .sort((a, b) => b - a)
      .map(
        lvl =>
          `<li><a class="dropdown-item" href="#" data-level="${lvl}">
            ${levelMap[lvl] || `Level ${lvl}`}
          </a></li>`
      )
      .join("");

  const renderDatasetCard = dataset => {
    const sortedLevels = [...dataset.level].sort((a, b) => b - a);
    const defaultLevel = sortedLevels[0];
    const defaultLabel = levelMap[defaultLevel] || "";
    const dropdownItems = renderLevels(sortedLevels);
    const tagsHtml = renderTags(dataset.tags);

    return `
      <div class="p-0">
        <div class="form-check border p-3 pt-1 pb-1 mx-0 h-100 rounded-1 shadow-sm">
          <input class="form-check-input d-none" type="radio"
            name="dataset-${dataset.tags[0].toLowerCase()}"
            id="${dataset.id}" value="${dataset.id}"
            productaoitype="undefined"
            productlevel="${dataset.level.join(",")}">
          
          <label class="form-check-label p-1" for="${dataset.id}">
            <strong>${dataset.name}</strong><br>
            
            <div class="mt-1 mb-1 small text-muted dataset-meta">
              <span title="Source">
                <i class="bi bi-globe"></i>
                <a href="${dataset.sourceLink}" target="_blank" class="text-decoration-none">${dataset.source}</a>
              </span>
              <span class="ms-3" title="Date added">
                <i class="bi bi-calendar2-event"></i> ${dataset.dateAdded}
              </span>
              <span class="ms-3" title="Dataset level">
                <i class="bi bi-geo-alt"></i> ${defaultLabel}
              </span>
              <span class="ms-3" title="Tags">
                <i class="bi bi-tags"></i>
                ${tagsHtml}
              </span>
            </div>

            <small class="text-muted">${dataset.description}</small>
            
            <div class="d-flex justify-content-start align-items-center mt-3">
              <button data-action="preview" data-id="${dataset.id}" class="btn btn-light border-secondary btn-xs pb-0 pt-0 me-3">Preview</button>
              <button data-action="shapefile" data-id="${dataset.id}" class="btn btn-light border-secondary btn-xs pb-0 pt-0 me-3">ShapeFile</button>
              <button data-action="geojson" data-id="${dataset.id}" class="btn btn-light border-secondary btn-xs pb-0 pt-0 me-3">GeoJSON</button>
              <button data-action="wkt" data-id="${dataset.id}" class="btn btn-light border-secondary btn-xs pb-0 pt-0 me-3">WKT</button>
              <button data-action="wkb" data-id="${dataset.id}" class="btn btn-light border-secondary btn-xs pb-0 pt-0 me-3">WKB</button>
              <button data-action="pgsql" data-id="${dataset.id}" class="btn btn-light border-secondary btn-xs pb-0 pt-0 me-3">PGSQL</button>

              <div class="d-flex btn btn-light rounded-1 btn-xs p-0 px-1 border-secondary ms-2" title="Aggregation level">
                <span class="form-label m-0 p-0 text-muted">Aggr</span>
                <div class="derivedLevel d-flex align-items-center mx-0">
                  <a href="#" class="btn btn-xs pb-0 pt-0 dropdown-toggle"
                     id="derive-${dataset.id}" data-bs-toggle="dropdown" aria-expanded="false"
                     data-selected-level="${defaultLevel}">
                    ${defaultLabel}
                  </a>
                  <ul class="dropdown-menu border-secondary rounded-1" aria-labelledby="derive-${dataset.id}">
                    ${dropdownItems}
                  </ul>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>
    `;
  };

  // --- build DOM ---
  data.datasets.forEach(dataset => {
    dataset.tags.forEach(tag => {
      const tagId = `dataset-list-${tag.toLowerCase()}`;
      const listContainer = document.getElementById(tagId);
      if (!listContainer) return;

      if (!fragmentMap[tagId]) fragmentMap[tagId] = document.createDocumentFragment();

      const wrapper = document.createElement("div");
      wrapper.innerHTML = renderDatasetCard(dataset);
      fragmentMap[tagId].appendChild(wrapper.firstElementChild);
    });
  });

  // append in one pass
  Object.entries(fragmentMap).forEach(([tagId, fragment]) => {
    document.getElementById(tagId).appendChild(fragment);
  });

  // --- event delegation for buttons ---
  document.body.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");
    if (btn) {
      const { action, id } = btn.dataset;
      console.log("btn press", action);
      switch (action) {
        case "preview": previewOnMap(id); break;
        case "shapefile": dlShapefile(id); break;
        case "geojson": dlJson(id); break;
        case "wkt": dlWKT(id); break;
        case "wkb": dlWKB(id); break;
        case "pgsql": dlPGSLQ(id); break;
      }
      return;
    }

    // dropdown item click
    const item = e.target.closest(".dropdown-item");
    if (item) {
      e.preventDefault();
      const btn = item.closest(".derivedLevel").querySelector(".dropdown-toggle");
      btn.textContent = item.textContent;
      btn.dataset.selectedLevel = item.dataset.level;
    }
  });
}

async function previewOnMap(datasetID){

    const payload = {product_id: datasetID};
    const spatialdata = await fetchSpatialData(payload);
    updateMap(spatialdata);

}

function dlShapefile(datasetID){

}

function dlJson(datasetID) {

}

function dlWKT(datasetID){

}

function dlWKB(datasetID){

}

function dlPGSLQ(datasetID){

}


function updateProductConfig(){
  
  const prod = getSelectedProduct();
  window.AppConfig.product_id = prod[0];
  window.AppConfig.product_type = prod[1];
  window.AppConfig.product_level = prod[2]; 

  if (window.AppConfig.product_id){
    document.getElementById("product-selecter-next").classList.remove("disabled");
  } else {
    document.getElementById("product-selecter-next").classList.add("disabled");
  }

  document.getElementById("admin-level-1").disabled = false;
  if (parseInt(window.AppConfig.product_level, 10) === 4) {
    document.getElementById("admin-level-1").disabled = true;
  }

  // console.log(`Product selected: ${window.AppConfig.product_id} ${window.AppConfig.product_type} ${window.AppConfig.product_level}`);
}

function updateExtentConfig() {
  
  const selectedExtentTab = getSelectedExtentTab();
  const selectedValue = getAdminLevel();

  window.AppConfig.extent_level = parseInt(selectedValue, 10);
  // switch (window.AppConfig.extent_level) {
  //   case 1:
  //     window.AppConfig.extent.id = "poly_province";
  //     break;

  //   case 2:
  //     window.AppConfig.extent.id = "poly_district";
  //     break;

  //   case 3:
  //     window.AppConfig.extent.id = "poly_dsd";
  //     break;

  //   case 4:
  //     window.AppConfig.extent.id = "poly_gnd";
  //     break;

  //   case 5:
  //     window.AppConfig.extent.id = "poly_50k";
  //     break;
  // }

  if (selectedExtentTab === "#admin-boundary") {
    if (["1", "2", "3"].includes(selectedValue)) {
      var checked = Array.from(
        document.querySelectorAll(
          '#admin-selector-dropdown input[type="checkbox"]:checked',
        ),
      ).map((cb) => cb.value);
      window.AppConfig.extents = checked;
    } else if (["4"].includes(selectedValue)) {
      var checked = Array.from(
        document.querySelectorAll(
          '#admin-selector-dropdown2 input[type="checkbox"]:checked',
        ),
      ).map((cb) => cb.value);
      window.AppConfig.extents = checked;
    }
  } else if (selectedExtentTab === "#tile-number") {
    var checked = Array.from(
      document.querySelectorAll(
        '#tile-selector-dropdown input[type="checkbox"]:checked',
      ),
    ).map((cb) => cb.value);

    
    window.AppConfig.extents = checked;
    window.AppConfig.extent_level = 5;
  }
  
  if (window.AppConfig.extents.length > 0) {
    document.getElementById("extent-selecter-next").classList.remove("disabled");
  } else {
    document.getElementById("extent-selecter-next").classList.add("disabled");
  }
  
}

function getKeyByValue(obj, value) {
  return Object.keys(obj).find(key => obj[key] === value);
}

function getDerivedLevel() {

  const derivedLevel = document.getElementById(`derive-${getSelectedProduct()[0]}`).innerText.trim();
  if (!derivedLevel) {
    console.log("No derived level selected");
    return {
      lvl_name: null,
      lvl_number: null
    };
  }

  return {
    lvl_name: derivedLevel,
    lvl_number: getKeyByValue(levelMap, derivedLevel)
  };
}



// EVENTS LISTENERS

document.addEventListener("DOMContentLoaded", async () => {
  showLoading();

  await populateCategories();
  await populateProducts();

  hideLoading();
});


