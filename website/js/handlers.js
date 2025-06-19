function handleSuccess(response, successMessage, infoMessage) {
    const message = response ? successMessage : infoMessage;
    const type = response ? 'success' : 'info';
    showNotification(message, type);
}

function handleError(error) {
    showNotification(`❌ ${getErrorMessage(error)}`, 'error');
}