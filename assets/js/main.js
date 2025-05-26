import * as bootstrap from 'bootstrap';
import './map';
import fetchAdmin from './api';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showLoading() {
    document.getElementById('loading-overlay').classList.remove('d-none');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('d-none');
}

function populateDropdownsSQL(elementID, tableName, language) {
    const select = document.getElementById(elementID);
    var rows;
    if (language == 'en') {
        rows = alasql(`SELECT code, name_en FROM ${tableName}`);
    }
    rows.forEach(row => {
        const li = document.createElement("li");
        li.className = "dropdown-item";

        const label = document.createElement("label");
        label.className = "checkbox";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = row.id;

        var text;
        if (language == 'en') {
            text = document.createTextNode(`${row.name_en}`);
        }

        label.appendChild(input);
        label.appendChild(text);
        li.appendChild(label);

        select.appendChild(li)
    });
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


async function updateMap(query, admin_lvl) {
    showLoading();
    const resp = JSON.parse(await fetchAdmin(query, admin_lvl, true));
    if (!isValidGeoJSON(resp)) {
        console.log("INVALID");
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

function populateDropdown(elementID, rows) {
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

const selector = document.getElementById('admin-level-selector');
const selectorBtn = document.getElementById('extent-selecter-btn');
let selectedValue;

selectorBtn.addEventListener('click', async function () {

    var checked = Array.from(document.querySelectorAll('#admin-selector-dropdown input[type="checkbox"]:checked')).map(cb => cb.value);
    closePanelExtent();

    if (selectedValue == "1") {
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
        updateMap(where, Number(selectedValue));
    }

    else if (selectedValue == "2") {
        const data = await loadAndParseCSV('data/district.csv', 'en', "dist_code", "dist_name", "dist_code", checked);
        let code_base = checked
            .map(element => `district_code='${element}'`)
            .join(" OR ");

        let name_base = data
            .map(element => `district_name='${element.name_en}'`)
            .join(" OR ");

        let where = `(${name_base}) OR (${code_base})`;

        updateMap(where, Number(selectedValue));
    }

    else if (selectedValue == "3") {
        const data = await loadAndParseCSV('data/dsd.csv', 'en', "dsd_code", "dsd_name", "dsd_code", checked);
        let code_base = checked
            .map(element => `ds_division_code='${element}'`)
            .join(" OR ");

        let name_base = data
            .map(element => `ds_division_name='${element.name_en}'`)
            .join(" OR ");

        let where = `(${name_base}) OR (${code_base})`;

        updateMap(where, Number(selectedValue));
    }

    else if (selectedValue == "4") {

        const checked = Array.from(document.querySelectorAll('#admin-selector-dropdown2 input[type="checkbox"]:checked')).map(cb => cb.value);
        const data = await loadAndParseCSV('data/gnd.csv', 'en', "gnd_code", "gndname", "gnd_code", checked);

        let code_base = checked
            .map(element => `gnd_code='${element}'`)
            .join(" OR ");

        let name_base = data
            .map(element => `gnd_name='${element.name_en}'`)
            .join(" OR ");

        let where = `(${name_base}) OR (${code_base})`;

        updateMap(where, Number(selectedValue));

    }

});

selector.addEventListener('change', async function () {

    selectedValue = selector.value;
    if (['1', '2', '3', '4'].includes(selectedValue)) {
        document.getElementById('admin-selector').classList.remove('d-none');
        document.getElementById('admin-selector2').classList.add('d-none');
        document.getElementById('admin-selector-label').classList.add('d-none');
        document.getElementById('admin-selector-label2').classList.add('d-none');
    }

    if (selectedValue == "1") {
        const data = await loadAndParseCSV('data/province.csv', 'en', "prov_code", "prov_name");
        populateDropdown('admin-selector-dropdown', data);
    }
    else if (selectedValue == "2") {
        const data = await loadAndParseCSV('data/district.csv', 'en', "dist_code", "dist_name");
        populateDropdown('admin-selector-dropdown', data);
    }
    else if (selectedValue == "3") {
        const data = await loadAndParseCSV('data/dsd.csv', 'en', "dsd_code", "dsd_name");
        populateDropdown('admin-selector-dropdown', data);
    }
    else if (selectedValue == "4") {
        const data = await loadAndParseCSV('data/dsd.csv', 'en', "dsd_code", "dsd_name");
        populateDropdown('admin-selector-dropdown', data);

        document.getElementById('admin-selector-label').classList.remove('d-none');
        document.getElementById('admin-selector-label').textContent = "DS Division";

    }

    document.querySelectorAll('#admin-selector-dropdown input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', async function () {

            if (selectedValue == "4") {

                const checked = Array.from(document.querySelectorAll('#admin-selector-dropdown input[type="checkbox"]:checked')).map(cb => cb.value);

                if (checked.length > 0) {
                    document.getElementById('admin-selector-label2').classList.remove('d-none')
                    document.getElementById('admin-selector-label2').textContent = "GN Division";
                    document.getElementById('admin-selector2').classList.remove('d-none');
                    document.getElementById('admin-selector').classList.remove('d-none');

                    const data = await loadAndParseCSV('data/gnd.csv', 'en', "gnd_code", "gnd_name", "dsd_code", checked);
                    populateDropdown('admin-selector-dropdown2', data);

                } else {
                    document.getElementById('admin-selector-label2').classList.add('d-none');
                    document.getElementById('admin-selector2').classList.add('d-none');
                }


            }

        })
    });

    if (document.getElementById('admin-selector-dropdown-search')) {
        document.getElementById('admin-selector-dropdown-search').addEventListener('keyup', function () {
            const filter = this.value.toLowerCase();
            const dropdown = document.getElementById('admin-selector-dropdown');
            const items = dropdown.querySelectorAll('li.dropdown-item');

            items.forEach(item => {
                const label = item.querySelector('label.checkbox');
                if (label.textContent.toLowerCase().includes(filter)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    if (document.getElementById('admin-selector-dropdown2-search')) {
        document.getElementById('admin-selector-dropdown2-search').addEventListener('keyup', function () {
            const filter = this.value.toLowerCase();
            const dropdown = document.getElementById('admin-selector-dropdown2');
            const items = dropdown.querySelectorAll('li.dropdown-item');

            items.forEach(item => {
                const label = item.querySelector('label.checkbox');
                if (label.textContent.toLowerCase().includes(filter)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }




});

document.addEventListener('DOMContentLoaded', () => {
    hideLoading();
});
