import * as bootstrap from 'bootstrap';
import './map';



function fetchData(url){
    fetch(url)
        .then(response => response.text())
        .then(csvText => {
            return csvText
        });
}

function populateDropdownsSQL(elementID, tableName, language){
    const select = document.getElementById(elementID);
    var rows;
    if(language == 'en'){
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
        if(language == 'en'){
            text = document.createTextNode(`${row.name_en}`);
        }

        label.appendChild(input);
        label.appendChild(text);
        li.appendChild(label);

        select.appendChild(li)
    });
}

async function loadAndParseCSV(url, elementID, lang, idKey, idList, code="code", name="name_en") {


    const select = document.getElementById(elementID);
    let csvText = localStorage.getItem(url);
    if (!csvText) {
        const response = await fetch(url);
        csvText = await response.text();
        localStorage.setItem(url, csvText);
    }
    
    Papa.parse(csvText, {
        header: true,
        complete: function(results) {
            let rows;
            if (lang == 'en'){
                rows = results.data
                    .filter(record => record[code] && idList.includes(String(record[idKey])))
                    .map(record => ({
                        code: record[code],
                        name_en: record[name]
                    }));
            }

            console.log(rows);
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

                select.appendChild(li);
            });
        }
    });
}

loadAndParseCSV(
    'data/province.csv', 
    'province-dropdown', 
    'en', 
    "prov_code", ['1','2','3','4','5','6','7','8','9'],
    "prov_code", "prov_name"
)
document.querySelectorAll('#province-dropdown input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        const checked = Array.from(
            document.querySelectorAll('#province-dropdown input[type="checkbox"]:checked')
        ).map(cb => cb.value);
        loadAndParseCSV('data/district.csv', 'district-dropdown', 'en', "prov_code", checked, "dist_code", "dist_name")
        
        document.querySelectorAll('#district-dropdown input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const checked = Array.from(
                    document.querySelectorAll('#district-dropdown input[type="checkbox"]:checked')
                ).map(cb => cb.value);
                loadAndParseCSV('data/dsd.csv', 'dsd-dropdown', 'en', "dist_code", checked, "dsd_code", "dsd_name")
            
            
                document.querySelectorAll('#dsd-dropdown input[type="checkbox"]').forEach(checkbox => {
                    checkbox.addEventListener('change', function () {
                        const checked = Array.from(
                            document.querySelectorAll('#dsd-dropdown input[type="checkbox"]:checked')
                        ).map(cb => cb.value);
                        loadAndParseCSV('data/gnd.csv', 'gnd-dropdown', 'en', "dsd_code", checked, "gnd_code", "gnd_name")
                    });
                });
            
            });
        });
    
    });
});

