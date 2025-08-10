import {adminLvlSelector, extentSelectorSave} from './uielements';
import {loadAndParseCSV, isValidGeoJSON} from './dataloader';
import {fetchAdmin} from './api';

function getAdminLevel(){
    return adminLvlSelector.value;
}

async function getNameByCode(admin_lvl, checked){
    
    if (admin_lvl == "1") {
        const data = await loadAndParseCSV('data/province.csv', 'en', "prov_code", "prov_name", "prov_code", checked);
        return data;
    }

    else if (admin_lvl == "2") {
        const data = await loadAndParseCSV('data/district.csv', 'en', "dist_code", "dist_name", "dist_code", checked);
        return data;
    }

    else if (admin_lvl == "3") {
        const data = await loadAndParseCSV('data/dsd.csv', 'en', "dsd_code", "dsd_name", "dsd_code", checked);
        return data;
    }

    else if (admin_lvl == "4") {

        const checked = Array.from(document.querySelectorAll('#admin-selector-dropdown2 input[type="checkbox"]:checked')).map(cb => cb.value);
        const data = await loadAndParseCSV('data/gnd.csv', 'en', "admin_code", "gndname", "admin_code", checked);
        return data;

    }

    else if (admin_lvl == "5") {
        const data = await loadAndParseCSV("data/gridnames_50k.csv", "en", "code", "name", "code", checked);
        return data;
    }
}

function showLoading() {
    document.getElementById('loading-overlay').classList.remove('d-none');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('d-none');
}

function updateMap(poly, attr=null) {
    // showLoading();
    console.log(poly[0]);

    if (window.currentGeoLayer) {
        window.map.removeLayer(window.currentGeoLayer);
    }

    window.currentGeoLayer = L.geoJSON(poly, {
        style: {
            color: "blue",
            fillColor: "lightblue",
            fillOpacity: 0.5,
            weight: 2
        }
    });

    window.map.addLayer(window.currentGeoLayer);
    window.map.fitBounds(window.currentGeoLayer.getBounds());

    if (attr == null){
        hideLoading();
        return;
    }

    /* ===== Fetch attribute data */
    let payload = {
        id: document.config.product.id,
        level: document.config.extent.level,
        aoi: document.config.extent.aoi,
    }

    const respAttr = fetchAttributeData(payload);
    console.log(respAttr);

    hideLoading();
    // const layer = {
    //     "District Layer": geojsonLayer
    // };
    // L.control.layers(layer).addTo(map);
}

function populateDropdown(elementID, rows) {

    // console.log(`updating ${elementID}`);
    const select = document.getElementById(elementID);
    select.innerHTML = '';

    const li = document.createElement("li");
    const input = document.createElement("input");
    input.type = "text";
    input.id = `${elementID}-search`;
    input.className = "form-control";
    input.placeholder = "Search...";

    li.appendChild(input);
    select.appendChild(li);

    rows.forEach(row => {
        // console.log(row);
        if (row.code === undefined){
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

export {showLoading, hideLoading, updateMap, populateDropdown, getAdminLevel, getNameByCode};
