let user;
let currentRentMovie = null;
$(document).ready(function () {
    initializePage();
});

function initializePage() {
    user = ForceRedirectToHome();
    GetRentedMovies();
    fetchUsers();
    // Handle form submit
    $('#passMovieForm').on('submit', function (e) {
        e.preventDefault();
        if (!currentPassMovie) return;
        const newUserId = $('#userSelect').val();
        if (!newUserId) {
            showNotification("Please select a user.", "error");
            return;
        }
        passMovie(currentPassMovie.id, newUserId);
        closePassOverlay();
    });

    // Close popup
    $('#closePassPopup').on('click', closePassOverlay);

    $('#passOverlay').on('click', function (e) {
        if (e.target === this) closePassOverlay();
    });
}

function renderMovies(rentedMovies) {
    const moviesContainer = $('#moviesContainer');
    moviesContainer.empty();

    if (!rentedMovies || rentedMovies.length === 0) {
        showNotification('No movies found.', 'info');
        return;
    }

    const movies = rentedMovies.map(rm => {
        if (rm.movie) {
            rm.movie.rentStart = rm.rentStart;
            rm.movie.rentEnd = rm.rentEnd;
            rm.movie.totalPrice = rm.totalPrice;
        }
        return rm.movie;
    }).filter(m => m);

    renderMovieCards('Pass', openPassOverlay, moviesContainer, movies, deleteMovieWithUser);
}


function GetRentedMovies() {

    ajaxCall('GET', urls.movies.getRentedMovies, { userId: user.id }, renderMovies, handleError);
}

function deleteMovieWithUser(movie, user) {
    if (!user || !movie) return;
    const data = {
        userId: user.id,
        movieId: movie.id,
        rentEnd: movie.rentEnd
    };
    ajaxCall(
        'DELETE',
        urls.movies.delete,
        JSON.stringify(data),
        function (response) {
            handleSuccess(
                response,
                '🎉 Success! The movie has been deleted from your list.',
                'ℹ️ No changes were made. The movie might already be deleted.'
            );
            GetRentedMovies();
        },
        handleError
    );
}

function passMovie(movieId ,newUserId) {
    const data = {
        movieId: movieId,
        currentUserId: parseInt(user.id),
        newUserId: parseInt(newUserId)

    };

    ajaxCall('PUT', urls.movies.passMovie, JSON.stringify(data),
        (response) => {
            handleSuccess(
                response,
                '🎉 Success! The movie has been passed to the new user',
                'ℹ️ No changes were made.'
            );
            GetRentedMovies();
        }, handleError
    );

   
}

let users = [];

function fetchUsers() {
    ajaxCall('GET', urls.users.base, null, (response) => {
        users = response;
    }, handleError);
}

let currentPassMovie = null;

function openPassOverlay(movie) {
    currentPassMovie = movie;
    const userSelect = $('#userSelect');
    userSelect.empty();
    users
        .filter(u => u.id !== user.id)
        .forEach(u => {
            userSelect.append($('<option>').val(u.id).text(u.name + " (" + u.email + ")"));
        });
    $('#passOverlay').fadeIn(150);
}

function closePassOverlay() {
    $('#passOverlay').fadeOut(150);
    currentPassMovie = null;
}



