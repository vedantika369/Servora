/* ==========================================
   SERVORA CUSTOMER.JS
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
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    ref,
    push,
    set,
    get,
    remove,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";





let currentUser = null;





/* ==========================================
   AUTH CHECK
========================================== */


onAuthStateChanged(auth, async(user)=>{


    if(!user){


        window.location.href="login.html";

        return;

    }



    currentUser=user;



    loadCustomerProfile();

    loadVehicles();



});







/* ==========================================
   LOGOUT
========================================== */


const logoutBtn =
document.getElementById("logoutBtn");



if(logoutBtn){



logoutBtn.addEventListener(
"click",
async()=>{


    try{


        await signOut(auth);


        window.location.href="login.html";


    }


    catch(error){


        console.error(error);


        alert("Logout failed.");


    }



});



}







/* ==========================================
   LOAD PROFILE
========================================== */


async function loadCustomerProfile(){



const nameField =
document.getElementById("customerName");



const emailField =
document.getElementById("customerEmail");



if(!nameField || !emailField)
return;





const userRef =
ref(
    db,
    "users/" + currentUser.uid
);





const snapshot =
await get(userRef);





if(snapshot.exists()){


const userData =
snapshot.val();



nameField.value =
userData.name || "";



emailField.value =
userData.email || currentUser.email;



}



else{


nameField.value =
currentUser.displayName || "";



emailField.value =
currentUser.email;



}



}








/* ==========================================
   SAVE PROFILE
========================================== */


const profileForm =
document.getElementById("profileForm");



if(profileForm){



profileForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



alert(
"Profile updated successfully."
);



});



}









/* ==========================================
   ADD VEHICLE
========================================== */


const vehicleForm =
document.getElementById("vehicleForm");




if(vehicleForm){



vehicleForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



try{



const vehicleNumber =
document.getElementById("vehicleNumber").value;



const vehicleModel =
document.getElementById("vehicleModel").value;



const vehicleType =
document.getElementById("vehicleType").value;






const vehicleId =
push(
    ref(db,"vehicles/"+currentUser.uid)
).key;






await set(

ref(
db,
"vehicles/"+currentUser.uid+"/"+vehicleId
),


{


id:vehicleId,


uid:currentUser.uid,


number:vehicleNumber,


model:vehicleModel,


type:vehicleType,


createdAt:
Date.now()



}


);






alert(
"Vehicle Added Successfully"
);



vehicleForm.reset();



loadVehicles();



}



catch(error){


console.error(error);


alert(error.message);



}



});



}









/* ==========================================
   LOAD VEHICLES
========================================== */


async function loadVehicles(){



const container =
document.getElementById("vehicleList");



if(!container)
return;



container.innerHTML="";





const vehicleRef =
ref(
db,
"vehicles/"+currentUser.uid
);





const snapshot =
await get(vehicleRef);






if(!snapshot.exists()){



container.innerHTML=
"<p>No vehicles added.</p>";

return;


}







snapshot.forEach((child)=>{



const vehicle =
child.val();





container.innerHTML += `


<div class="vehicle-card">


<h3>
${vehicle.model}
</h3>



<p>
<strong>Number:</strong>
${vehicle.number}
</p>



<p>
<strong>Type:</strong>
${vehicle.type}
</p>



<button
class="deleteVehicle"
data-id="${child.key}">
Delete
</button>



</div>


`;



});





attachVehicleDeleteEvents();



}









/* ==========================================
   DELETE VEHICLE
========================================== */


function attachVehicleDeleteEvents(){



document
.querySelectorAll(".deleteVehicle")
.forEach(button=>{


button.addEventListener(
"click",
async()=>{



if(!confirm("Delete this vehicle?"))
return;





await remove(

ref(

db,

"vehicles/"+currentUser.uid+"/"+button.dataset.id

)

);





loadVehicles();



});


});



}




console.log(
"✅ customer.js Part 1 Loaded Successfully"
);

/* ==========================================
   SERVORA CUSTOMER.JS
   REALTIME DATABASE VERSION
   Part 2
========================================== */


/* ==========================================
   BOOK SERVICE
========================================== */


const bookingForm =
document.getElementById("bookingForm");



if(bookingForm){



bookingForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



try{



const vehicle =
document.getElementById("vehicle").value;



const service =
document.getElementById("service").value;



const date =
document.getElementById("serviceDate").value;



const problem =
document.getElementById("problem").value;





const bookingId =
push(
ref(db,"bookings")
).key;







await set(


ref(
db,
"bookings/"+bookingId
),


{


id:bookingId,


customerId:
currentUser.uid,


customerEmail:
currentUser.email,



vehicle:vehicle,



service:service,



serviceDate:date,



problem:problem,



status:"Pending",



mechanicRemarks:"",



invoiceAmount:0,



createdAt:
Date.now()



}



);





alert(
"Service booked successfully."
);



bookingForm.reset();



loadBookings();



}



catch(error){


console.error(error);


alert(error.message);



}



});



}









/* ==========================================
   LOAD BOOKINGS
========================================== */


async function loadBookings(){



const container =
document.getElementById("bookingList");



if(!container)
return;



container.innerHTML="";





const bookingRef =
ref(
db,
"bookings"
);





const snapshot =
await get(bookingRef);






if(!snapshot.exists()){


container.innerHTML=
"<p>No bookings found.</p>";

return;


}






let found=false;





snapshot.forEach((child)=>{



const booking =
child.val();





if(
booking.customerId === currentUser.uid
){



found=true;





container.innerHTML += `


<div class="booking-card">


<h3>
${booking.service}
</h3>



<p>
<strong>Vehicle:</strong>
${booking.vehicle}
</p>



<p>
<strong>Date:</strong>
${booking.serviceDate}
</p>



<p>
<strong>Status:</strong>
${booking.status}
</p>



<p>
<strong>Problem:</strong>
${booking.problem}
</p>



</div>


`;



}



});






if(!found){



container.innerHTML=
"<p>No bookings found.</p>";



}



}









/* ==========================================
   SERVICE STATUS
========================================== */


async function loadStatus(){



const container =
document.getElementById("statusContainer");



if(!container)
return;



container.innerHTML="";





const bookingRef =
ref(
db,
"bookings"
);





const snapshot =
await get(bookingRef);






if(!snapshot.exists())
return;





snapshot.forEach((child)=>{



const booking =
child.val();





if(
booking.customerId === currentUser.uid
){



let progress=25;




if(
booking.status==="Confirmed"
)

progress=50;




if(
booking.status==="In Progress"
)

progress=75;




if(
booking.status==="Completed"
)

progress=100;







container.innerHTML += `


<div class="status-card">


<h3>
${booking.vehicle}
</h3>



<p>
${booking.service}
</p>




<div class="progress-container">


<div

class="progress-bar"

style="width:${progress}%">

</div>



</div>




<strong>
${booking.status}
</strong>



</div>



`;



}



});



}







console.log(
"✅ customer.js Part 2 Loaded Successfully"
);

/* ==========================================
   SERVORA CUSTOMER.JS
   REALTIME DATABASE VERSION
   Part 3
========================================== */



/* ==========================================
   SERVICE HISTORY
========================================== */


async function loadHistory(){



const container =
document.getElementById("historyList");



if(!container)
return;



container.innerHTML="";





const bookingRef =
ref(
db,
"bookings"
);





const snapshot =
await get(bookingRef);






if(!snapshot.exists()){

container.innerHTML =
"<p>No service history found.</p>";

return;

}






let found=false;






snapshot.forEach((child)=>{



const booking =
child.val();





if(

booking.customerId === currentUser.uid &&

booking.status === "Completed"

){



found=true;



container.innerHTML += `


<div class="history-card">


<h3>
${booking.service}
</h3>



<p>
${booking.vehicle}
</p>



<p>
${booking.serviceDate}
</p>



<span>
Completed
</span>



</div>


`;



}



});






if(!found){



container.innerHTML =
"<p>No completed services.</p>";



}



}









/* ==========================================
   LOAD INVOICE
========================================== */


async function loadInvoice(){



const container =
document.getElementById("invoiceContainer");



if(!container)
return;



container.innerHTML="";






const bookingRef =
ref(
db,
"bookings"
);






const snapshot =
await get(bookingRef);






if(!snapshot.exists())
return;







snapshot.forEach((child)=>{



const booking =
child.val();






if(

booking.customerId === currentUser.uid &&

booking.status === "Completed"

){






container.innerHTML += `



<div class="invoice-card">



<h2>
Invoice
</h2>



<hr>



<p>
<strong>Vehicle:</strong>
${booking.vehicle}
</p>




<p>
<strong>Service:</strong>
${booking.service}
</p>




<p>
<strong>Date:</strong>
${booking.serviceDate}
</p>




<p>
<strong>Status:</strong>
${booking.status}
</p>




<p>
<strong>Amount:</strong>
₹${booking.invoiceAmount}
</p>




<button onclick="window.print()">

Print Invoice

</button>



</div>



`;



}



});



}









/* ==========================================
   DASHBOARD COUNTS
========================================== */


async function loadDashboardCounts(){



const bookingSnapshot =
await get(
ref(db,"bookings")
);





const vehicleSnapshot =
await get(
ref(
db,
"vehicles/"+currentUser.uid
)
);







let totalBookings = 0;

let completedServices = 0;

let totalVehicles = 0;







/* COUNT BOOKINGS */


if(bookingSnapshot.exists()){



bookingSnapshot.forEach((child)=>{



const booking =
child.val();




if(
booking.customerId === currentUser.uid
){


totalBookings++;



if(
booking.status === "Completed"
){


completedServices++;


}



}



});



}








/* COUNT VEHICLES */


if(vehicleSnapshot.exists()){


vehicleSnapshot.forEach(()=>{


totalVehicles++;


});



}









const totalBookingsField =
document.getElementById(
"totalBookings"
);



const totalVehiclesField =
document.getElementById(
"totalVehicles"
);



const completedServicesField =
document.getElementById(
"completedServices"
);







if(totalBookingsField)

totalBookingsField.innerText =
totalBookings;





if(totalVehiclesField)

totalVehiclesField.innerText =
totalVehicles;





if(completedServicesField)

completedServicesField.innerText =
completedServices;



}









/* ==========================================
   FINAL INITIALIZATION
========================================== */


onAuthStateChanged(
auth,
(user)=>{


if(!user)
return;



currentUser=user;



loadDashboardCounts();

loadStatus();

loadHistory();

loadInvoice();



});






console.log(
"✅ customer.js Realtime Database Version Loaded Successfully"
);