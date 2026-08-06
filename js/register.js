/* ==========================================
   SERVORA REGISTER.JS
   Realtime Database Version
========================================== */

import { auth, db } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    ref,
    set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* ==========================================
   ELEMENTS
========================================== */

const registerForm = document.getElementById("registerForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const confirmPasswordInput =
    document.getElementById("confirmPassword");

const registerBtn =
    document.getElementById("registerBtn");

const errorBox =
    document.getElementById("errorMessage");

const successBox =
    document.getElementById("successMessage");

const togglePassword =
    document.getElementById("togglePassword");

const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");


/* ==========================================
   MESSAGE FUNCTIONS
========================================== */

function showError(message) {

    if (!errorBox) return;

    errorBox.style.display = "block";
    errorBox.innerHTML = message;

    if (successBox) {

        successBox.style.display = "none";
        successBox.innerHTML = "";

    }

}

function showSuccess(message) {

    if (!successBox) return;

    successBox.style.display = "block";
    successBox.innerHTML = message;

    if (errorBox) {

        errorBox.style.display = "none";
        errorBox.innerHTML = "";

    }

}

function clearMessages() {

    if (errorBox) {

        errorBox.style.display = "none";
        errorBox.innerHTML = "";

    }

    if (successBox) {

        successBox.style.display = "none";
        successBox.innerHTML = "";

    }

}


/* ==========================================
   REGISTER USER
========================================== */

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        clearMessages();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword =
            confirmPasswordInput.value;

        if (
            !name ||
            !email ||
            !phone ||
            !password ||
            !confirmPassword
        ) {

            showError("Please fill in all fields.");
            return;

        }

        if (phone.length !== 10) {

            showError("Enter a valid 10-digit phone number.");
            return;

        }

        if (password.length < 6) {

            showError("Password must be at least 6 characters.");
            return;

        }

        if (password !== confirmPassword) {

            showError("Passwords do not match.");
            return;

        }

        registerBtn.disabled = true;
        registerBtn.innerHTML = "Creating Account...";

        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;

            await updateProfile(user, {

                displayName: name

            });

            // Remaining code in Part 2...

            /* ==========================================
               SAVE USER DATA TO REALTIME DATABASE
            ========================================== */

            await set(

                ref(db, "users/" + user.uid),

                {

                    uid: user.uid,

                    name: name,

                    email: email,

                    phone: phone,

                    role: "customer",

                    createdAt: Date.now()

                }

            );

            showSuccess(
                "Account created successfully! Redirecting to login..."
            );

            registerForm.reset();

            setTimeout(() => {

                window.location.href = "login.html";

            }, 2000);

        }

        catch (error) {

            console.error(error);

            switch (error.code) {

                case "auth/email-already-in-use":

                    showError(
                        "This email is already registered."
                    );

                    break;

                case "auth/invalid-email":

                    showError(
                        "Please enter a valid email address."
                    );

                    break;

                case "auth/weak-password":

                    showError(
                        "Password should be at least 6 characters."
                    );

                    break;

                default:

                    showError(
                        error.message
                    );

            }

        }

        finally {

            registerBtn.disabled = false;

            registerBtn.innerHTML = "Create Account";

        }

    });

}


/* ==========================================
   TOGGLE PASSWORD
========================================== */

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        passwordInput.type =

            passwordInput.type === "password"

                ? "text"

                : "password";

    });

}


/* ==========================================
   TOGGLE CONFIRM PASSWORD
========================================== */

if (toggleConfirmPassword) {

    toggleConfirmPassword.addEventListener("click", () => {

        confirmPasswordInput.type =

            confirmPasswordInput.type === "password"

                ? "text"

                : "password";

    });

}


/* ==========================================
   PAGE LOADED
========================================== */

console.log(
    "✅ register.js (Realtime Database) Loaded Successfully"
);