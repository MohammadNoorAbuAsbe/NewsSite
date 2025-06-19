// Notification System
let notificationTimeout;

function showNotification(message, type = 'info') {
    const notification = $('#notification');
    const animationDuration = 300;

    // Clear any existing timeouts and animations
    clearTimeout(notificationTimeout);
    notification.stop(true, true);

    notification
        .empty()
        .removeClass('success error info')
        .addClass(type)
        .append(
            $('<span>').text(message),
            $('<button>').addClass('notification-close')
                .html('&times;')
                .on('click', () => {
                    clearTimeout(notificationTimeout);
                    notification.fadeOut(animationDuration);
                })
        ).fadeIn(animationDuration);

    notificationTimeout = setTimeout(() => {
        notification.fadeOut(animationDuration);
    }, 5000);

    // Click outside handler
    $(document).off('click.notification').on('click.notification', (e) => {
        if (!notification.is(e.target) && !notification.has(e.target).length) {
            clearTimeout(notificationTimeout);
            notification.fadeOut(animationDuration);
            $(document).off('click.notification');
        }
    });
}