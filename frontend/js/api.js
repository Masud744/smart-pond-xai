const API_BASE_URL = 'https://pond-management-backend.onrender.com/api';

async function fetchDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return null;
    }
}

async function fetchHistoryData(hours = 24) {
    try {
        const response = await fetch(`${API_BASE_URL}/history?hours=${hours}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching history data:', error);
        return null;
    }
}
