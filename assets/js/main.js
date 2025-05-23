import * as bootstrap from 'bootstrap';
import './map';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

async function loadAndParseCSV(url, elementID, lang, idKey, idList, code = "code", name = "name_en") {

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
            if (lang == 'en') {
                rows = results.data
                    // .filter(record => record[code] && idList.includes(String(record[idKey])))
                    .map(record => ({
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
}

const selector = document.getElementById('admin-level-selector');
const selectLable = document.getElementById('admin-selector-label');
selector.addEventListener('change', function () {
    const selectedValue = this.value;

    if (selectedValue in ['1', '2', '3', '4']){
        selectLable.classList.remove('d-none');
        document.getElementById('admin-selector').classList.remove('d-none');
    }
    

    if (selectedValue == "1") {
        loadAndParseCSV('data/province.csv', 'admin-selector-dropdown', 'en', "", "", "prov_code", "prov_name");
        selectLable.textContent = "";
    }
    else if (selectedValue == "2") {
        loadAndParseCSV('data/district.csv', 'admin-selector-dropdown', 'en', "", "", "dist_code", "dist_name");
        selectLable.textContent = "";
    }
    else if (selectedValue == "3") {
        loadAndParseCSV('data/dsd.csv', 'admin-selector-dropdown', 'en', "", "", "dsd_code", "dsd_name");
        selectLable.textContent = "";
    }
    else if (selectedValue == "4") {
        loadAndParseCSV('data/gnd.csv', 'admin-selector-dropdown', 'en', "", "", "gnd_code", "gnd_name");
        selectLable.textContent = "";
    }
});

document.querySelectorAll('#admin-selector-dropdown input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        var checked = Array.from(document.querySelectorAll('#admin-selector-dropdown input[type="checkbox"]:checked')).map(cb => cb.value);
        console.log(checked);
    });
});
