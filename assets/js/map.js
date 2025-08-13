import "leaflet";
// import 'leaflet/dist/leaflet.css';

const canvas = document.createElement("canvas");
const gl =
  canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

if (!gl) {
  document.getElementById("webgl-warning").classList.remove("d-none");
  // throw new Error("WebGL not supported. Stopping script.");
}

window.map = L.map("map").setView([7.9, 80.7], 8);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

function popupContent(feature, layer) {
  var bounds = layer.getBounds();
  let popup = new L.Popup();

  // Build Bootstrap card content
  const props = feature.properties || {};
  const name =
    props.name_en ||
    props.gnd_n ||
    props.dsd_n ||
    props.dist_n ||
    props.prov_n ||
    "No name";

  let rows = "";
  const skipKeys = [
    "name_en",
    "gnd_n",
    "dsd_n",
    "dist_n",
    "prov_n",
    "gnd_c",
    "dsd_c",
    "dist_c",
    "prov_c",
    "pcode",
    "code",
  ];

  for (const key in props) {
    if (props.hasOwnProperty(key) && !skipKeys.includes(key)) {
      rows += `
                <tr>
                    <th style="text-align:left; padding-right: 10px;">${key}</th>
                    <td>${props[key]}</td>
                </tr>`;
    }
  }

  const popupContent = `
        <div class="card border-0" style="width: 18rem;">
            <div class="card-body">
                <h5 class="card-title">${name}</h5>
                ${
                  rows
                    ? `<table class="table table-sm">
                    <tbody>
                        ${rows}
                    </tbody>
                </table>`
                    : "<p>No additional attributes</p>"
                }
            </div>
        </div>
    `;

  popup.setLatLng(bounds.getCenter());
  popup.setContent(popupContent);

  return popup;
}

function updateMap(poly, attr = null) {
  if (window.currentGeoLayer) {
    window.map.removeLayer(window.currentGeoLayer);
  }

  window.currentGeoLayer = new L.GeoJSON(poly, {
    style: {
      color: "blue",
      fillColor: "lightblue",
      fillOpacity: 0.5,
      weight: 2,
    },
    onEachFeature: function (feature, layer) {
      layer.on("click", function (e) {
        popup = popupContent(feature, layer);
        window.map.openPopup(popup);
      });
    },
  });

  window.map.addLayer(window.currentGeoLayer);
  window.map.fitBounds(window.currentGeoLayer.getBounds());
}

export { updateMap };
