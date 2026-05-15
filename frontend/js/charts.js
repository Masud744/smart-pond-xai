let historyChartInstance = null;

function initChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    
    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Time labels
            datasets: [
                {
                    label: 'Temperature (°C)',
                    borderColor: '#f64e60',
                    backgroundColor: 'rgba(246, 78, 96, 0.1)',
                    data: [],
                    yAxisID: 'y',
                    pointRadius: 3,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'pH Level',
                    borderColor: '#1bc5bd',
                    backgroundColor: 'rgba(27, 197, 189, 0.1)',
                    data: [],
                    yAxisID: 'y1',
                    pointRadius: 3,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Temperature (°C)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'pH Level' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function updateChart(historyData) {
    if (!historyChartInstance) return;

    // Filter to limit data points if there's too much data (Optional)
    const labels = historyData.map(d => {
        const date = new Date(d.time);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });

    const temps = historyData.map(d => d.temperature);
    const phVals = historyData.map(d => d.ph);
    // You could also add Turbidity as a 3rd dataset

    historyChartInstance.data.labels = labels;
    historyChartInstance.data.datasets[0].data = temps;
    historyChartInstance.data.datasets[1].data = phVals;
    
    historyChartInstance.update();
}