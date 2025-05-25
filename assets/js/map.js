import 'leaflet';
// import 'leaflet/dist/leaflet.css';

const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");


if (!gl) {
    document.getElementById("webgl-warning").classList.remove("d-none");
    throw new Error("WebGL not supported. Stopping script.");
} 

window.map = L.map('map').setView([7.9, 80.7], 8);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

