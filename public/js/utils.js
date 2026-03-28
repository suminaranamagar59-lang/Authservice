// public/js/utils.js
// Shared utility functions used across all pages

const API_BASE = "/api/auth";

/**
 * Makes an API request to the backend
 * @param {string} endpoint - API endpoint (e.g., "/login")
 * @param {string} method - HTTP method
 * @param {object} body - Request body
 * @param {string|null} token - JWT token if needed
 */
async function apiRequest(endpoint, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(API_BASE + endpoint, options);
  const data = await response.json();

  return { ok: response.ok, status: response.status, data };
}

/**
 * Shows an alert message box
 * @param {HTMLElement} el - The alert element
 * @param {string} message - Message text
 * @param {string} type - "success" | "error" | "info"
 */
function showAlert(el, message, type = "error") {
  el.textContent = message;
  el.className = `alert alert-${type} visible`;
}

/** Hides an alert box */
function hideAlert(el) {
  el.className = "alert";
}

/**
 * Sets a button to loading state (shows spinner)
 * @param {HTMLButtonElement} btn
 * @param {boolean} isLoading
 */
function setLoading(btn, isLoading) {
  if (isLoading) {
    btn.disabled = true;
    btn.classList.add("loading");
  } else {
    btn.disabled = false;
    btn.classList.remove("loading");
  }
}

/**
 * Shows a field-level error message
 * @param {HTMLInputElement} input
 * @param {HTMLElement} errorEl
 * @param {string} message
 */
function showFieldError(input, errorEl, message) {
  input.classList.add("error");
  errorEl.textContent = message;
  errorEl.classList.add("visible");
}

/** Clears field-level error */
function clearFieldError(input, errorEl) {
  input.classList.remove("error");
  errorEl.classList.remove("visible");
}

/**
 * Validates email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Calculates password strength (0-4)
 * Returns { score, label, color }
 */
function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Very Weak", color: "#e74c3c", width: "20%" },
    { label: "Weak",      color: "#e67e22", width: "40%" },
    { label: "Fair",      color: "#f1c40f", width: "60%" },
    { label: "Strong",    color: "#2ecc71", width: "80%" },
    { label: "Very Strong", color: "#27ae60", width: "100%" },
  ];
  return { score, ...levels[score] };
}

/**
 * Save JWT token to localStorage
 */
function saveToken(token) {
  localStorage.setItem("authToken", token);
}

/**
 * Get JWT token from localStorage
 */
function getToken() {
  return localStorage.getItem("authToken");
}

/**
 * Remove JWT token (logout)
 */
function removeToken() {
  localStorage.removeItem("authToken");
}

/**
 * Redirect to a page
 */
function redirect(url) {
  window.location.href = url;
}
