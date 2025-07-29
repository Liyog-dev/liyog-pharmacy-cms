
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://snwwlewjriuqrodpjhry.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNud3dsZXdqcml1cXJvZHBqaHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDY3MDAsImV4cCI6MjA2ODE4MjcwMH0.WxOmEHxLcEHmMKFjsgrzcb22mPs-sJwW_G3GOuXX2c8";
// replace with your actual anon key
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const messageBox = document.getElementById("auth-message");

// Helper to show message
function showMessage(msg, isError = true) {
  messageBox.style.color = isError ? "red" : "green";
  messageBox.textContent = msg;
}

// -------------------- Sign Up -----------------------
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("");

  const username = document.getElementById("signup-username").value;
  const phone = document.getElementById("signup-phone").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { username, phone } }
  });

  console.log("Signup result:", data, error);

  if (error) {
    showMessage(error.message);
  } else {
    showMessage("Signup successful! Redirecting…", false);
    setTimeout(() => window.location.href = "dashboard.html", 1500);
  }
});

// -------------------- Login -----------------------
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("");

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  console.log("Login result:", data, error);

  if (error) {
    showMessage("Login failed: " + error.message);
  } else {
    showMessage("Login successful! Redirecting…", false);
    setTimeout(() => window.location.href = "dashboard.html", 1500);
  }
});

// -------------------- Password Reset -----------------------
document.getElementById("forgot-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("");

  const email = document.getElementById("forgot-email").value;
  const { data, error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: "auth.html"
  });

  console.log("Reset request:", data, error);

  if (error) {
    showMessage(error.message);
  } else {
    showMessage("Password reset email sent!", false);
  }
});

// -------------------- Auto-Redirect if Already Logged In -----------------------
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await client.auth.getSession();
  console.log("Session on load:", session);
  if (session) {
    window.location.href = "dashboard.html";
  }
});
