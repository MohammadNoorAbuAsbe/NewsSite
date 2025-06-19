let backgroundTimeout;
let backgroundInterval;
let currentMovies = [];
const FALLBACK_BACKGROUND = "linear-gradient(135deg, #0a0a0a 0%, #182848 100%)";
const INVALID_IMAGES = new Set();

function setBackgroundImage(url) {
    if (!url || INVALID_IMAGES.has(url)) {
        $('body').css('--background-image', FALLBACK_BACKGROUND);
        $('body').addClass('background-active');
        return;
    }

    const testImage = new Image();
    testImage.onload = () => {
        $('body').css('--background-image', `url(${url})`);
        $('body').addClass('background-active');
    };
    testImage.onerror = () => {
        INVALID_IMAGES.add(url);
        $('body').css('--background-image', FALLBACK_BACKGROUND);
        $('body').addClass('background-active');
    };
    testImage.src = url;
}


function startBackgroundRotation(movies) {
    currentMovies = movies;
    clearInterval(backgroundInterval);

    const initialMovie = movies[Math.floor(Math.random() * movies.length)];
    setBackgroundImage(initialMovie.primaryImage);

    backgroundInterval = setInterval(() => {
        const randomMovie = currentMovies[Math.floor(Math.random() * currentMovies.length)];
        setBackgroundImage(randomMovie.primaryImage);
    }, 8000);
}

function renderMovieCards(
    buttonText,
    onButtonClick,
    container,
    movies,
    deleteHandler
) {
    const user = GetLoggedInUser();
    // Use a document fragment to improve performance by minimizing DOM reflows
    const fragment = document.createDocumentFragment();

    movies.forEach(movie => {
        const movieCard = $('<div>').addClass('movie-card');
        const movieImage = $('<img>')
            .attr('src', movie.primaryImage)
            .attr('alt', movie.primaryTitle);

        const movieTitle = $('<h3>').text(`${movie.primaryTitle} (${getYearFromDate(movie.releaseDate)})`);
        const movieDescription = $('<p>').text(movie.description);

        const ratingBadge = createMovieBadge(movie.averageRating, 'rating-badge', '⭐');
        const votesBadge = createMovieBadge(`${numberWithCommas(parseInt(movie.numVotes))} Votes`, 'votes-badge');
        const runtimeBadge = createMovieBadge(`${movie.runtimeMinutes} min`, 'runtime-badge');

        const genresContainer = $('<div>').addClass('genres-container')
            .append(createGenreChips(movie.genres));

        const primaryContent = $('<div>').addClass('primary-content').append(
            movieImage,
            movieTitle,
            ratingBadge,
            genresContainer,
            runtimeBadge,
            votesBadge
        );

        const secondaryContent = $('<div>').addClass('secondary-info').append(
            movieDescription,
            createDetailElement('Language', movie.language),
            createDetailElement('For Adults?', movie.isAdult ? 'Yes' : 'No'),
            createDetailElement('Release Date', movie.releaseDate ? formatDate(movie.releaseDate) : 'N/A'),
            createDetailElement('Budget', movie.budget && movie.budget !== -1 ? numberWithCommas(parseInt(movie.budget)) : 'N/A'),
            createDetailElement('Gross', movie.grossWorldwide && movie.grossWorldwide !== -1 ? numberWithCommas(parseInt(movie.grossWorldwide)) : 'N/A'),
            createDetailElement('Price to Rent', movie.priceToRent && movie.priceToRent !== -1 ? numberWithCommas(parseInt(movie.priceToRent)) : 'N/A'),
        );

        if (movie.totalPrice !== undefined) {
            secondaryContent.append(createDetailElement('Total Rent Price', `$${movie.totalPrice}`));
        }
        if (movie.rentStart) {
            secondaryContent.append(createDetailElement('Rented From', formatDate(movie.rentStart)));
        }
        if (movie.rentEnd) {
            secondaryContent.append(createDetailElement('Rented To', formatDate(movie.rentEnd)));
        }
        

        const actionButton = $('<button>').addClass('btn')
            .text(buttonText)
            .on('click', () => {
                if (!user) {
                    window.location.href = 'login.html';
                } else {
                    onButtonClick(movie);
                }
            });

        
    
        movieCard.append(primaryContent, secondaryContent, actionButton);
        if (typeof deleteHandler === 'function') {
            const deleteButton = $('<button>')
                .addClass('btn')
                .text('Delete')
                .on('click', (e) => {
                    e.stopPropagation();
                    deleteHandler(movie, user);
                });
            movieCard.append(deleteButton);
        }
        fragment.appendChild(movieCard[0]);
    });

    $(container).append(fragment);
    $('.movie-card').hover(
        function () {
            clearTimeout(backgroundTimeout);
            clearInterval(backgroundInterval);
            const movieImage = $(this).find('img').attr('src');
            setBackgroundImage(movieImage);
        },
        function () {
            backgroundTimeout = setTimeout(() => {
                startBackgroundRotation(currentMovies);
            }, 1000);
        }
    );

    startBackgroundRotation(movies);
}