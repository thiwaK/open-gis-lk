import * as bootstrap from 'bootstrap';
import './map';
import {adminLvlSelector, extentSelectorSave} from './uielements';
import {hideLoading, populateDropdown, loadDataset, getAdminLevel} from './uifunctions';
import {loadAndParseCSV, fetchData} from './dataloader';


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

extentSelectorSave.addEventListener('click', async function () {
    
    let selectedValue = getAdminLevel();
    if (['1', '2', '3'].includes(selectedValue)){
        var checked = Array.from(document.querySelectorAll('#admin-selector-dropdown input[type="checkbox"]:checked')).map(cb => cb.value);
        closePanelExtent();
        loadDataset(selectedValue, checked);
    }
    else if (['4'].includes(selectedValue)){
        var checked = Array.from(document.querySelectorAll('#admin-selector-dropdown2 input[type="checkbox"]:checked')).map(cb => cb.value);
        closePanelExtent();
        loadDataset(selectedValue, checked);
    }
    
});

adminLvlSelector.addEventListener('change', async function () {

    let selectedValue = getAdminLevel();
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

        document.querySelectorAll('#admin-selector-dropdown input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', async function () {

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

            })
        });

    }
    
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

document.addEventListener('DOMContentLoaded', async () => {
    hideLoading();
    // const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    // tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    //     new bootstrap.Tooltip(tooltipTriggerEl);
    // });

    const data = await loadAndParseCSV('data/gridnames_50k.csv', 'en', "code", "name", "code");
    populateDropdown("tile-sellector-dropdown", data)

    const tooltipTriggerList = document.querySelectorAll('[title]');
    tooltipTriggerList.forEach(function (el) {
      new bootstrap.Tooltip(el);
    });
});
