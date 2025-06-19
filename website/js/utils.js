function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const cleanDate = dateString.split('T')[0];
    const [year, month, day] = cleanDate.split('-');
    return `${day}-${month}-${year}`;
}

function getYearFromDate(dateString) {
    if (!dateString) return 'N/A';
    const cleanDate = dateString.split('T')[0];
    const [year] = cleanDate.split('-');
    return year;
}

const getErrorMessage = (error) => {
    if (error?.responseJSON?.errors) {
        const validationErrors = error.responseJSON.errors;
        const messages = Object.keys(validationErrors)
            .map((key) => validationErrors[key].join(' '))
            .join(' ');
        return messages;
    }
    if (error?.responseJSON?.message) return error.responseJSON.message;
    if (error?.status === 401 && error?.responseText) {
        return `Unauthorized: ${error.responseText}`;
    }
    if (error?.status) return `Error ${error.status}: ${error.statusText}`;
    return 'Oops! Something went wrong while processing your request.';
};

function GetLoggedInUser()
{
    const user = localStorage.getItem("user");
    if (user) {
        return JSON.parse(user);
    }
    return null;
}

function ForceRedirectToHome() {
    const user = GetLoggedInUser();
    if (!user) {
        window.location.href = 'login.html';
    }
    return user;
}

function saveUser(userData) {
    const user = { id: userData.id, name: userData.name, email: userData.email };
    localStorage.setItem("user", JSON.stringify(user));
}
