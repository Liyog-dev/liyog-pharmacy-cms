// reset-password.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://snwwlewjriuqrodpjhry.supabase.co";
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNud3dsZXdqcml1cXJvZHBqaHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDY3MDAsImV4cCI6MjA2ODE4MjcwMH0.WxOmEHxLcEHmMKFjsgrzcb22mPs-sJwW_G3GOuXX2c8";
 // Replace with your project URL
  // Replace with your anon public key
);

window.handlePasswordReset = async () => {
  const password = document.getElementById("newPassword").value.trim();
  const messageBox = document.getElementById("messageBox");

  if (password.length < 6) {
    messageBox.textContent = "Password must be at least 6 characters.";
    messageBox.className = "message error";
    return;
  }

  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    messageBox.textContent = error.message;
    messageBox.className = "message error";
  } else {
    messageBox.textContent = "Password updated successfully! You can now log in.";
    messageBox.className = "message success";
  }
};

// Handle access token (needed for updateUser to work)
const hash = window.location.hash;
if (hash && hash.includes("access_token")) {
  const accessToken = new URLSearchParams(hash.substring(1)).get("access_token");
  if (accessToken) {
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: "", // Leave blank, Supabase only needs access_token for reset
    });
  }
}
