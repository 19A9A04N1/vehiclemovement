let map;
let marker;
let route = [];
let currentIndex = 0;
let isPlaying = false;
let speed = 1; // 1x to 5x
let intervalId;
let startTime;
let elapsedTime = 0;

async function loadRoute() {
    const response = await fetch('dummy-route.json');
    route = await response.json();
}

function initMap() {
    map = L.map('map').setView([17.385044, 78.486671], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([route[0].latitude, route[0].longitude]).addTo(map);
    updateInfo(0);
}

function updateInfo(index) {
    const point = route[index];
    document.getElementById('lat').textContent = point.latitude.toFixed(6);
    document.getElementById('lon').textContent = point.longitude.toFixed(6);
    document.getElementById('timestamp').textContent = point.timestamp;

    // Calculate speed (simple approximation: distance / time)
    let speedValue = 0;
    if (index > 0) {
        const prevPoint = route[index - 1];
        const distance = getDistance(prevPoint.latitude, prevPoint.longitude, point.latitude, point.longitude);
        const timeDiff = (new Date(point.timestamp) - new Date(prevPoint.timestamp)) / 1000; // seconds
        speedValue = (distance / timeDiff) * 3600; // km/h
    }
    document.getElementById('speed-display').textContent = speedValue.toFixed(2) + ' km/h';

    // Elapsed time
    const elapsed = Math.floor(elapsedTime / 1000);
    const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('elapsed').textContent = `${hours}:${minutes}:${seconds}`;
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function animate() {
    if (currentIndex < route.length - 1) {
        currentIndex++;
        const point = route[currentIndex];
        marker.setLatLng([point.latitude, point.longitude]);
        map.setView([point.latitude, point.longitude]);
        updateInfo(currentIndex);
        elapsedTime += (new Date(point.timestamp) - new Date(route[currentIndex - 1].timestamp));
    } else {
        clearInterval(intervalId);
        isPlaying = false;
    }
}

document.getElementById('play').addEventListener('click', () => {
    if (!isPlaying) {
        isPlaying = true;
        startTime = Date.now() - elapsedTime;
        intervalId = setInterval(animate, 1000 / speed);
    }
});

document.getElementById('pause').addEventListener('click', () => {
    if (isPlaying) {
        clearInterval(intervalId);
        isPlaying = false;
    }
});

document.getElementById('reset').addEventListener('click', () => {
    clearInterval(intervalId);
    isPlaying = false;
    currentIndex = 0;
    elapsedTime = 0;
    const point = route[0];
    marker.setLatLng([point.latitude, point.longitude]);
    map.setView([point.latitude, point.longitude]);
    updateInfo(0);
});

document.getElementById('speed').addEventListener('click', () => {
    speed = speed < 5 ? speed + 1 : 1; // Cycle from 1 to 5
    document.getElementById('speed').textContent = `Speed: ${speed}x`;
    if (isPlaying) {
        clearInterval(intervalId);
        intervalId = setInterval(animate, 1000 / speed);
    }
});

window.onload = async () => {
    await loadRoute();
    initMap();
};
