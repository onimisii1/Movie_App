const API_KEY = "46d38d519f6a1899fd633e8f2e56511d";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

let currentUser = null;

const contentDiv = document.getElementById("content");
const homeLink = document.getElementById("home-link");
const favoritesLink = document.getElementById("favorites-link");
const profileLink = document.getElementById("profile-link");
const loginLink = document.getElementById("login-link");

homeLink.addEventListener("click", showHome);
favoritesLink.addEventListener("click", showFavorites);
profileLink.addEventListener("click", showProfile);
loginLink.addEventListener("click", showLogin);

async function showHome() {
  contentDiv.innerHTML = '<div class="loading">Loading...</div>';
  try {
    const trendingMovies = await fetchTrendingMovies();
    displayMovies(trendingMovies);
    addSearchBar();
  } catch (error) {
    showError("Failed to fetch trending movies. Please try again later.");
  }
}

function showFavorites() {
  if (!currentUser) {
    showError("Please log in to view favorites.");
    return;
  }
  const favorites = JSON.parse(
    localStorage.getItem(`favorites_${currentUser}`) || "[]"
  );
  displayMovies(favorites);
}

function showProfile() {
  if (!currentUser) {
    showError("Please log in to view your profile.");
    return;
  }

  const preferences = JSON.parse(
    localStorage.getItem(`preferences_${currentUser}`) || "{}"
  );
  contentDiv.innerHTML = `
                <h2>Your Profile</h2>
                <p>Username: ${currentUser}</p>
                <h3>Preferences</h3>
                <p>Favorite Genres: ${
                  preferences.genres
                    ? preferences.genres.join(", ")
                    : "None set"
                }</p>
                <button onclick="editPreferences()">Edit Preferences</button>
            `;
}

function showLogin() {
  contentDiv.innerHTML = `
                <h2>Login</h2>
                <input type="text" id="username" placeholder="Username">
                <input type="password" id="password" placeholder="Password">
                <button onclick="login()">Login</button>
                <p>Don't have an account? <a href="#" onclick="showSignup()">Sign up</a></p>
            `;
}

function showSignup() {
  contentDiv.innerHTML = `
                <h2>Sign Up</h2>
                <input type="text" id="newUsername" placeholder="Username">
                <input type="password" id="newPassword" placeholder="Password">
                <button onclick="signup()">Sign Up</button>
            `;
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const storedPassword = localStorage.getItem(`user_${username}`);
  if (storedPassword && storedPassword === password) {
    currentUser = username;
    loginLink.textContent = "Logout";
    loginLink.addEventListener("click", logout);
    showHome();
  } else {
    showError("Invalid username or password");
  }
}

function signup() {
  const username = document.getElementById("newUsername").value;
  const password = document.getElementById("newPassword").value;

  if (localStorage.getItem(`user_${username}`)) {
    showError("Username already exists");
  } else {
    localStorage.setItem(`user_${username}`, password);
    currentUser = username;
    loginLink.textContent = "Logout";
    loginLink.addEventListener("click", logout);
    showHome();
  }
}

function logout() {
  currentUser = null;
  loginLink.textContent = "Login";
  loginLink.removeEventListener("click", logout);
  loginLink.addEventListener("click", showLogin);
  showHome();
}

async function fetchTrendingMovies() {
  const response = await fetch(
    `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`
  );
  const data = await response.json();
  return data.results;
}

function displayMovies(movies) {
  contentDiv.innerHTML = '<div class="movie-grid"></div>';
  const movieGrid = contentDiv.querySelector(".movie-grid");
  movies.forEach((movie) => {
    const movieCard = document.createElement("div");
    movieCard.className = "movie-card";
    movieCard.innerHTML = `
                    <img src="${IMG_BASE_URL}${movie.poster_path}" alt="${movie.title}">
                    <div class="details">
                        <h3>${movie.title}</h3>
                        <p>Rating: ${movie.vote_average}</p>
                        <button onclick="toggleFavorite('${movie.id}')">♥</button>
                    </div>
                `;
    movieCard.addEventListener("click", () => showMovieDetails(movie.id));
    movieGrid.appendChild(movieCard);
  });
}

function addSearchBar() {
  const searchBar = document.createElement("input");
  searchBar.type = "text";
  searchBar.placeholder = "Search for movies...";
  searchBar.className = "search-bar";
  searchBar.addEventListener("input", debounce(searchMovies, 300));
  contentDiv.insertBefore(searchBar, contentDiv.firstChild);
}

async function searchMovies(event) {
  const searchTerm = event.target.value;
  if (searchTerm.length < 3) return;

  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${searchTerm}`
    );
    const data = await response.json();
    displayMovies(data.results);
  } catch (error) {
    showError("Failed to search movies. Please try again.");
  }
}

async function showMovieDetails(movieId) {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
    );
    const movie = await response.json();
    contentDiv.innerHTML = `
                    <h2>${movie.title}</h2>
                    <img src="${IMG_BASE_URL}${movie.poster_path}" alt="${movie.title}">
                    <p>${movie.overview}</p>
                    <p>Release Date: ${movie.release_date}</p>
                    <p>Rating: ${movie.vote_average}</p>
                    <button onclick="toggleFavorite('${movie.id}')">♥</button>
                    <button onclick="showHome()">Back to Home</button>
                `;
  } catch (error) {
    showError("Failed to fetch movie details. Please try again.");
  }
}

function toggleFavorite(movieId) {
  if (!currentUser) {
    showError("Please log in to add favorites.");
    return;
  }
  let favorites = JSON.parse(
    localStorage.getItem(`favorites_${currentUser}`) || "[]"
  );
  const index = favorites.findIndex((m) => m.id === movieId);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push({ id: movieId });
  }
  localStorage.setItem(`favorites_${currentUser}`, JSON.stringify(favorites));
}

function editPreferences() {
  contentDiv.innerHTML = `
                <h2>Edit Preferences</h2>
                <select id="genres" multiple>
                    <option value="action">Action</option>
                    <option value="comedy">Comedy</option>
                    <option value="drama">Drama</option>
                    <option value="scifi">Sci-Fi</option>
                </select>
                <button onclick="savePreferences()">Save Preferences</button>
            `;
}

function savePreferences() {
  const genres = Array.from(
    document.getElementById("genres").selectedOptions
  ).map((option) => option.value);
  localStorage.setItem(
    `preferences_${currentUser}`,
    JSON.stringify({ genres })
  );
  showProfile();
}

function showError(message) {
  contentDiv.innerHTML = `<p id="error-message">${message}</p>`;
}

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Initialize app
showHome();
