let movies = [];
let currentPage = 1;
const moviesPerPage = 10;
let totalPages = 0;
let filterTitle = null;
let filterFromDate = null;
let filterToDate = null;
let currentRentMovie = null;

$(document).ready(SetupPage);

function SetupPage()
{
    $('#loadBtn').click(function () {
        $(this).hide();
        $('#paginationControls').show();
        GetMovies(currentPage, moviesPerPage);
        $('#title').text("All Movies");
    });
    document.body.style.setProperty('--background-image', 'none');
    SetUpPaginationControls();
    clearActiveFilter();
    setupFilterHandlers();
    // Calculate cost on date change
    $('#rentUntilInput').on('input', function () {
        if (!currentRentMovie) return;
        const endDate = new Date(this.value);
        const now = new Date();
        const days = Math.max(1, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
        const cost = (currentRentMovie.priceToRent || 0) * days;
        $('#rentCost').text(isNaN(cost) ? 0 : cost);
    });

    // Handle form submit
    $('#rentMovieForm').on('submit', function (e) {
        e.preventDefault();
        if (!currentRentMovie) return;
        const endDateStr = $('#rentUntilInput').val();
        if (!endDateStr) {
            showNotification("Please select a date.", "error");
            return;
        }
        const endDate = new Date(endDateStr);
        if (endDate <= new Date()) {
            showNotification("Please select a future date.", "error");
            return;
        }
        rentMovie(currentRentMovie.id, endDateStr, null);
        closeRentOverlay();
    });

    // Close popup
    $('#closeRentPopup').on('click', closeRentOverlay);

    $('#rentOverlay').on('click', function (e) {
        if (e.target === this) closeRentOverlay();
    });

}

function rentMovie(movieId, rentEnd, rentForm) {
    const user = GetLoggedInUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const rentRequest = {
        userId: user.id,
        movieId: movieId,
        rentEnd: rentEnd
    };
    ajaxCall(
        "POST",
        urls.movies.rentMovie,
        JSON.stringify(rentRequest),
        function (response) {
            showNotification("🎉 Movie rented successfully!", "success");
            if (rentForm) rentForm.hide();
        },
        function (error) {
            const errorMessage = getErrorMessage(error);
            showNotification(errorMessage, "error");
        }
    );
}

function GetMovies(page, pageSize, title = null, fromDate = null, toDate = null) {
    ajaxCall(
        'GET',
        urls.movies.getPaginatedMovies,
        { currentPage: page, pageSize: pageSize, title: title, fromDate: fromDate, toDate: toDate},
        (response) => {
            movies = response.movies;
            totalPages = response.totalPages;
            $('#moviesContainer').empty();
            renderMovieCards('Rent Me', openRentOverlay, $('#moviesContainer'), movies);
            updatePaginationControls();
        },
        (error) => {
            showNotification("Error fetching movies", "error");
        }
    );
}


function updatePaginationControls() {
    $('#pageInfo').hide();
    $('#prevBtn').prop('disabled', currentPage === 1);
    $('#nextBtn').prop('disabled', currentPage === totalPages);

    const maxPageButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = startPage + maxPageButtons - 1;
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    const $pageNumbers = $('#pageNumbers');
    $pageNumbers.empty();

    if (startPage > 1) {
        $pageNumbers.append(`<span>...</span>`);
    }

    pageNumbers.forEach(page => {
        const btn = $('<button>')
            .addClass('page-number-btn')
            .toggleClass('active', page === currentPage)
            .text(page)
            .prop('disabled', page === currentPage)
            .on('click', function () {
                if (page !== currentPage) {
                    currentPage = page;
                    GetMovies(currentPage, moviesPerPage, filterTitle, filterFromDate, filterToDate);
                }
            });
        $pageNumbers.append(btn);
    });

    if (endPage < totalPages) {
        $pageNumbers.append(`<span>...</span>`);
    }
}

function SetUpPaginationControls() {
    $('#prevBtn').on('click', () => {
        if (currentPage > 1) {
            currentPage--;
            GetMovies(currentPage, moviesPerPage, filterTitle, filterFromDate, filterToDate);
            
        }
    });

    $('#nextBtn').on('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            GetMovies(currentPage, moviesPerPage, filterTitle, filterFromDate, filterToDate);
        }
    });
}

function setActiveFilter(filterText) {
    const activeFilter = $('#activeFilter');
    activeFilter.html(`
        <span>${filterText}</span>
        <button id="clearFilterBtn">X</button>
    `).show();

    $('#clearFilterBtn').click(clearFilter);
}

function setupFilterHandlers() {
    const filterTitleInput = $('#filterTitle');
    const filterTitleBtn = $('#filterTitleBtn');
    const startDateInput = $('#startDate');
    const endDateInput = $('#endDate');
    const filterDateBtn = $('#filterDateBtn');

    filterTitleBtn.prop('disabled', true);
    filterDateBtn.prop('disabled', true);

    filterTitleInput.on('input', function () {
        filterTitleBtn.prop('disabled', $(this).val().trim() === '');
    });

    startDateInput.add(endDateInput).on('input', function () {
        filterDateBtn.prop('disabled', startDateInput.val() === '' || endDateInput.val() === '');
    });

    filterTitleBtn.click(() => { filterMoviesByTitle(filterTitleInput.val()) });
    filterDateBtn.click(() => filterMoviesByDate(startDateInput.val(), endDateInput.val()));
    $('#clearFilterBtn').click(clearFilter);
}


function clearActiveFilter() {
    const activeFilter = $('#activeFilter');
    activeFilter.hide().empty();
}

function clearFilter() {
    $('#filterTitle').val('').trigger('input');
    $('#startDate').val('').trigger('input');
    $('#endDate').val('').trigger('input');
    currentPage = 1;
    filterTitle = null;
    filterFromDate = null;
    filterToDate = null;
    GetMovies(currentPage, moviesPerPage);
    clearActiveFilter();
}

function filterMoviesByTitle(title) {
    currentPage = 1;
    filterTitle = title || null;
    filterFromDate = null;
    filterToDate = null;
    GetMovies(currentPage, moviesPerPage, filterTitle, filterFromDate, filterToDate);
    setActiveFilter(`🔍 Filter applied: Movies with the title "${title}"`);
}

function filterMoviesByDate(startDate, endDate) {
    currentPage = 1;
    filterTitle = null;
    filterFromDate = startDate || null;
    filterToDate = endDate || null;
    GetMovies(currentPage, moviesPerPage, filterTitle, filterFromDate, filterToDate);
    setActiveFilter(`📅 Filter applied: Movies released between ${formatDate(startDate)} and ${formatDate(endDate)}`);
}



function openRentOverlay(movie) {
    currentRentMovie = movie;
    const todayStr = new Date().toISOString().split('T')[0];
    $('#rentUntilInput').val('').attr('min', todayStr);
    $('#rentCost').text('0');
    $('#rentOverlay').fadeIn(150);
}

function closeRentOverlay() {
    $('#rentOverlay').fadeOut(150);
    currentRentMovie = null;
}

