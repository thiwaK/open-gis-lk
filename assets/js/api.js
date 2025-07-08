let dataURL = new URL(`https://opengislk.alwaysdata.net/getData`);
let attributeDataURL = new URL(`https://opengislk.alwaysdata.net/getAttributeData`);

function joinData(geojson, csvData, key = 'id') {
  const csvLookup = {};

  // Build a lookup table
  csvData.forEach(row => {
    csvLookup[row[key]] = row;
  });

  // Inject CSV attributes into GeoJSON
  geojson.features.forEach(feature => {
    const id = feature.properties[key];
    if (csvLookup[id]) {
      feature.properties = {
        ...feature.properties,
        ...csvLookup[id]
      };
    }
  });

  return geojson;
}

async function fetchAttr_(datasetId) {

    const url = "https://opengislk.alwaysdata.net/getAttributeData"
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Accept", "*/*");
        xhr.setRequestHeader("Accept-Language", "en-US,en;q=0.5");
        xhr.setRequestHeader("Content-Type", "application/json");  // JSON content type

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

        const data = JSON.stringify({ id: datasetId });
        xhr.send(data);
    });
}

function getCache(url) {

    const cached = localStorage.getItem(url);
    const expTime = 24 * 60 * 60 * 1000 * 7; // 1 week
    let responseContent = null;

    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;

            if (age < expTime) {
                responseContent = parsed.content;
            } 
        } catch (e) {
            // corrupted or non-JSON — fallback to fresh fetch
            responseContent = null;
        }
    }

    return responseContent;
}

function fetchNow(url) {

    const cached = getCache(url);
    if (cached != null){
        return cached;
    }

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                console.log(`respond: ${xhr.status}`);
                if (xhr.status === 200) {

                    localStorage.setItem(url, JSON.stringify({
                        content: xhr.responseText,
                        timestamp: Date.now()
                    }));
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

function postNow(url, data) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);

        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    reject(xhr.status);
                }
            }
        };

        xhr.onerror = () => reject(xhr.statusText);
        xhr.send(JSON.stringify(data));
    });
}

async function fetchAttr(payload){
    // response = await postNow(dataURL, payload);
    // return response;

    const url = new URL(attributeDataURL.toString());
    Object.entries(payload).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    response = await fetchNow(url);
    return response;
}

async function fetchAdmin(payload){
    // response = await postNow(dataURL, payload);
    // return response;

    const url = new URL(dataURL.toString());
    Object.entries(payload).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });
    // console.log(url);

    response = await fetchNow(url);
    return response;
}

export {fetchAdmin, fetchAttr};
