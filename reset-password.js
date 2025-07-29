// reset-password.js

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ✅ Use your actual project URL and anon key here
const supabase = createClient(
  "https://snwwlewjriuqrodpjhry.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNud3dsZXdqcml1cXJvZHBqaHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDY3MDAsImV4cCI6MjA2ODE4MjcwMH0.WxOmEHxLcEHmMKFjsgrzcb22mPs-sJwW_G3GOuXX2c8"
);

// ✅ Set access token from URL hash
const hash = window.location.hash;
if (hash.includes("access_token")) {
  const accessToken = new URLSearchParams(hash.substring(1)).get("access_token");
  const refreshToken = new URLSearchParams(hash.substring(1)).get("refresh_token");

  supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || "", // Optional
  });
}

window.handlePasswordReset = async () => {
  const password = document.getElementById("newPassword").value.trim();
  const messageBox = document.getElementById("messageBox");
  const resetBtn = document.getElementById("resetBtn");

  if (password.length < 6) {
    messageBox.textContent = "Password must be at least 6 characters.";
    messageBox.className = "message error";
    return;
  }

  resetBtn.disabled = true;
  resetBtn.textContent = "Resetting...";

  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    messageBox.textContent = error.message;
    messageBox.className = "message error";
    resetBtn.disabled = false;
    resetBtn.textContent = "Reset Password";
  } else {
    messageBox.textContent = "✅ Password updated successfully! Redirecting to login...";
    messageBox.className = "message success";

    // Redirect to login after short delay
    setTimeout(() => {
      window.location.href = "auth.html"; // 👈 change this if your login page has a different name
    }, 2500);
  }
};
