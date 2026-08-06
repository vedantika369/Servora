/* ==========================================
   SERVORA LOGIN.JS (REALTIME DATABASE)
========================================== */

import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";



/* ==========================================
   ELEMENTS
========================================== */

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");

const errorBox = document.getElementById("errorMessage");
const successBox = document.getElementById("successMessage");

const togglePassword =
    document.getElementById("togglePassword");



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
   GET USER DATA FROM REALTIME DATABASE
========================================== */

async function getUserData(uid) {

    const userRef = ref(
        db,
        "users/" + uid
    );


    const snapshot = await get(userRef);


    if (!snapshot.exists()) {

        return null;

    }


    return snapshot.val();

}




/* ==========================================
   LOGIN
========================================== */


if (loginForm) {


    loginForm.addEventListener("submit", async (e)=>{


        e.preventDefault();


        clearMessages();



        const email =
            emailInput.value.trim();


        const password =
            passwordInput.value.trim();



        if(email === "" || password === ""){


            showError(
                "Please fill in all fields."
            );

            return;

        }



        loginBtn.disabled = true;

        loginBtn.innerHTML =
            "Signing In...";



        try {


            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );



            const user =
                userCredential.user;



            // GET DATA FROM REALTIME DATABASE

            const userData =
                await getUserData(user.uid);



            if(!userData){


                showError(
                    "User profile not found."
                );


                loginBtn.disabled=false;

                loginBtn.innerHTML="Login";


                return;

            }




            sessionStorage.setItem(
    "userName",
    userData.name
);


sessionStorage.setItem(
    "userEmail",
    userData.email
);


sessionStorage.setItem(
    "userId",
    user.uid
);

if(userData.role === "admin"){
    window.location.href = "admin/dashboard.html";
}


            showSuccess(
                "Login Successful! Redirecting..."
            );



            setTimeout(()=>{


                window.location.href="customer/dashboard.html";


            },800);



        }



        catch(error){


            console.error(error);



            switch(error.code){



                case "auth/invalid-credential":

                    showError(
                        "Invalid email or password."
                    );

                    break;



                case "auth/user-not-found":

                    showError(
                        "No account found with this email."
                    );

                    break;



                case "auth/wrong-password":

                    showError(
                        "Incorrect password."
                    );

                    break;



                case "auth/invalid-email":

                    showError(
                        "Please enter a valid email."
                    );

                    break;



                case "auth/too-many-requests":

                    showError(
                        "Too many login attempts. Please try again later."
                    );

                    break;



                case "auth/network-request-failed":

                    showError(
                        "Network error. Check your internet connection."
                    );

                    break;



                default:


                    showError(
                        "Unable to login. Please try again."
                    );


            }



            loginBtn.disabled=false;

            loginBtn.innerHTML="Login";


        }


    });


}





/* ==========================================
   REDIRECT USER
========================================== */








/* ==========================================
   AUTO LOGIN
========================================== */


onAuthStateChanged(auth, async(user)=>{


    if(!user) return;



    if(window.location.pathname !== "login.html")
        return;



    try{


        const userData =
            await getUserData(user.uid);



        if(!userData)
            return;



        sessionStorage.setItem(
            "userRole",
            userData.role
        );


        sessionStorage.setItem(
            "userName",
            userData.name
        );


        sessionStorage.setItem(
            "userEmail",
            userData.email
        );



        window.location.href="customer/dashboard.html";



    }


    catch(error){


        console.error(error);


    }



});





/* ==========================================
   SHOW / HIDE PASSWORD
========================================== */


if(togglePassword){


    togglePassword.addEventListener(
        "click",
        ()=>{


        if(passwordInput.type==="password"){


            passwordInput.type="text";


            togglePassword.classList.remove(
                "fa-eye"
            );


            togglePassword.classList.add(
                "fa-eye-slash"
            );


        }


        else{


            passwordInput.type="password";


            togglePassword.classList.remove(
                "fa-eye-slash"
            );


            togglePassword.classList.add(
                "fa-eye"
            );


        }


    });


}





/* ==========================================
   CLEAR MESSAGE WHILE TYPING
========================================== */


[emailInput,passwordInput].forEach(input=>{


    if(!input) return;


    input.addEventListener(
        "input",
        clearMessages
    );


});





/* ==========================================
   ENTER KEY SUPPORT
========================================== */


document.addEventListener(
    "keydown",
    (e)=>{


    if(e.key==="Enter" && loginForm){


        e.preventDefault();

        loginForm.requestSubmit();


    }


});





/* ==========================================
   RESET BUTTON
========================================== */


window.addEventListener(
    "pageshow",
    ()=>{


    clearMessages();



    if(loginBtn){


        loginBtn.disabled=false;

        loginBtn.innerHTML="Login";


    }


});





/* ==========================================
   SAVE LOGIN ATTEMPT
========================================== */


window.addEventListener(
    "beforeunload",
    ()=>{


    sessionStorage.setItem(
        "lastLoginAttempt",
        new Date().toISOString()
    );


});





/* ==========================================
   INITIALIZE
========================================== */


document.addEventListener(
    "DOMContentLoaded",
    ()=>{


    clearMessages();



    if(loginBtn){


        loginBtn.disabled=false;

        loginBtn.innerHTML="Login";


    }



    if(emailInput){


        emailInput.focus();


    }



});



/* ==========================================
   END OF LOGIN.JS
========================================== */