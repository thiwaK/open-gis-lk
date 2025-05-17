// import maplibregl from 'maplibre-gl';
import {Map} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

if (!gl) {
    document.getElementById("webgl-warning").classList.remove("d-none");
    throw new Error("WebGL not supported. Stopping script.");
} 


document.getElementById("map").classList.remove("d-none");
const map = new Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/style.json',
    center: [80.7, 7.9], // Approx. center of Sri Lanka
    zoom: 6,

    // Prevents panning outside this bounding box
    maxBounds: [
        [76, 5.5], // Southwest corner (Lng, Lat)
        [85, 10.2] // Northeast corner (Lng, Lat)
    ]
});



