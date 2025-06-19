// Configuration Constants
const CONFIG = {
    localhost: {
        moviesBaseURL: `https://localhost:${7259}/api/Movies`,
        usersBaseURL: `https://localhost:${7259}/api/Users`,
    },
    production: {
        moviesBaseURL: 'https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/Movies',
        usersBaseURL: 'https://proj.ruppin.ac.il/cgroup10/test2/tar1/api/Users',
    },
};

const isLocalHost = ["localhost", "127.0.0.1"].includes(location.hostname);
const MOVIES_SERVER_PATH = isLocalHost ? CONFIG.localhost.moviesBaseURL : CONFIG.production.moviesBaseURL;
const USERS_SERVER_PATH = isLocalHost ? CONFIG.localhost.usersBaseURL : CONFIG.production.usersBaseURL;

// Movies Endpoints
const MOVIES_ENDPOINTS = {
    BASE: () => `${MOVIES_SERVER_PATH}`,
    ADD_NEW_MOVIE: () => `${MOVIES_ENDPOINTS.BASE()}/addNewMovie`,
    CART: () => `${MOVIES_ENDPOINTS.BASE()}/cart`,
    DELETE: () => `${MOVIES_ENDPOINTS.BASE()}/deleteRented`,
    FILTER_BY_TITLE: () => `${MOVIES_ENDPOINTS.BASE()}/getByTitle`,
    FILTER_BY_DATE: () => `${MOVIES_ENDPOINTS.BASE()}/filterByDate`,
    GET_ALL_MOVIES: () => `${MOVIES_ENDPOINTS.BASE()}`,
    GET_PAGINATED_MOVIES: () => `${MOVIES_ENDPOINTS.BASE()}/getPaginatedMovies`,
    GET_RENTED_MOVIES: () => `${MOVIES_ENDPOINTS.BASE()}/GetRentedMovies`,
    RENT_MOVIE: () => `${MOVIES_ENDPOINTS.BASE()}/rentMovie`,
    PASS_MOVIE: () => `${MOVIES_ENDPOINTS.BASE()}/passMovie`,
};

// User Endpoints
const USER_ENDPOINTS = {
    BASE: () => `${USERS_SERVER_PATH}`,
    REGISTER: () => `${USER_ENDPOINTS.BASE()}/register`,
    LOGIN: () => `${USER_ENDPOINTS.BASE()}/login`,
    UPDATE: () => `${USER_ENDPOINTS.BASE()}/Update`,
};

// URL Constants
const urls = {
    movies: {
        base: MOVIES_ENDPOINTS.BASE(),
        addNewMovie: MOVIES_ENDPOINTS.ADD_NEW_MOVIE(),
        getCart: MOVIES_ENDPOINTS.CART(),
        delete: MOVIES_ENDPOINTS.DELETE(),
        filterByTitle: MOVIES_ENDPOINTS.FILTER_BY_TITLE(),
        filterByDate: MOVIES_ENDPOINTS.FILTER_BY_DATE(),
        getAllMovies: MOVIES_ENDPOINTS.GET_ALL_MOVIES(),
        getPaginatedMovies: MOVIES_ENDPOINTS.GET_PAGINATED_MOVIES(),
        getRentedMovies: MOVIES_ENDPOINTS.GET_RENTED_MOVIES(),
        rentMovie: MOVIES_ENDPOINTS.RENT_MOVIE(),
        passMovie: MOVIES_ENDPOINTS.PASS_MOVIE()
    },
    users: {
        base: USER_ENDPOINTS.BASE(),
        register: USER_ENDPOINTS.REGISTER(),
        login: USER_ENDPOINTS.LOGIN(),
        update: USER_ENDPOINTS.UPDATE()
    },
};
