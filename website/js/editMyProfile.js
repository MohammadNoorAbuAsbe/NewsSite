$(document).ready(setupListeners);

function setupListeners() {
    const user = ForceRedirectToHome();

    $("#updateName").val(user.name);
    $("#updateEmail").val(user.email);

    $("#goBack").click(() => window.location.href = 'index.html');

    $("#editProfileForm").submit(function (e) {
        e.preventDefault();

        const name = $("#updateName").val().trim();
        const email = $("#updateEmail").val().trim();
        const password = $("#updatePassword").val();

        const userToSend = {
            id: user.id,
            name: name,
            email: email,
            password: password || "",
            active: true,
            deletedAt: null
        };

        ajaxCall(
            "PUT",
            `${urls.users.update}/${user.id}`,
            JSON.stringify(userToSend),
            function (res) {
                showNotification("Profile updated successfully!", "success");
                console.log(res.name)
                saveUser(res);
                $("#updatePassword").val("");
            },
            function (err) {
                const errorMessage = getErrorMessage(err);
                showNotification(errorMessage, "error");
            }
        );
    });
}