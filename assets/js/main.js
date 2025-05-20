import * as bootstrap from 'bootstrap';
// import alasql from 'alasql';


import './map';
// import { sql_districts, sql_dsd, sql_gnd } from './data.js';

// alasql("CREATE TABLE province (code INT, name_en STRING, name_si STRING, name_ta STRING)");
// alasql("INSERT INTO province VALUES (1, 'Western', 'බස්නාහිර', 'மேல்')");
// alasql("INSERT INTO province VALUES (2, 'Central', 'මධ්‍යම', 'மத்திய')");
// alasql("INSERT INTO province VALUES (3, 'Southern', 'දකුණු', 'தென்')");
// alasql("INSERT INTO province VALUES (4, 'North Western', 'වයඹ', 'வட மேல்')");
// alasql("INSERT INTO province VALUES (5, 'Sabaragamuwa', 'සබරගමුව', 'சபரகமுவ')");
// alasql("INSERT INTO province VALUES (6, 'Eastern', 'නැගෙනහිර', 'கிழக்கு')");
// alasql("INSERT INTO province VALUES (7, 'Uva', 'ඌව', 'ஊவா')");
// alasql("INSERT INTO province VALUES (8, 'North Central', 'උතුරු මැද', 'வட மத்திய')");
// alasql("INSERT INTO province VALUES (9, 'Northern', 'උතුරු', 'வட')");
// alasql(sql_districts);
// alasql(sql_dsd);
// alasql(sql_gnd);


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

async function loadAndParseCSV(url, elementID, lang, code="code", name="name_en") {

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
                rows = results.data.map(record => ({
                    code: record[code],
                    name_en: record[name]
                }));
            }
        

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

loadAndParseCSV('data/province.csv', 'province-dropdown', 'en', "prov_code", "prov_name")
loadAndParseCSV('data/district.csv', 'district-dropdown', 'en', "dist_code", "dist_name")
loadAndParseCSV('data/dsd.csv', 'dsd-dropdown', 'en', "dsd_code", "dsd_name")

// populateDropdowns('province-dropdown', 'province', 'en')
// populateDropdowns('district-dropdown', 'district', 'en')
// populateDropdowns('dsd-dropdown', 'dsd', 'en')
// populateDropdowns('gnd-dropdown', 'gnd', 'en')