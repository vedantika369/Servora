/* =========================================================
   SERVORA - MECHANIC.JS
   REALTIME DATABASE VERSION
   PART 1
========================================================= */


/* =========================================================
   IMPORTS
========================================================= */

import {
    auth,
    db
}
from "./firebase-config.js";


import {
    onAuthStateChanged,
    signOut
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


import {
    ref,
    get,
    update
}
from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentMechanic = null;

let mechanicUID = "";

let mechanicName = "";

const availableJobs =
document.getElementById("availableJobs");

const myJobs =
document.getElementById("myJobs");

const logoutBtn =
document.getElementById("logoutBtn");


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        window.location.href="login.html";

        return;

    }

    currentMechanic = user;

    mechanicUID = user.uid;

    await loadMechanicProfile();

    await loadDashboardStats();

    await loadAvailableJobs();

    await loadMyJobs();

});


/* =========================================================
   LOAD MECHANIC PROFILE
========================================================= */

async function loadMechanicProfile(){

    try{

        const snapshot = await get(

            ref(
                db,
                "users/"+mechanicUID
            )

        );

        if(snapshot.exists()){

            const mechanic = snapshot.val();

            mechanicName =
            mechanic.name || "Mechanic";

        }

        else{

            mechanicName = "Mechanic";

        }

    }

    catch(error){

        console.error(error);

        mechanicName = "Mechanic";

    }

}


/* =========================================================
   LOGOUT
========================================================= */

if(logoutBtn){

    logoutBtn.addEventListener(

        "click",

        async()=>{

            try{

                await signOut(auth);

                sessionStorage.clear();

                window.location.href="/login";

            }

            catch(error){

                console.error(error);

                alert("Unable to logout.");

            }

        }

    );

}

console.log("✅ Mechanic.js Part 1 Loaded");

/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

async function loadDashboardStats(){

    try{

        const snapshot =
        await get(
            ref(db,"bookings")
        );

        let totalJobs = 0;
        let availableJobsCount = 0;
        let myJobsCount = 0;
        let completedJobs = 0;

        if(snapshot.exists()){

            const bookings = snapshot.val();

            Object.keys(bookings).forEach((id)=>{

                const booking = bookings[id];

                totalJobs++;

                if(booking.status === "Pending"){

                    availableJobsCount++;

                }

                if(booking.mechanicId === mechanicUID){

                    myJobsCount++;

                }

                if(
                    booking.mechanicId === mechanicUID &&
                    booking.status === "Completed"
                ){

                    completedJobs++;

                }

            });

        }

        if(document.getElementById("totalJobs")){

            document.getElementById("totalJobs").textContent =
            totalJobs;

        }

        if(document.getElementById("availableCount")){

            document.getElementById("availableCount").textContent =
            availableJobsCount;

        }

        if(document.getElementById("assignedCount")){

            document.getElementById("assignedCount").textContent =
            myJobsCount;

        }

        if(document.getElementById("completedCount")){

            document.getElementById("completedCount").textContent =
            completedJobs;

        }

    }

    catch(error){

        console.error(error);

    }

}


/* =========================================================
   SEARCH MY JOBS
========================================================= */

const searchInput =
document.getElementById("searchBooking");

if(searchInput){

    searchInput.addEventListener(

        "keyup",

        ()=>{

            const keyword =
            searchInput.value.toLowerCase();

            document
            .querySelectorAll(".mechanic-card")
            .forEach(card=>{

                const text =
                card.innerText.toLowerCase();

                card.style.display =
                text.includes(keyword)
                ? "block"
                : "none";

            });

        }

    );

}


/* =========================================================
   FILTER BY STATUS
========================================================= */

const statusFilter =
document.getElementById("statusFilter");

if(statusFilter){

    statusFilter.addEventListener(

        "change",

        ()=>{

            const filter =
            statusFilter.value;

            document
            .querySelectorAll(".mechanic-card")
            .forEach(card=>{

                if(filter === "All"){

                    card.style.display = "block";

                    return;

                }

                if(
                    card.innerText
                    .toLowerCase()
                    .includes(filter.toLowerCase())
                ){

                    card.style.display = "block";

                }

                else{

                    card.style.display = "none";

                }

            });

        }

    );

}


/* =========================================================
   REFRESH BUTTON
========================================================= */

const refreshBtn =
document.getElementById("refreshBtn");

if(refreshBtn){

    refreshBtn.addEventListener(

        "click",

        async()=>{

            refreshBtn.disabled = true;

            await loadDashboardStats();

            await loadAvailableJobs();

            await loadMyJobs();

            refreshBtn.disabled = false;

        }

    );

}


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(()=>{

    if(currentMechanic){

        loadDashboardStats();

        loadAvailableJobs();

        loadMyJobs();

    }

},30000);


console.log("✅ Mechanic.js Part 2 Loaded");

/* =========================================================
   LOAD AVAILABLE JOBS
========================================================= */

async function loadAvailableJobs(){

    if(!availableJobs)
        return;

    try{

        const snapshot =
        await get(
            ref(db,"bookings")
        );

        availableJobs.innerHTML = "";

        if(!snapshot.exists()){

            availableJobs.innerHTML = `

            <div class="mechanic-card">

                <h3>

                    No Service Requests

                </h3>

                <p>

                    There are currently no bookings.

                </p>

            </div>

            `;

            return;

        }

        const bookings = snapshot.val();

        let found = false;

        Object.keys(bookings).forEach((id)=>{

            const booking = bookings[id];

            /* Show only Pending bookings */

            if(booking.status !== "Pending")
                return;

            found = true;

            availableJobs.innerHTML += `

<div class="mechanic-card">

<h2>

${booking.serviceType}

</h2>

<hr>

<h3>

Customer Details

</h3>

<p>

<strong>Name:</strong>

${booking.customerName}

</p>

<p>

<strong>Email:</strong>

${booking.customerEmail}

</p>

<h3>

Vehicle Details

</h3>

<p>

<strong>Vehicle:</strong>

${booking.vehicleName}

</p>

<p>

<strong>Number:</strong>

${booking.vehicleNumber}

</p>

<p>

<strong>Booking Date:</strong>

${booking.bookingDate}

</p>

<h3>

Problem Description

</h3>

<p>

${booking.problemDescription}

</p>

<button
class="accept-btn"
onclick="acceptJob('${id}')">

Accept Job

</button>

</div>

`;

        });

        if(!found){

            availableJobs.innerHTML = `

            <div class="mechanic-card">

                <h3>

                    No Pending Jobs

                </h3>

                <p>

                    Every booking has already been accepted.

                </p>

            </div>

            `;

        }

    }

    catch(error){

        console.error(error);

        availableJobs.innerHTML = `

        <div class="mechanic-card">

            <h3>

                Unable to load available jobs.

            </h3>

        </div>

        `;

    }

}


/* =========================================================
   ACCEPT JOB
========================================================= */

window.acceptJob = async(id)=>{

    try{

        await update(

            ref(db,"bookings/"+id),

            {

                mechanicId : mechanicUID,

                mechanicName : mechanicName,

                status : "Accepted",

                acceptedAt : Date.now()

            }

        );

        alert(

            "Job Accepted Successfully."

        );

        await loadDashboardStats();

        await loadAvailableJobs();

        await loadMyJobs();

    }

    catch(error){

        console.error(error);

        alert(

            "Unable to accept this job."

        );

    }

};

console.log("✅ Mechanic.js Part 3 Loaded");

/* =========================================================
   LOAD MY ASSIGNED JOBS
========================================================= */

async function loadMyJobs(){

    if(!myJobs)
        return;

    try{

        const snapshot =
        await get(
            ref(db,"bookings")
        );

        myJobs.innerHTML = "";

        if(!snapshot.exists()){

            showNoJobs();

            return;

        }

        const bookings = snapshot.val();

        let found = false;

        Object.keys(bookings).forEach((id)=>{

            const booking = bookings[id];

            /* Show only jobs accepted by this mechanic */

            if(booking.mechanicId !== mechanicUID)
                return;

            found = true;

            myJobs.innerHTML += `

<div class="mechanic-card">

<h2>

${booking.serviceType}

</h2>

<hr>

<h3>

Customer Details

</h3>

<p>

<strong>Name:</strong>

${booking.customerName}

</p>

<p>

<strong>Email:</strong>

${booking.customerEmail}

</p>

<h3>

Vehicle Details

</h3>

<p>

<strong>Vehicle:</strong>

${booking.vehicleName}

</p>

<p>

<strong>Vehicle Number:</strong>

${booking.vehicleNumber}

</p>

<p>

<strong>Booking Date:</strong>

${booking.bookingDate}

</p>

<h3>

Problem Description

</h3>

<p>

${booking.problemDescription}

</p>

<label>

Service Status

</label>

<select
id="status-${id}"
class="statusSelect">

<option value="Accepted"
${booking.status==="Accepted"?"selected":""}>

Accepted

</option>

<option value="Confirmed"
${booking.status==="Confirmed"?"selected":""}>

Confirmed

</option>

<option value="In Progress"
${booking.status==="In Progress"?"selected":""}>

In Progress

</option>

<option value="Completed"
${booking.status==="Completed"?"selected":""}>

Completed

</option>

</select>

<label>

Repair Notes

</label>

<textarea
id="note-${id}"
placeholder="Write repair details...">

${booking.mechanicNote || ""}

</textarea>

<label>

Estimated Cost (₹)

</label>

<input
type="number"
id="cost-${id}"
value="${booking.estimatedCost || ""}"
placeholder="Estimated Cost">

<label>

Final Amount (₹)

</label>

<input
type="number"
id="final-${id}"
value="${booking.finalAmount || ""}"
placeholder="Final Amount">

<button
class="update-btn"
onclick="updateService('${id}')">

Update Service

</button>

</div>

`;

        });

        if(!found){

            showNoJobs();

        }

    }

    catch(error){

        console.error(error);

        myJobs.innerHTML = `

<div class="mechanic-card">

<h3>

Unable to load assigned jobs.

</h3>

</div>

`;

    }

}


/* =========================================================
   NO ASSIGNED JOBS
========================================================= */

function showNoJobs(){

    myJobs.innerHTML = `

<div class="mechanic-card">

<h3>

No Accepted Jobs

</h3>

<p>

Accept a service request to start working.

</p>

</div>

`;

}

console.log("✅ Mechanic.js Part 4 Loaded");

/* =========================================================
   UPDATE SERVICE
========================================================= */

window.updateService = async(id)=>{

    try{

        const status =
        document.getElementById(
            "status-"+id
        ).value;

        const mechanicNote =
        document.getElementById(
            "note-"+id
        ).value.trim();

        const estimatedCost =
        Number(
            document.getElementById(
                "cost-"+id
            ).value
        );

        const finalAmount =
        Number(
            document.getElementById(
                "final-"+id
            ).value
        );

        let paymentStatus = "Pending";

        if(status === "Completed"){

            paymentStatus = "Pending";

        }

        await update(

            ref(db,"bookings/"+id),

            {

                status : status,

                mechanicNote : mechanicNote,

                estimatedCost : estimatedCost,

                finalAmount : finalAmount,

                paymentStatus : paymentStatus,

                completedAt : Date.now()

            }

        );

        alert(
            "Service Updated Successfully."
        );

        await loadDashboardStats();

        await loadAvailableJobs();

        await loadMyJobs();

    }

    catch(error){

        console.error(error);

        alert(
            "Unable to update service."
        );

    }

};


/* =========================================================
   STATUS COLOR
========================================================= */

function colorStatusBadges(){

    document
    .querySelectorAll(".statusSelect")
    .forEach(select=>{

        switch(select.value){

            case "Accepted":

                select.style.background="#E3F2FD";
                select.style.color="#1565C0";

                break;

            case "Confirmed":

                select.style.background="#D1ECF1";
                select.style.color="#0C5460";

                break;

            case "In Progress":

                select.style.background="#FFF3CD";
                select.style.color="#856404";

                break;

            case "Completed":

                select.style.background="#D4EDDA";
                select.style.color="#155724";

                break;

            default:

                select.style.background="#F8F9FA";
                select.style.color="#333";

        }

    });

}


/* =========================================================
   STATUS CHANGE EVENT
========================================================= */

document.addEventListener(

    "change",

    (event)=>{

        if(

            event.target.classList.contains(
                "statusSelect"
            )

        ){

            colorStatusBadges();

        }

    }

);

console.log("✅ Mechanic.js Part 5 Loaded");

/* =========================================================
   REFRESH DASHBOARD
========================================================= */

async function refreshDashboard(){

    if(!currentMechanic)
        return;

    await loadDashboardStats();

    await loadAvailableJobs();

    await loadMyJobs();

    colorStatusBadges();

}


/* =========================================================
   MANUAL REFRESH BUTTON
========================================================= */

const refreshBtn =
document.getElementById("refreshBtn");

if(refreshBtn){

    refreshBtn.addEventListener(

        "click",

        async()=>{

            try{

                refreshBtn.disabled = true;

                refreshBtn.innerHTML = "Refreshing...";

                await refreshDashboard();

                refreshBtn.innerHTML = "Refresh";

                refreshBtn.disabled = false;

            }

            catch(error){

                console.error(error);

                refreshBtn.innerHTML = "Refresh";

                refreshBtn.disabled = false;

            }

        }

    );

}


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(()=>{

    if(currentMechanic){

        refreshDashboard();

    }

},30000);


/* =========================================================
   PAGE VISIBILITY REFRESH
========================================================= */

document.addEventListener(

    "visibilitychange",

    ()=>{

        if(

            !document.hidden &&

            currentMechanic

        ){

            refreshDashboard();

        }

    }

);


/* =========================================================
   PAGE SHOW REFRESH
========================================================= */

window.addEventListener(

    "pageshow",

    ()=>{

        if(currentMechanic){

            refreshDashboard();

        }

    }

);


/* =========================================================
   INITIAL STATUS COLORS
========================================================= */

window.addEventListener(

    "load",

    ()=>{

        colorStatusBadges();

    }

);


/* =========================================================
   LOADING PLACEHOLDER
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        if(availableJobs){

            availableJobs.innerHTML =

            `

            <div class="mechanic-card">

                <h3>

                    Loading Available Jobs...

                </h3>

            </div>

            `;

        }

        if(myJobs){

            myJobs.innerHTML =

            `

            <div class="mechanic-card">

                <h3>

                    Loading Assigned Jobs...

                </h3>

            </div>

            `;

        }

    }

);


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function showSuccess(message){

    alert(message);

}

function showError(message){

    alert(message);

}


/* =========================================================
   END OF FILE
========================================================= */

console.log(
    "✅ Mechanic Dashboard Loaded Successfully"
);