$(document).ready(SetupPage);
let validGenres = []
function SetupPage() {
    ForceRedirectToHome();
    validGenres = Array.from(document.getElementById('genres-choices').options).map(opt => opt.value);
    $("#movieForm").submit(submitWithoutReload);
    $("#budget").on("blur", checkBudget);
    $("#budget").on("input", checkBudget);
    $("#genres").on("blur", checkGenres);
    $("#genres").on("input", checkGenres);
    $("#language").on("blur", checkLanguage);
    $("#language").on("input", checkLanguage);
    $("#averageRating").on("input", validateRating);
}


function validateRating() {
    const rating = parseFloat(this.value);
    if (rating < 0 || rating > 10) {
        this.setCustomValidity('Rating must be between 0.0 and 10.0');
    } else {
        this.setCustomValidity('');
    }
    this.reportValidity();
}


let averageRating = 0;
if ($("#averageRating").val()) {
    averageRating = parseFloat($("#averageRating").val());
    averageRating = Math.min(10, Math.max(0, averageRating));
    averageRating = parseFloat(averageRating.toFixed(1));
}

document.addEventListener("DOMContentLoaded", function () {
    const separator = ',';

    for (const input of document.getElementsByTagName("input")) {
        if (!input.multiple) {
            continue;
        }

        if (input.list instanceof HTMLDataListElement) {
            const optionsValues = Array.from(input.list.options).map(opt => opt.value);
            let valueCount = input.value.split(separator).length;

            input.addEventListener("input", () => {
                const currentValueCount = input.value.split(separator).length;

                // Do not update list if the user doesn't add/remove a separator
                // Current value: "a, b, c"; New value: "a, b, cd" => Do not change the list
                // Current value: "a, b, c"; New value: "a, b, c," => Update the list
                // Current value: "a, b, c"; New value: "a, b" => Update the list
                if (valueCount !== currentValueCount) {
                    const lsIndex = input.value.lastIndexOf(separator);
                    const str = lsIndex !== -1 ? input.value.substr(0, lsIndex) + separator : "";
                    filldatalist(input, optionsValues, str);
                    valueCount = currentValueCount;
                }
            });
        }
    }

    function filldatalist(input, optionValues, optionPrefix) {
        const list = input.list;
        if (list && optionValues.length > 0) {
            list.innerHTML = "";

            const usedOptions = optionPrefix.split(separator).map(value => value.trim());

            for (const optionsValue of optionValues) {
                if (usedOptions.indexOf(optionsValue) < 0) { // Skip used values
                    const option = document.createElement("option");
                    option.value = optionPrefix + optionsValue;
                    list.append(option);
                }
            }
        }
    }
});

function checkBudget() {
    if (this.value < 100000) {
        this.validity.valid = false;
        this.setCustomValidity('Budget should be at least 100,000');
    }
    else {
        this.validity.valid = true;
        this.setCustomValidity('');
    }
}


function AddMovie() {
    let year = 0;
    if ($("#year").val()) {
        year = parseInt($("#year").val());
    }
    let budget = 0;
    if ($("#budget").val()) {
        budget = parseFloat($("#budget").val());
    }
    let grossWorldwide = 0;
    if ($("#grossWorldwide").val()) {
        grossWorldwide = parseFloat($("#grossWorldwide").val());
    }
    let runtimeMinutes = 0;
    if ($("#runtimeMinutes").val()) {
        runtimeMinutes = parseInt($("#runtimeMinutes").val());
    }
    let averageRating = 0;
    if ($("#averageRating").val()) {
        averageRating = parseFloat($("#averageRating").val());
    }
    let numVotes = 0;
    if ($("#numVotes").val()) {
        numVotes = parseInt($("#numVotes").val());
    }
    const movie = {
        id: 0,
        url: $("#url").val(),
        primaryTitle: $("#primaryTitle").val(),
        description: $("#description").val(),
        primaryImage: $("#primaryImage").val(),
        year: year,
        releaseDate: $("#releaseDate").val(),
        language: $("#language").val(),
        budget: budget,
        grossWorldwide: grossWorldwide,
        genres: $("#genres").val(),
        isAdult: $("#isAdult").is(':checked'),
        runtimeMinutes: runtimeMinutes,
        averageRating: averageRating,
        numVotes: numVotes,
        deletedAt: null,
        priceToRent: 0,
        rentalCount: 0
    }

    const user = GetLoggedInUser();
    if (user == null) {
        window.location.href = "login.html";
    }


    ajaxCall("POST", urls.movies.addNewMovie, JSON.stringify(movie), success, error);
    return false;
}

function success(data) {
    showNotification("Movie added successfully!", "success");
}

function error(err) {
    const errorMessage = getErrorMessage(err);
    showNotification(errorMessage, "error");
}

function submitWithoutReload() {
    AddMovie();
    return false;
}

function checkGenres() {
    const inputValue = this.value.trim();
    const pattern = /^(?!.*,,)(?!^,)(?!.*,$)[a-zA-Z-]+(?:,[a-zA-Z-]+)*$/;
    const isValidFormat = pattern.test(inputValue);
    let allGenresValid = isValidFormat;

    if (isValidFormat) {
        const genres = inputValue.split(',').map(g => g.trim());
        allGenresValid = genres.every(genre => validGenres.includes(genre));
    }

    if (!allGenresValid) {
        this.setCustomValidity('Genres must be selected from the provided list and separated by commas.');
        this.validity.valid = false;
    } else {
        this.setCustomValidity('');
        this.validity.valid = true;
    }
    this.reportValidity();
}

function checkLanguage() {
    let isValidInput = Array.from(document.getElementById('language-choices').options).map(opt => opt.value).includes(this.value);

    if (!isValidInput) {
        this.setCustomValidity('The Language must be selected from the provided list');
        this.validity.valid = false;
    } else {
        this.setCustomValidity('');
        this.validity.valid = true;
    }
    this.reportValidity();
}