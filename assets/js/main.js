import * as bootstrap from 'bootstrap';
import './map';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showLoading() {
  document.getElementById('loading-overlay').classList.remove('d-none');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('d-none');
}



function fetchData(url) {
    fetch(url)
        .then(response => response.text())
        .then(csvText => {
            return csvText
        });
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

async function loadAndParseCSV(url, elementID, lang, code, name, idKey=null, idList=null) {
    showLoading();
    const select = document.getElementById(elementID);
    let csvText = localStorage.getItem(url);
    if (!csvText) {
        const response = await fetch(url);
        csvText = await response.text();
        localStorage.setItem(url, csvText);
    }

    Papa.parse(csvText, {
        header: true,
        complete: function (results) {
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

            select.innerHTML = ''; // Clear existing dropdown items
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
    });

    hideLoading();
    // console.log("CSV loaded");
}

const selector = document.getElementById('admin-level-selector');
selector.addEventListener('change', async function () {
    const selectedValue = this.value;

    if (['1', '2', '3', '4'].includes(selectedValue)){
        document.getElementById('admin-selector').classList.remove('d-none');
        document.getElementById('admin-selector2').classList.add('d-none');
        document.getElementById('admin-selector-label').classList.add('d-none');
        document.getElementById('admin-selector-label2').classList.add('d-none');
    }

    if (selectedValue == "1") {
        await loadAndParseCSV('data/province.csv', 'admin-selector-dropdown', 'en', "prov_code", "prov_name", null, null);
    }
    else if (selectedValue == "2") {
        await loadAndParseCSV('data/district.csv', 'admin-selector-dropdown', 'en', "dist_code", "dist_name", null, null);
    }
    else if (selectedValue == "3" || selectedValue == "4") {
        await loadAndParseCSV('data/dsd.csv', 'admin-selector-dropdown', 'en',  "dsd_code", "dsd_name", null, null);
    }

    document.querySelectorAll('#admin-selector-dropdown input[type="checkbox"]').forEach(checkbox => {

        checkbox.addEventListener('change', async function () {
            var checked = Array.from(document.querySelectorAll('#admin-selector-dropdown input[type="checkbox"]:checked')).map(cb => cb.value);
            console.log(checked);

            if (selectedValue == "4") {
                await loadAndParseCSV('data/gnd.csv', 'admin-selector-dropdown2', 'en', "gnd_code", "gnd_name", "dsd_code", checked);
                document.getElementById('admin-selector-label').classList.remove('d-none');
                document.getElementById('admin-selector-label').textContent = "DS Division";
                document.getElementById('admin-selector-label2').classList.remove('d-none')
                document.getElementById('admin-selector-label2').textContent = "GN Division";
                document.getElementById('admin-selector2').classList.remove('d-none');
                document.getElementById('admin-selector').classList.remove('d-none');
            }
        })
    })

    
});

document.addEventListener('DOMContentLoaded', () => {
  hideLoading();
});
