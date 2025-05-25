
// Survey Department
function lis_survey(url) {
    console.log(url);
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

async function fetchAdmin(where , returnGeometry=true){
    let url = new URL("https://gisapps.nsdi.gov.lk/server/rest/services/SLNSDI/Boundary/MapServer/5/query");

    const params = {
        f: 'geojson',
        returnGeometry: 'true',
        outSR: '4326',
        outFields: '*',
        spatialRel:'esriSpatialRelContains',
        geometryType: 'esriGeometryEnvelope',
        where: where,
        generalize:true,
        maxAllowableOffset:'',
        units:'esriSRUnit_Meter',
    };

    Object.entries(params).forEach(([key, value]) =>
        url.searchParams.append(key, value)
    );

    response = await lis_survey(url);
    return response;
}

export default fetchAdmin;
