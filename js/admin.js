/* ==========================================
   SERVORA ADMIN.JS
   REALTIME DATABASE VERSION
   Part 1
========================================== */


import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged,
    signOut
} from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    ref,
    get,
    update,
    remove
} from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";




let currentAdmin = null;





/* ==========================================
   ADMIN AUTHENTICATION
========================================== */


onAuthStateChanged(auth, async(user)=>{


if(!user){


window.location.href="admin-login.html";

return;


}



const userRef =
ref(
db,
"users/"+user.uid
);



const userSnap =
await get(userRef);





if(!userSnap.exists()){



await signOut(auth);


return;


}






const data =
userSnap.val();







if(data.role !== "admin"){



await signOut(auth);


window.location.href="admin-login.html";


return;


}






currentAdmin=user;



loadDashboard();

loadBookings();

loadCustomers();

loadMechanics();



});









/* ==========================================
   LOGOUT
========================================== */


const logoutBtn =
document.getElementById(
"logoutBtn"
);




if(logoutBtn){



logoutBtn.addEventListener(
"click",
async()=>{


await signOut(auth);



window.location.href =
"admin-login.html";



});



}









/* ==========================================
   DASHBOARD STATISTICS
========================================== */


async function loadDashboard(){



const bookingSnap =
await get(
ref(db,"bookings")
);



const userSnap =
await get(
ref(db,"users")
);





let totalBookings=0;

let totalCustomers=0;

let totalMechanics=0;

let pending=0;

let completed=0;







if(bookingSnap.exists()){



bookingSnap.forEach((child)=>{



const booking =
child.val();



totalBookings++;





if(
booking.status==="Pending"
)

pending++;





if(
booking.status==="Completed"
)

completed++;



});



}








if(userSnap.exists()){



userSnap.forEach((child)=>{



const user =
child.val();





if(user.role==="customer")

totalCustomers++;





if(user.role==="mechanic")

totalMechanics++;



});



}







document.getElementById(
"totalBookings"
)?.textContent = totalBookings;



document.getElementById(
"pendingBookings"
)?.textContent = pending;



document.getElementById(
"completedBookings"
)?.textContent = completed;



document.getElementById(
"totalCustomers"
)?.textContent = totalCustomers;



document.getElementById(
"totalMechanics"
)?.textContent = totalMechanics;



}









/* ==========================================
   LOAD BOOKINGS
========================================== */


async function loadBookings(){



const container =
document.getElementById(
"bookingContainer"
);



if(!container)
return;




container.innerHTML="";





const snapshot =
await get(
ref(db,"bookings")
);







if(!snapshot.exists()){


container.innerHTML =
"<p>No bookings found.</p>";

return;


}







snapshot.forEach((child)=>{



const booking =
child.val();





container.innerHTML += `


<div class="admin-booking-card">


<h3>

${booking.vehicleBrand || ""}
${booking.vehicleModel || ""}

</h3>



<p>
<strong>Customer :</strong>
${booking.customerName || ""}
</p>



<p>
<strong>Vehicle Number :</strong>
${booking.vehicleNumber || ""}
</p>



<p>
<strong>Service :</strong>
${booking.serviceType || ""}
</p>



<p>
<strong>Status :</strong>
</p>




<select

class="statusSelect"

data-id="${child.key}">


<option
${booking.status==="Pending"?"selected":""}>

Pending

</option>



<option
${booking.status==="Confirmed"?"selected":""}>

Confirmed

</option>




<option
${booking.status==="In Progress"?"selected":""}>

In Progress

</option>




<option
${booking.status==="Completed"?"selected":""}>

Completed

</option>



</select>





<button

class="saveStatus"

data-id="${child.key}">

Update Status

</button>





<button

class="deleteBooking"

data-id="${child.key}">

Delete Booking

</button>



</div>



`;



});





attachBookingEvents();



}





console.log(
"✅ admin.js Part 1 Realtime Database Loaded"
);

/* ==========================================
   SERVORA ADMIN.JS
   REALTIME DATABASE VERSION
   Part 2
========================================== */





/* ==========================================
   BOOKING EVENTS
========================================== */


function attachBookingEvents(){



/* UPDATE STATUS */


document
.querySelectorAll(".saveStatus")
.forEach(button=>{


button.addEventListener(
"click",
async()=>{



const id =
button.dataset.id;





const status =

button.parentElement
.querySelector(".statusSelect")
.value;







await update(

ref(

db,

"bookings/"+id

),


{


status:status


}


);






alert(
"Booking status updated successfully."
);



loadDashboard();

loadBookings();



});



});









/* DELETE BOOKING */


document
.querySelectorAll(".deleteBooking")
.forEach(button=>{


button.addEventListener(
"click",
async()=>{





if(!confirm("Delete this booking?"))

return;







await remove(

ref(

db,

"bookings/"+button.dataset.id

)

);







alert(
"Booking deleted successfully."
);





loadDashboard();

loadBookings();





});



});



}









/* ==========================================
   LOAD CUSTOMERS
========================================== */


async function loadCustomers(){



const container =
document.getElementById(
"customerContainer"
);





if(!container)
return;





container.innerHTML="";





const snapshot =
await get(
ref(db,"users")
);






if(!snapshot.exists())
return;







snapshot.forEach((child)=>{



const user =
child.val();






if(user.role !== "customer")

return;







container.innerHTML += `


<div class="admin-card">


<h3>

${user.name || ""}

</h3>




<p>

<strong>Email :</strong>

${user.email || ""}

</p>





<p>

<strong>Phone :</strong>

${user.phone || "-"}

</p>





<p>

<strong>Role :</strong>

Customer

</p>



</div>



`;



});



}









/* ==========================================
   LOAD MECHANICS
========================================== */


async function loadMechanics(){



const container =
document.getElementById(
"mechanicContainer"
);





if(!container)
return;





container.innerHTML="";





const snapshot =
await get(
ref(db,"users")
);






if(!snapshot.exists())
return;







snapshot.forEach((child)=>{



const user =
child.val();






if(user.role !== "mechanic")

return;







container.innerHTML += `


<div class="admin-card">



<h3>

${user.name || ""}

</h3>





<p>

<strong>Email :</strong>

${user.email || ""}

</p>





<p>

<strong>Phone :</strong>

${user.phone || "-"}

</p>





<p>

<strong>Experience :</strong>

${user.experience || "-"}

</p>





</div>



`;



});



}









/* ==========================================
   SEARCH BOOKINGS
========================================== */


const searchInput =
document.getElementById(
"searchBooking"
);





if(searchInput){



searchInput.addEventListener(
"keyup",
()=>{



const value =
searchInput.value.toLowerCase();







document
.querySelectorAll(".admin-booking-card")
.forEach(card=>{





card.style.display =


card.innerText
.toLowerCase()
.includes(value)


?


"block"


:


"none";





});



});



}









/* ==========================================
   REFRESH DASHBOARD
========================================== */


const refreshBtn =
document.getElementById(
"refreshDashboard"
);





if(refreshBtn){



refreshBtn.addEventListener(
"click",
()=>{



loadDashboard();

loadBookings();

loadCustomers();

loadMechanics();



});



}








console.log(
"✅ admin.js Part 2 Realtime Database Loaded"
);

/* ==========================================
   SERVORA ADMIN.JS
   REALTIME DATABASE VERSION
   Part 3
========================================== */






/* ==========================================
   AUTO REFRESH
========================================== */


setInterval(()=>{


loadDashboard();

loadBookings();


},30000);









/* ==========================================
   PAGE INITIALIZATION
========================================== */


document.addEventListener(
"DOMContentLoaded",
()=>{



loadDashboard();

loadBookings();

loadCustomers();

loadMechanics();



});









/* ==========================================
   END OF ADMIN.JS
========================================== */


console.log(
"====================================="
);

console.log(
"SERVORA ADMIN MODULE LOADED"
);

console.log(
"Realtime Database Connected"
);

console.log(
"Admin Dashboard Ready"
);

console.log(
"====================================="
);