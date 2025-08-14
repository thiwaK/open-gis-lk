import * as bootstrap from "bootstrap";
// import './map';
import {
  fetchSpatialData,
  fetchAttributeData,
  fetchAdminLevelData,
  getBBox,
  spatialAttributeMerge,
  fetchProducts
} from "./dataloader";
import { updateMap } from "./map";

document.config = {
  product: {
    id: null,
    type: null,
    level: null,
  },
  extent: {
    id: null,
    level: null,
    aoi: null,
  },
  map: {
    dataset: null,
  },
};

// UI ELEMENTS
const adminLvlSelector = document.getElementById("admin-level-selector");
const extentSelectorSave = document.getElementById("extent-selecter-save");
const tileSelectorDropdown = document.getElementById("tile-selector-dropdown");
const productSelectorSave = document.getElementById("product-selecter-save");

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
        const productlevel = selectedInput.getAttribute("productlevel");
        return [selectedValue, productAoiType, productlevel];
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

async function fetchData() {
  showLoading();

  const spatialdata = await fetchSpatialData();
  updateMap(spatialdata);

  const attributedata = await fetchAttributeData();
  const mergedData = spatialAttributeMerge(spatialdata, attributedata);
  updateMap(mergedData);

  hideLoading();
}

async function populateProducts(){

  let data = await fetchProducts();

  const tabList = document.getElementById("productTab");
  const tabContent = document.getElementById("productTabContent");

  tabList.innerHTML = "";
  tabContent.innerHTML = "";

  data.forEach((product, index) => {

      // ---- Create Tab ----
      const tabItem = document.createElement("li");
      tabItem.className = "nav-item";
      tabItem.setAttribute("role", "presentation");

      const tabButton = document.createElement("button");
      tabButton.id = `${product.name.toLowerCase()}-tab`;
      tabButton.className = `nav-link ${index === 0 ? "active" : ""}`;
      tabButton.setAttribute("data-bs-toggle", "tab");
      tabButton.setAttribute("data-bs-target", `#${product.name.toLowerCase()}`);
      tabButton.setAttribute("type", "button");
      tabButton.setAttribute("role", "tab");
      tabButton.setAttribute("aria-controls", product.name.toLowerCase());
      tabButton.setAttribute("aria-selected", index === 0 ? "true" : "false");

      if (product.icon) {
          const iconEl = document.createElement("i");
          iconEl.className = `${product.icon} me-2`;
          tabButton.appendChild(iconEl);
      }
      tabButton.appendChild(document.createTextNode(product.name));

      tabItem.appendChild(tabButton);
      tabList.appendChild(tabItem);

      // ---- Create Tab Content ----
      const contentPane = document.createElement("div");
      contentPane.id = product.name.toLowerCase();
      contentPane.className = `tab-pane fade ${index === 0 ? "show active" : ""}`;
      contentPane.setAttribute("role", "tabpanel");
      contentPane.setAttribute("aria-labelledby", `${product.name.toLowerCase()}-tab`);

      const rowDiv = document.createElement("div");
      rowDiv.className = "row g-3";

      product.datasets.forEach(dataset => {
          const colDiv = document.createElement("div");
          colDiv.className = "col-12 col-md-6";

          const formCheck = document.createElement("div");
          formCheck.className = "form-check border p-3 rounded h-100";

          const inputEl = document.createElement("input");
          inputEl.className = "form-check-input";
          inputEl.type = "radio";
          inputEl.name = `dataset-${product.name.toLowerCase()}`;
          inputEl.id = dataset.id.toLowerCase();
          inputEl.value = dataset.id;
          inputEl.setAttribute("productaoitype", dataset.aoi_type);
          inputEl.setAttribute("productlevel", dataset.level);

          const labelEl = document.createElement("label");
          labelEl.className = "form-check-label";
          labelEl.setAttribute("for", dataset.id.toLowerCase());

          const strongEl = document.createElement("strong");
          strongEl.textContent = dataset.name;

          const smallEl = document.createElement("small");
          smallEl.className = "text-muted";
          smallEl.textContent = dataset.description;

          labelEl.appendChild(strongEl);
          labelEl.appendChild(document.createElement("br"));
          labelEl.appendChild(smallEl);

          formCheck.appendChild(inputEl);
          formCheck.appendChild(labelEl);
          colDiv.appendChild(formCheck);
          rowDiv.appendChild(colDiv);
      });

      contentPane.appendChild(rowDiv);
      tabContent.appendChild(contentPane);
  });

}

// EVENTS LISTENERS
extentSelectorSave.addEventListener("click", async function () {
  closeSidebar();
  const selectedExtentTab = getSelectedExtentTab();
  const selectedValue = getAdminLevel();

  document.config.extent.level = parseInt(selectedValue, 10);
  switch (document.config.extent.level) {
    case 1:
      document.config.extent.id = "poly_province";
      break;

    case 2:
      document.config.extent.id = "poly_district";
      break;

    case 3:
      document.config.extent.id = "poly_dsd";
      break;

    case 4:
      document.config.extent.id = "poly_gnd";
      break;

    case 5:
      document.config.extent.id = "poly_50k";
      break;
  }

  if (selectedExtentTab === "#admin-boundary") {
    if (["1", "2", "3"].includes(selectedValue)) {
      var checked = Array.from(
        document.querySelectorAll(
          '#admin-selector-dropdown input[type="checkbox"]:checked',
        ),
      ).map((cb) => cb.value);
      document.config.extent.aoi = checked;
    } else if (["4"].includes(selectedValue)) {
      var checked = Array.from(
        document.querySelectorAll(
          '#admin-selector-dropdown2 input[type="checkbox"]:checked',
        ),
      ).map((cb) => cb.value);
      document.config.extent.aoi = checked;
    }
  } else if (selectedExtentTab === "#tile-number") {
    var checked = Array.from(
      document.querySelectorAll(
        '#tile-selector-dropdown input[type="checkbox"]:checked',
      ),
    ).map((cb) => cb.value);
    document.config.extent.aoi = checked;
    document.config.extent.level = 5;
  }

  fetchData();
});

productSelectorSave.addEventListener("click", async function () {
  closeSidebar();
  const prod = getSelectedProduct();
  document.config.product.id = prod[0];
  document.config.product.type = prod[1];
  document.config.product.level = prod[2];

  document.getElementById("admin-level-1").disabled = false;
  if (parseInt(document.config.product.level, 10) === 4) {
    document.getElementById("admin-level-1").disabled = true;
  }
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

  await populateProducts();
  await fetchAdminLevelData(4);
  await fetchAdminLevelData(3);
  await fetchAdminLevelData(2);
  await fetchAdminLevelData(1);

  hideLoading();
});

document.querySelectorAll('.form-check-input').forEach(radio => {
  radio.addEventListener('change', () => {

    document.querySelectorAll('.form-check').forEach(fc => {
      fc.classList.remove('border-success');
      fc.classList.remove('bg-success');
    });

    if (radio.checked) {
      radio.closest('.form-check').classList.add('border-success');
      radio.closest('.form-check').classList.add('bg-success');
    }
  });
});
