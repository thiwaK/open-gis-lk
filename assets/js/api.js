const mapServer = "/MapServer";
const restService = "/server/rest/services";
const nsdi = "gisapps.nsdi.gov.lk";

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
    const host = nsdi;
    const uri = "/SLNSDI/Boundary";

    switch (admin_lvl) {
        case 1:
            url = new URL(`https://${host}${restService}${uri}${mapServer}/6/query`);
            break;
        case 2:
            url = new URL(`https://${host}${restService}${uri}${mapServer}/5/query`);
            break;
        case 3:
            url = new URL(`https://${host}${restService}${uri}${mapServer}/4/query`);
            break;
        case 4:
            url = new URL(`https://${host}${restService}${uri}${mapServer}/3/query`);
            break;
        default:
            break;
    }

    const params = {
        f: 'geojson',
        returnGeometry: 'true',
        outSR: '4326',
        outFields: '*',
        spatialRel:'esriSpatialRelContains', //esriSpatialRelIntersects
        geometryType: 'esriGeometryPolygon', //esriGeometryEnvelope
        where: where,
        generalize: 'true',
        units:'esriSRUnit_Meter',
        returnTrueCurves: false
    };

    Object.entries(params).forEach(([key, value]) =>
        url.searchParams.append(key, value)
    );

    response = await fetchNow(url);
    return response;
}

async function fetchTile(where, returnGeometry=true) {
    console.log(where);
    
    const host = nsdi;
    const uri = "/SLNSDI/Survey_50K";

    let url = new URL(`https://${host}${restService}${uri}${mapServer}/11/query`);
    
    const params = {
        f: 'geojson',
        returnGeometry: 'true',
        outSR: '4326',
        outFields: '*',
        spatialRel:'esriSpatialRelContains', //esriSpatialRelIntersects
        geometryType: 'esriGeometryPolygon', //esriGeometryEnvelope
        where: where,
        units:'esriSRUnit_Meter',
        returnTrueCurves: false
    };
    
    Object.entries(params).forEach(([key, value]) =>
        url.searchParams.append(key, value)
    );

    response = await fetchNow(url);
    return response;
}

export {fetchAdmin, fetchTile};
