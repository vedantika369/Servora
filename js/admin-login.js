/* ==========================================
   SERVORA ADMIN-LOGIN.JS
   Realtime Database Version
   PART 1
========================================== */


import { auth, db } 
from "./firebase-config.js";



import {

    signInWithEmailAndPassword,

    onAuthStateChanged,

    signOut

}
from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



import {

    ref,

    get

}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";





/* ==========================================
   ELEMENTS
========================================== */


const adminLoginForm = 
document.getElementById("adminLoginForm");



const emailInput = 
document.getElementById("email");



const passwordInput =
document.getElementById("password");



const loginBtn =
document.getElementById("loginBtn");



const errorMessage =
document.getElementById("errorMessage");







/* ==========================================
   ERROR FUNCTIONS
========================================== */


function showError(message){


    if(!errorMessage) return;


    errorMessage.style.display="block";


    errorMessage.textContent=message;


}




function clearError(){


    if(!errorMessage) return;


    errorMessage.style.display="none";


    errorMessage.textContent="";


}

/* ==========================================
   ADMIN LOGIN
========================================== */


if(adminLoginForm){



adminLoginForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



clearError();




const email =
emailInput.value.trim();



const password =
passwordInput.value;






if(!email || !password){


showError(
"Please enter email and password."
);


return;


}







loginBtn.disabled=true;


loginBtn.innerText="Signing In...";








try{





// FIREBASE AUTH LOGIN


const credential =

await signInWithEmailAndPassword(

auth,

email,

password

);






const user =

credential.user;









// GET ADMIN DATA FROM REALTIME DATABASE


const adminRef =

ref(

db,

"users/"+user.uid

);






const snapshot =

await get(adminRef);







if(!snapshot.exists()){





await signOut(auth);



showError(
"Admin account not found."
);




loginBtn.disabled=false;


loginBtn.innerText="Admin Login";



return;



}









const admin =

snapshot.val();









// CHECK ADMIN ROLE



if(admin.role !== "admin"){





await signOut(auth);





showError(

"Access denied. Only administrators can log in here."

);





loginBtn.disabled=false;


loginBtn.innerText="Admin Login";



return;



}









// STORE ADMIN SESSION



sessionStorage.setItem(

"userRole",

"admin"

);



sessionStorage.setItem(

"userName",

admin.name || ""

);



sessionStorage.setItem(

"userEmail",

admin.email || ""

);









// REDIRECT


window.location.href=

"admin/dashboard.html";








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
"Admin account not found."
);

break;






case "auth/wrong-password":


showError(
"Incorrect password."
);

break;






case "auth/too-many-requests":


showError(
"Too many login attempts. Try again later."
);

break;






default:


showError(
error.message
);



}





loginBtn.disabled=false;


loginBtn.innerText="Admin Login";




}





});



}

/* ==========================================
   AUTO LOGIN IF ALREADY AUTHENTICATED
========================================== */


onAuthStateChanged(auth, async(user)=>{


if(!user) return;




try{





const adminRef =

ref(

db,

"users/"+user.uid

);






const snapshot =

await get(adminRef);






if(!snapshot.exists()) return;






const admin =

snapshot.val();








if(admin.role==="admin"){





sessionStorage.setItem(

"userRole",

"admin"

);



sessionStorage.setItem(

"userName",

admin.name || ""

);



sessionStorage.setItem(

"userEmail",

admin.email || ""

);








if(
!window.location.pathname.includes("admin/dashboard.html")
){


window.location.href="admin/dashboard.html";


}




}





}

catch(error){


console.error(

"Auto Login Error:",

error

);


}



});









/* ==========================================
   SHOW / HIDE PASSWORD
========================================== */


const togglePassword =

document.getElementById(
"togglePassword"
);






if(togglePassword && passwordInput){



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



}



);



}









/* ==========================================
   CLEAR ERROR WHILE TYPING
========================================== */


if(emailInput){


emailInput.addEventListener(

"input",

clearError

);


}




if(passwordInput){


passwordInput.addEventListener(

"input",

clearError

);


}









/* ==========================================
   ENTER KEY SUPPORT
========================================== */


document.addEventListener(

"keydown",

(e)=>{


if(
e.key==="Enter" && adminLoginForm
){



e.preventDefault();



adminLoginForm.requestSubmit();



}



}

);









/* ==========================================
   RESET BUTTON STATE
========================================== */


window.addEventListener(

"pageshow",

()=>{


if(loginBtn){



loginBtn.disabled=false;


loginBtn.innerText="Admin Login";



}



}

);









/* ==========================================
   PAGE INITIALIZATION
========================================== */


document.addEventListener(

"DOMContentLoaded",

()=>{


clearError();



if(emailInput)

emailInput.focus();



}

);








/* ==========================================
   END OF ADMIN LOGIN
========================================== */