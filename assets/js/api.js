

function fetchNow(url) {

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Accept", "*/*");
        xhr.setRequestHeader("Accept-Language", "en-US,en;q=0.5");
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                console.log(`respond: ${xhr.status}`);
                if (xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    reject(xhr.status);
                }
            }
        };

        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
    });
}

async function fetchAdmin(where, admin_lvl, returnGeometry=true){

    let url;

    switch (admin_lvl) {
        case 1:
            url = new URL("https://gisapps.nsdi.gov.lk/server/rest/services/SLNSDI/Boundary/MapServer/6/query");
            break;
        case 2:
            url = new URL("https://gisapps.nsdi.gov.lk/server/rest/services/SLNSDI/Boundary/MapServer/5/query");
            break;
        case 3:
            url = new URL("https://gisapps.nsdi.gov.lk/server/rest/services/SLNSDI/Boundary/MapServer/4/query");
            break;
        case 4:
            url = new URL("https://gisapps.nsdi.gov.lk/server/rest/services/SLNSDI/Boundary/MapServer/3/query");
            break;
        default:
            break;
    }

    const params = {
        f: 'geojson',
        returnGeometry: 'true',
        outSR: '4326',
        outFields: '*',
        spatialRel:'esriSpatialRelContains',
        geometryType: 'esriGeometryEnvelope',
        where: where,
        generalize: 'true',
        units:'esriSRUnit_Meter',
    };

    Object.entries(params).forEach(([key, value]) =>
        url.searchParams.append(key, value)
    );

    response = await fetchNow(url);
    return response;
}

export default fetchAdmin;
