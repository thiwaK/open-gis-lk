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
  // console.log("Rectangle coordinates:", getRect(latlngs));
  window.AppConfig.bbox = getRect(latlngs);
});

// When a rectangle is edited
map.on(L.Draw.Event.EDITED, function (event) {
  event.layers.eachLayer(function (layer) {
    var latlngs = layer.getLatLngs()[0];
    var area = rectangleArea(latlngs);

    // console.log("Edited rectangle coordinates:", getRect(latlngs));
    window.AppConfig.bbox = getRect(latlngs);
  });
});

// When a rectangle is deleted
map.on(L.Draw.Event.DELETED, function (event) {
  event.layers.eachLayer(function (layer) {
    var latlngs = layer.getLatLngs()[0];

    // console.log("Rectangle deleted");
    window.AppConfig.bbox = {};
  });
});

map.addLayer(drawnItems);
map.addControl(drawControl);

function getRect(latlngs){
  var xs = latlngs.map(pt => pt.lng);
  var ys = latlngs.map(pt => pt.lat);

  var xmin = Math.min(...xs);
  var xmax = Math.max(...xs);
  var ymin = Math.min(...ys);
  var ymax = Math.max(...ys);

  // console.log({"xmin": xmin, "ymin": ymin, "xmax": xmax, "ymax": ymax});
  return {"xmin": xmin, "ymin": ymin, "xmax": xmax, "ymax": ymax};
}

function popupContent(feature, layer) {
  let popup = new L.Popup();

  // --- Properties & display name ---
  const props = feature.properties || {};
  const name =
    props.name_en ||
    props.gnd_n ||
    props.dsd_n ||
    props.dist_n ||
    props.prov_n ||
    "No name";

  // --- Skip certain keys from popup table ---
  const skipKeys = new Set([
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
  ]);

  // --- Build attribute rows ---
  let rows = "";
  for (const [key, value] of Object.entries(props)) {
    if (!skipKeys.has(key)) {
      rows += `
        <tr>
          <th style="text-align:left; padding-right: 10px;">${key}</th>
          <td>${value}</td>
        </tr>`;
    }
  }

  // --- Detect if this is a point ---
  const isPoint = typeof layer.getLatLng === "function";

  // --- Popup HTML ---
  const popupHtml = `
    <div class="card border-0" style="width: 18rem;">
      <div class="card-body">
        ${!isPoint ? `<h5 class="card-title">${name}</h5>` : ""}
        ${
          rows
            ? `<table class="table table-sm"><tbody>${rows}</tbody></table>`
            : "<p>No additional attributes</p>"
        }
      </div>
    </div>
  `;

  // --- Set popup position ---
  if (isPoint) {
    popup.setLatLng(layer.getLatLng());
  } else if (typeof layer.getBounds === "function") {
    popup.setLatLng(layer.getBounds().getCenter());
  }

  popup.setContent(popupHtml);
  return popup;
}

function updateMap(poly, attr = null) {
  if (window.currentGeoLayer) {
    window.map.removeLayer(window.currentGeoLayer);
  }

  const svgIcon = L.divIcon({
    className: "custom-marker", // optional CSS class
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" fill="blue" stroke="black" stroke-width="2" />
      </svg>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12], // center the icon
  });

  window.currentGeoLayer = new L.GeoJSON(poly, {
    style: function (feature) {
      if (feature.geometry.type !== "Point") {
        return {
          color: "blue",
          fillColor: "lightblue",
          fillOpacity: 0.5,
          weight: 2,
        };
      }
    },

    // For points, use a custom marker
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, { icon: svgIcon });
    },

    // Attach popups for all features
    onEachFeature: function (feature, layer) {
      layer.on("click", function (e) {
        const popup = popupContent(feature, layer);
        window.map.openPopup(popup);
      });
    },
  });

  window.map.addLayer(window.currentGeoLayer);
  // window.map.fitBounds(window.currentGeoLayer.getBounds());
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
