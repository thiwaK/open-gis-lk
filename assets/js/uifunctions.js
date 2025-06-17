import {adminLvlSelector, extentSelectorSave} from './uielements';
import {loadAndParseCSV, isValidGeoJSON} from './dataloader';
import {fetchAdmin} from './api';

function getAdminLevel(){
    return adminLvlSelector.value;
}

async function loadDataset(admin_lvl, checked){
    
    if (admin_lvl == "1") {
        const data = await loadAndParseCSV('data/province.csv', 'en', "prov_code", "prov_name", "prov_code", checked);
        let code_base = checked
            .map(element => {
                const clean = String(element).replace(/^["']+|["']+$/g, '');
                return `province_code='${clean}'`
            })
            .join(" OR ");

        let name_base = data
            .map(element => {
                const clean = String(element.name_en).replace(/^["']+|["']+$/g, '');
                return `province_name='${clean}'`
            })
            .join(" OR ");

        let where = `(${name_base})OR(${code_base})`;
        updateMap(where, Number(admin_lvl));
    }

    else if (admin_lvl == "2") {
        const data = await loadAndParseCSV('data/district.csv', 'en', "dist_code", "dist_name", "dist_code", checked);
        let code_base = checked
            .map(element => `district_code='${element}'`)
            .join(" OR ");

        let name_base = data
            .map(element => `district_name='${element.name_en}'`)
            .join(" OR ");

        let where = `(${name_base}) OR (${code_base})`;

        updateMap(where, Number(admin_lvl));
    }

    else if (admin_lvl == "3") {
        const data = await loadAndParseCSV('data/dsd.csv', 'en', "dsd_code", "dsd_name", "dsd_code", checked);
        let code_base = checked
            .map(element => `ds_division_code='${element}'`)
            .join(" OR ");

        let name_base = data
            .map(element => `ds_division_name='${element.name_en}'`)
            .join(" OR ");

        let where = `(${name_base}) OR (${code_base})`;

        updateMap(where, Number(admin_lvl));
    }

    else if (admin_lvl == "4") {

        const checked = Array.from(document.querySelectorAll('#admin-selector-dropdown2 input[type="checkbox"]:checked')).map(cb => cb.value);
        const data = await loadAndParseCSV('data/gnd.csv', 'en', "admin_code", "gndname", "admin_code", checked);

        let code_base = checked
            .map(element => `admin_code='${element}'`)
            .join(" OR ");

        let name_base = data
            .map(element => `gnd_name='${element.name_en}'`)
            .join(" OR ");

        let where = `${code_base}`;

        updateMap(where, Number(admin_lvl));

    }
}

function showLoading() {
    document.getElementById('loading-overlay').classList.remove('d-none');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('d-none');
}

async function updateMap(query, admin_lvl) {
    showLoading();
    const resp = JSON.parse(await fetchAdmin(query, admin_lvl, true));
    if (!isValidGeoJSON(resp)) {
        console.log("INVALID");
        hideLoading();
        return;
    }
    if (window.currentGeoLayer) {
        window.map.removeLayer(window.currentGeoLayer);
    }
    window.currentGeoLayer = L.geoJSON(resp, {
        style: {
            color: "blue",
            fillColor: "lightblue",
            fillOpacity: 0.5,
            weight: 2
        }
    });

    window.map.addLayer(window.currentGeoLayer);
    // window.map.fitBounds(window.currentGeoLayer.getBounds());

    hideLoading();
    // const layer = {
    //     "District Layer": geojsonLayer
    // };
    // L.control.layers(layer).addTo(map);
}

function populateDropdown(elementID, rows) {

    console.log(`updating ${elementID}`);
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

export {showLoading, hideLoading, updateMap, populateDropdown, loadDataset, getAdminLevel};
