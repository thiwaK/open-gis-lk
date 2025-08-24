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
const adminLvlSelector = document.getElementById("admin-level-selector");
const extentSelectorSave = document.getElementById("extent-selecter-save");
const extentSelectorNext = document.getElementById("extent-selecter-next");
const tileSelectorDropdown = document.getElementById("tile-selector-dropdown");
const productSelectorSave = document.getElementById("product-selecter-save");
const productSelectorNext= document.getElementById("product-selecter-next");

const tabList = document.getElementById("productTab");
const tabContent = document.getElementById("productTabContent");
const topicsList = document.querySelector("#topics-list"); // UL element


// UI FUNCTIONS
function getSelectedProduct() {
  const activeTab = document.querySelector("#productTab .nav-link.active");
  const selectedTabId = activeTab?.getAttribute("data-bs-target");

  if (selectedTabId) {
    const tabContent = document.querySelector(`${selectedTabId}`);
    if (tabContent) {
      const selectedInput = tabContent.querySelector(
        'input[type="radio"]:checked',
      );
      if (selectedInput) {
        const selectedValue = selectedInput.value;
        const productAoiType = selectedInput.getAttribute("productaoitype");
        let productlevel = selectedInput.getAttribute("productlevel");
        productlevel = productlevel ? productlevel.trim().split(",").map(Number) : [];
        productlevel = productlevel.sort((a, b) => b - a);
        return [selectedValue, productAoiType, productlevel[0]];
      }
    }
  }

  return null;
}

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

function populateDropdown(elementID, rows) {
  // console.log(`updating ${elementID}`);
  const select = document.getElementById(elementID);
  select.innerHTML = "";

  const li = document.createElement("li");
  const input = document.createElement("input");
  input.type = "text";
  input.id = `${elementID}-search`;
  input.className = "form-control";
  input.placeholder = "Search...";

  li.appendChild(input);
  select.appendChild(li);

  rows.forEach((row) => {
    // console.log(row);
    if (row.code === undefined) {
      return;
    }
    const li = document.createElement("li");
    li.className = "dropdown-item";

    const label = document.createElement("label");
    label.className = "checkbox";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = row.code;

    const text = document.createTextNode(row.name_en);

    label.appendChild(input);
    label.appendChild(text);
    li.appendChild(label);

    select.appendChild(li); // Then add the new one(s)
  });
}

// Geo + Attr data fetch
async function fetchData() {
  showLoading();

  /* 
    - The extent user select is nothing but the boundary of
      are that data will be fetched.
    - Product level is the default level of admin polygon
      that will be featched that with in the extent.
    - If derived level is set, product will be aggregate to higher
      level if it is avilable.

    * product_id & product_level
      used to identify individual attribute dataset and the the level
      of that dataset needs to be fetched.

    * extents & extent_level
      responsible for fetching suitable polygon layer to visualize data fetched in.
  */

  const derivedLevel = getDerivedLevel();
  window.AppConfig.derived_extent_level = Number(derivedLevel.lvl_number);

  // does the user have selected both product and extent?
  if (window.AppConfig.product_id === null || 
    window.AppConfig.extents.length === 0
  ) {
    hideLoading();
    alert("Please select a product and extent before fetching data.");
    return false;
  }


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
            <i class="${category.icon} me-2"></i><span class="hide-on-collapse">${category.name}</span>
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

async function populateProducts(){

  const data = await fetchProducts();
  
  // dataset items
  data.datasets.forEach(dataset => {
    dataset.tags.forEach(tag => {
      const listContainer = document.getElementById(`dataset-list-${tag.toLowerCase()}`);
      if (!listContainer) return; // category may not exist in tabs

      // Sort descending to get highest level first
      const sortedLevels = dataset.level.sort((a, b) => b - a); 
      const defaultLevel = sortedLevels[0]; // highest number
      const defaultLabel = levelMap[defaultLevel] || ``;
      
      const dropdownItems = sortedLevels
        .map(lvl => `<li><a class="dropdown-item" href="#" data-level="${lvl}">${levelMap[lvl] || `Level ${lvl}`}</a></li>`)
        .join("");

      // Build tags string
      const tagsHtml = dataset.tags
        .map(t => `<span class="badge bg-secondary">${t}</span>`)
        .join("");

      listContainer.innerHTML += `
        <div class="col-12 p-0">
          <div class="form-check border p-3 pt-1 pb-1 mx-2 h-100 border-primary rounded-1">
            <input class="form-check-input" type="radio"
              name="dataset-${tag.toLowerCase()}"
              id="${dataset.id}" value="${dataset.id}"
              productaoitype="undefined"
              productlevel="${dataset.level.join(',')}">
            
            <label class="form-check-label" for="${dataset.id}">
              

              <strong>${dataset.name}</strong><br>
              
              
              <div class="mt-1 mb-1 small text-muted dataset-meta">
                <span class="" title="Source">
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
                <!-- a href="#" title="Preview this dataset" class="btn btn-light btn-xs pb-0 pt-0 me-3">Preview</a -->
                
                <div class="d-flex bg-body-secondary px-1 rounded-1" title="Aggregation level">
                  <span class="form-label m-0 p-0 btn-xs text-muted mx-1" id="label-derive-${dataset.id}">Aggr</span>
                  <div class="derivedLevel d-flex justify-content-start align-items-center mx-0">
                    <a href="#" class="btn btn-xs pb-0 pt-0 dropdown-toggle" id="derive-${dataset.id}" data-bs-toggle="dropdown" aria-expanded="false">
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
    });
  });

  // DERIVED LEVEL SELECTION
  document.querySelectorAll('.derivedLevel').forEach(derivedLevelDiv => {
    derivedLevelDiv.addEventListener('click', e => {
      const item = e.target.closest('.dropdown-item');
      if (!item) return;

      e.preventDefault();
      const btn = derivedLevelDiv.querySelector(".dropdown-toggle");
      btn.textContent = item.textContent;
      btn.dataset.selectedLevel = item.dataset.level;
      btn.dataset.selectedName = item.textContent;
    });
  });

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
extentSelectorSave.addEventListener("click", async function () {
  closeSidebar();
  updateExtentConfig();

  if (fetchData()){
    openSidebar(`Download`);
  }
});

productSelectorSave.addEventListener("click", async function () {
  closeSidebar();
  updateProductConfig();
});

extentSelectorNext.addEventListener("click", async function () {
  closeSidebar();
  updateExtentConfig();

  if (fetchData()){
    openSidebar(`Download`);
  }
});

productSelectorNext.addEventListener("click", async function () {
  closeSidebar();
  updateProductConfig();

  openSidebar(`Extent`);
});

adminLvlSelector.addEventListener("change", async function () {
  
  let selectedValue = getAdminLevel();
  if (["1", "2", "3", "4"].includes(selectedValue)) {
    document.getElementById("admin-selector").classList.remove("d-none");
    document.getElementById("admin-selector2").classList.add("d-none");
    document.getElementById("admin-selector-label").classList.add("d-none");
    document.getElementById("admin-selector-label2").classList.add("d-none");
  }

  if (selectedValue == "1") {
    const data = await fetchAdminLevelData(1);
    populateDropdown("admin-selector-dropdown", data);
  } else if (selectedValue == "2") {
    const data = await fetchAdminLevelData(2);
    populateDropdown("admin-selector-dropdown", data);
  } else if (selectedValue == "3") {
    const data = await fetchAdminLevelData(3);
    populateDropdown("admin-selector-dropdown", data);
  } else if (selectedValue == "4") {
    const dataDSD = await fetchAdminLevelData(3);
    populateDropdown("admin-selector-dropdown", dataDSD);

    document.getElementById("admin-selector-label").classList.remove("d-none");
    document.getElementById("admin-selector-label").textContent = "DS Division";

    document
      .querySelectorAll('#admin-selector-dropdown input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.addEventListener("change", async function () {
          const checked = Array.from(
            document.querySelectorAll(
              '#admin-selector-dropdown input[type="checkbox"]:checked',
            ),
          ).map((cb) => cb.value);

          if (checked.length > 0) {
            document
              .getElementById("admin-selector-label2")
              .classList.remove("d-none");
            document.getElementById("admin-selector-label2").textContent =
              "GN Division";
            document
              .getElementById("admin-selector2")
              .classList.remove("d-none");
            document
              .getElementById("admin-selector")
              .classList.remove("d-none");

            let data = await fetchAdminLevelData(4);
            data = data?.filter(
              (record) =>
                record.code && checked.includes(String(record.dsd_code)),
            );

            populateDropdown("admin-selector-dropdown2", data);
          } else {
            document
              .getElementById("admin-selector-label2")
              .classList.add("d-none");
            document.getElementById("admin-selector2").classList.add("d-none");
          }
        });
      });
  }

  if (document.getElementById("admin-selector-dropdown-search")) {
    document
      .getElementById("admin-selector-dropdown-search")
      .addEventListener("keyup", function () {
        const filter = this.value.toLowerCase();
        const dropdown = document.getElementById("admin-selector-dropdown");
        const items = dropdown.querySelectorAll("li.dropdown-item");

        items.forEach((item) => {
          const label = item.querySelector("label.checkbox");
          if (label.textContent.toLowerCase().includes(filter)) {
            item.style.display = "";
          } else {
            item.style.display = "none";
          }
        });
      });
  }

  if (document.getElementById("admin-selector-dropdown2-search")) {
    document
      .getElementById("admin-selector-dropdown2-search")
      .addEventListener("keyup", function () {
        const filter = this.value.toLowerCase();
        const dropdown = document.getElementById("admin-selector-dropdown2");
        const items = dropdown.querySelectorAll("li.dropdown-item");

        items.forEach((item) => {
          const label = item.querySelector("label.checkbox");
          if (label.textContent.toLowerCase().includes(filter)) {
            item.style.display = "";
          } else {
            item.style.display = "none";
          }
        });
      });
  }

  
});

document.addEventListener("DOMContentLoaded", async () => {
  showLoading();

  // No tool tips
  // const tooltipTriggerList = document.querySelectorAll('[title]');
  // tooltipTriggerList.forEach(function (el) {
  //     new bootstrap.Tooltip(el);
  // });

  // const gndArray = await fetchAdminLevelData(5);
  // populateDropdown("tile-selector-dropdown", gndArray);

  await populateCategories();
  await populateProducts();
  await fetchAdminLevelData(4);
  await fetchAdminLevelData(3);
  await fetchAdminLevelData(2);
  await fetchAdminLevelData(1);

  hideLoading();
});

// event delegation (works even if elements are dynamically loaded later)
document.querySelector('#productTabContent').addEventListener('change', e => {
  if (e.target.classList.contains('form-check-input')) {
    // console.log('.form-check-input inside #productTabContent');

    document.querySelectorAll('#productTabContent .form-check').forEach(fc => {
      fc.classList.remove('border-primary');
    });

    const radio = e.target;
    if (radio.checked) {
      updateProductConfig();
      radio.closest('.form-check').classList.add('border-primary');
    }
  }
});

document.querySelector('#extentTabContent').addEventListener('change', e => {
  updateExtentConfig();
});

