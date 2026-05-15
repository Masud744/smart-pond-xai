let lastAlertStatus = 'GOOD';

function checkAndShowAlerts(status) {
    if (status === lastAlertStatus) return; // Prevent spamming the same alert
    
    lastAlertStatus = status;

    if (status === 'POOR') {
        Swal.fire({
            icon: 'error',
            title: 'Critical Warning!',
            text: 'Water quality is currently POOR. Immediate action is required!',
            confirmButtonColor: '#f64e60'
        });
    } else if (status === 'MODERATE') {
        Swal.fire({
            icon: 'warning',
            title: 'Attention',
            text: 'Water quality is MODERATE. Consider turning on the motors/aerators.',
            confirmButtonColor: '#ffa800'
        });
    } else if (status === 'GOOD') {
        Swal.fire({
            icon: 'success',
            title: 'All Good!',
            text: 'Water quality has returned to GOOD.',
            confirmButtonColor: '#1bc5bd',
            timer: 3000,
            showConfirmButton: false
        });
    }
}