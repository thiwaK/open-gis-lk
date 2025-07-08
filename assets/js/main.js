import * as bootstrap from 'bootstrap';
import './map';
import { adminLvlSelector, extentSelectorSave, productSelectorSave } from './uielements';
import { hideLoading, populateDropdown, loadDataset, getAdminLevel } from './uifunctions';
import { loadAndParseCSV, fetchCSV, fetchAttributeData} from './dataloader';

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
    }
}

function getSelectedProduct(){
    const activeTab = document.querySelector('#productTab .nav-link.active');
    const selectedTabId = activeTab?.getAttribute('data-bs-target');

    if (selectedTabId) {
        const tabContent = document.querySelector(`${selectedTabId}`);
        if (tabContent) {

            const selectedInput = tabContent.querySelector('input[type="radio"]:checked');
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

function getSelectedExtentTab(){
    const activeTab = document.querySelector('#extentTab .nav-link.active');
    const selectedTabId = activeTab?.getAttribute('data-bs-target');

    if (selectedTabId) {
        return selectedTabId;
    }

    return null;
}

extentSelectorSave.addEventListener('click', async function () {
    closeSidebar();
    const selectedExtentTab = getSelectedExtentTab();
    const selectedValue = getAdminLevel();

    if(selectedExtentTab === "#admin-boundary"){
        if (['1', '2', '3'].includes(selectedValue)) {
            var checked = Array.from(document.querySelectorAll('#admin-selector-dropdown input[type="checkbox"]:checked')).map(cb => cb.value);
            loadDataset(selectedValue, checked);
        }
        else if (['4'].includes(selectedValue)) {
            var checked = Array.from(document.querySelectorAll('#admin-selector-dropdown2 input[type="checkbox"]:checked')).map(cb => cb.value);
            loadDataset(selectedValue, checked);
        }

    }else if(selectedExtentTab === "#tile-number"){
        var checked = Array.from(document.querySelectorAll('#tile-selector-dropdown input[type="checkbox"]:checked')).map(cb => cb.value);
        loadDataset('5', checked);
    }
});

productSelectorSave.addEventListener('click', async function () {
    closeSidebar();
    const prod = getSelectedProduct();
    if (prod != null){
        console.log(prod);
        document.config.product.id = prod[0]
        document.config.product.type = prod[1]
        document.config.product.level = prod[2]
    }

    document.getElementById("admin-level-1").disabled = false;
    if (parseInt(document.config.product.level, 10) === 4){
        document.getElementById("admin-level-1").disabled = true;
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

    const data = await loadAndParseCSV('data/gridnames_50k.csv', 'en', "code", "name", "code");
    populateDropdown("tile-selector-dropdown", data)

    // No tool tips
    // const tooltipTriggerList = document.querySelectorAll('[title]');
    // tooltipTriggerList.forEach(function (el) {
    //     new bootstrap.Tooltip(el);
    // });




});
