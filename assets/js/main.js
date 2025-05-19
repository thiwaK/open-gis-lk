import * as bootstrap from 'bootstrap';
import alasql from 'alasql';

import './map';
import './api';

// populate extent dropdowns
const select = document.getElementById("province-dropdown");
const rows = alasql("SELECT id, name_en, name_si, name_ta FROM provinces");

rows.forEach(row => {
    const li = document.createElement("li");
    li.className = "dropdown-item";

    const label = document.createElement("label");
    label.className = "checkbox";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = row.id;

    const text = document.createTextNode(`${row.name_en} / ${row.name_si} / ${row.name_ta}`);

    label.appendChild(input);
    label.appendChild(text);
    li.appendChild(label);

    select.appendChild(li)
});


