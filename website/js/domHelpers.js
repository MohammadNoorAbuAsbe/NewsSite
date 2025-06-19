// Creates a detail element with a label and value for display in the UI
const createDetailElement = (label, value) =>
    $('<div>').addClass('details-grid').append(
        $('<div>').addClass('detail-item').append(
            $('<div>').addClass('detail-label').text(label),
            $('<div>').addClass('detail-value').text(value)));

// Normalizes genres into an array and creates genre chips for display
const createGenreChips = (genres) => {
    let normalizedGenres;

    if (Array.isArray(genres)) {
        normalizedGenres = genres;
    } else if (genres) {
        normalizedGenres = genres.split(",");
    } else {
        normalizedGenres = [];
    }

    return normalizedGenres.map(genre =>
        $('<span>').addClass('genre-chip').text(genre.trim())
    );
};


const createMovieBadge = (content, className, icon = '') =>
    $('<div>').addClass(className)
        .html(`${icon} ${content}`);