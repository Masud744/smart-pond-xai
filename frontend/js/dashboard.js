let currentStatus = null;

// DOM Elements
const elTemp = document.getElementById('temp-val');
const elPh = document.getElementById('ph-val');
const elTurb = document.getElementById('turb-val');
const elWeather = document.getElementById('weather-val');
const elStatus = document.getElementById('overall-status');

async function updateDashboard() {
    // Fetch latest data (Sensor + Weather)
    const data = await fetchDashboardData();
    
    if (data && data.sensor) {
        // Update KPI Cards
        elTemp.innerText = `${data.sensor.temperature.toFixed(1)} °C`;
        elPh.innerText = data.sensor.ph.toFixed(2);
        elTurb.innerText = `${data.sensor.turbidity} %`;
        
        // Update Status Badge
        updateStatusBadge(data.sensor.status);
        
        // Check and trigger alerts
        checkAndShowAlerts(data.sensor.status);
    }
    
    if (data && data.weather) {
        elWeather.innerText = `${data.weather.temperature.toFixed(1)} °C, ${data.weather.description}`;
    }
}

async function loadHistory() {
    const historyRes = await fetchHistoryData(24); // Fetch 24 hours of data
    if (historyRes && historyRes.data) {
        updateChart(historyRes.data);
    }
}

function updateStatusBadge(status) {
    elStatus.innerText = `Status: ${status}`;
    elStatus.className = 'status-badge'; // Reset classes
    
    if (status === 'GOOD') elStatus.classList.add('status-good');
    else if (status === 'MODERATE') elStatus.classList.add('status-mod');
    else if (status === 'POOR') elStatus.classList.add('status-poor');
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    
    // Initial fetch
    updateDashboard();
    loadHistory();
    
    // Auto refresh every 10 seconds for real-time vibe
    setInterval(updateDashboard, 10000);
    
    // Refresh history chart every 5 minutes
    setInterval(loadHistory, 300000);
});