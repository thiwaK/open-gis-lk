import "leaflet";
import "leaflet-draw";

window.map = L.map("dataset-map").setView([7.9, 83.58], 8);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);


// Feature group to store drawn shapes
var drawnItems = new L.FeatureGroup();

// Draw control
var drawControl = new L.Control.Draw({
  draw: {
    polygon: false,
    polyline: false,
    circle: false,
    circlemarker: false,
    marker: false,
    rectangle: {
      shapeOptions: {
        color: "red"
      },
      showArea: true,
      metric: ['km','ha','m']
    }
  },
  edit: {
    featureGroup: drawnItems
  }
});

// Event when shape is created
map.on(L.Draw.Event.CREATED, function (event) {
  var layer = event.layer;
  var latlngs = layer.getLatLngs()[0]; // corners of rectangle

  var area = rectangleArea(latlngs);

  if (area < 100) {
    alert("Box area must be greater than 100 km². Your box was: " + area.toFixed(2) + " km²");
    return; // reject
  }

  drawnItems.clearLayers();
  drawnItems.addLayer(layer);

  // Get coordinates of the box
  console.log("Rectangle coordinates:", latlngs);
});

// When a rectangle is edited
map.on(L.Draw.Event.EDITED, function (event) {
  event.layers.eachLayer(function (layer) {
    var latlngs = layer.getLatLngs()[0];
    var area = rectangleArea(latlngs);

    console.log("Edited rectangle coordinates:", latlngs);
  });
});

map.addLayer(drawnItems);
map.addControl(drawControl);

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
    "dist_name",
    "dsd_name",
    "gnd_name",
    "prov_name",
    "dist_code",
    "dsd_code",
    "gnd_code",
    "prov_code",
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

function rectangleArea(latlngs) {
  // Leaflet gives rectangle as array of corners
  let bounds = L.latLngBounds(latlngs);
  let sw = bounds.getSouthWest();
  let ne = bounds.getNorthEast();

  // Convert degrees to meters
  let width = L.latLng(sw.lat, sw.lng).distanceTo(L.latLng(sw.lat, ne.lng));
  let height = L.latLng(sw.lat, sw.lng).distanceTo(L.latLng(ne.lat, sw.lng));

  return (width * height) / 1e6; // km²
}

export { updateMap };
