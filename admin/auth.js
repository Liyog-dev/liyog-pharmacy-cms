// Ensure Supabase client is loaded from config.js
const authMsg = document.getElementById("auth-message");

// Form containers
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const forgotForm = document.getElementById("forgot-form");

// Toggle buttons
const toggleSignup = document.getElementById("toggle-signup");
const toggleLogin = document.getElementById("toggle-login");
const toggleForgot = document.getElementById("toggle-forgot");
const formTitle = document.getElementById("form-title");

// -------------------- Form Switching -----------------------
toggleSignup.addEventListener("click", () => {
  loginForm.classList.add("hidden");
  forgotForm.classList.add("hidden");
  signupForm.classList.remove("hidden");
  formTitle.innerText = "Sign Up";
  toggleSignup.classList.add("hidden");
  toggleLogin.classList.remove("hidden");
});

toggleLogin.addEventListener("click", () => {
  signupForm.classList.add("hidden");
  forgotForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  formTitle.innerText = "Login";
  toggleSignup.classList.remove("hidden");
  toggleLogin.classList.add("hidden");
});

toggleForgot.addEventListener("click", () => {
  signupForm.classList.add("hidden");
  loginForm.classList.add("hidden");
  forgotForm.classList.remove("hidden");
  formTitle.innerText = "Reset Password";
  toggleSignup.classList.remove("hidden");
  toggleLogin.classList.remove("hidden");
});

// -------------------- Sign Up -----------------------
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMsg.innerText = "Creating account...";

  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const username = document.getElementById("signup-username").value.trim();
  const phone = document.getElementById("signup-phone").value.trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    authMsg.innerText = error.message;
    return;
  }

  const userId = data.user?.id;

  if (userId) {
    await supabase.from("profiles").insert([{ id: userId, username, phone }]);
    authMsg.innerText = "Account created! Check your email to confirm.";
  }
});

// -------------------- Login -----------------------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMsg.innerText = "Logging in...";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authMsg.innerText = error.message;
    return;
  }

  // Redirect to dashboard on successful login
  window.location.href = "dashboard.html";
});

// -------------------- Forgot Password -----------------------
forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authMsg.innerText = "Sending reset link...";

  const email = document.getElementById("forgot-email").value.trim();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://yourdomain.com/auth.html"
  });

  if (error) {
    authMsg.innerText = error.message;
  } else {
    authMsg.innerText = "Reset link sent to your email!";
  }
});

// -------------------- Auto Redirect If Already Logged In -----------------------
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    window.location.href = "dashboard.html";
  }
});



    
