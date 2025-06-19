$(document).ready(setupListeners);

function setupListeners() {
    const container = document.getElementById('container');
    const openRegister = document.getElementById('openRegister');
    const openLogin = document.getElementById('openLogin');
    const blackCoverText = document.querySelector('.black-cover h1');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const continueAsGuestButtons = document.querySelectorAll('.continue-as-guest');

    continueAsGuestButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    });

    openRegister.addEventListener('click', () => {
        showRelatedForm('shift-left', 'shift-right', 'Join Us and Start Your Journey!', registerForm, loginForm);
    });

    openLogin.addEventListener('click', () => {
        showRelatedForm('shift-right', 'shift-left', 'Welcome Back, We Missed You!', loginForm, registerForm);
    });

    $("#loginForm").submit(loginUser);

    $("#registerForm").submit(registerUser);

   
    function showRelatedForm(containerRemovedClass, containerAddedClass, textContent, formShown, formHidden) {
        container.classList.remove(containerRemovedClass);
        container.classList.add(containerAddedClass);
        blackCoverText.textContent = textContent;
        formShown.classList.add('show');
        formHidden.classList.remove('show');
        return false;
    }

    function loginUser()
    {
        const submitButton = $("#loginButton");
        submitButton.prop("disabled", true);

        const email = $("#loginEmail").val();
        const password = $("#loginPassword").val();

        const credentials = {
            email: email,
            password: password
        };

        HandleUserAction(credentials, submitButton, "🎉 Login successful! Redirecting to the homepage...", urls.users.login);

        return false;
    }

    function registerUser()
    {
        const submitButton = $("#registerButton");
        submitButton.prop("disabled", true);

        const name = $("#createName").val();
        const email = $("#createEmail").val();
        const password = $("#createPassword").val();

        const user = {
            id: 0,
            name: name,
            email: email,
            password: password,
            active: true
        };

        HandleUserAction(user, submitButton, "🎉 Registration successful! Redirecting to the homepage...", urls.users.register, true);

        return false;
    }

    function HandleUserAction(data, submitButton, notificationText, apiEndpoint, isRegister = false) {
        ajaxCall("POST", apiEndpoint, JSON.stringify(data), function (res) {
            showNotification(notificationText, "success");
                saveUser(res);
            setTimeout(() => {
                window.location.replace("index.html");
            }, 2000);
        }, function (err) {
            const errorMessage = getErrorMessage(err);
            showNotification(errorMessage, "error");
            submitButton.prop("disabled", false);
        });
    }
}