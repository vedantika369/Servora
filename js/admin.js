/* =========================================================
   SERVORA ADMIN DASHBOARD
   admin.js
   Firebase Realtime Database
   Single Page Admin Panel
========================================================= */

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
    get,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentAdmin = null;

let allBookings = [];

let allCustomers = [];

let allMechanics = [];


/* =========================================================
   DOM ELEMENTS
========================================================= */

const totalBookings =
    document.getElementById("totalBookings");

const pendingBookings =
    document.getElementById("pendingBookings");

const completedBookings =
    document.getElementById("completedBookings");

const totalCustomers =
    document.getElementById("totalCustomers");

const totalMechanics =
    document.getElementById("totalMechanics");

const bookingContainer =
    document.getElementById("bookingContainer");

const customerContainer =
    document.getElementById("customerContainer");

const mechanicContainer =
    document.getElementById("mechanicContainer");

const searchBooking =
    document.getElementById("searchBooking");

const refreshDashboard =
    document.getElementById("refreshDashboard");

const logoutBtn =
    document.getElementById("logoutBtn");


/* =========================================================
   SAFE TEXT
   Prevents database text from being interpreted as HTML.
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   SHOW MESSAGE
========================================================= */

function showMessage(container, message) {

    if (!container) return;

    container.innerHTML = `
        <div class="admin-empty">

            <i class="fas fa-info-circle"></i>

            <h3>${escapeHTML(message)}</h3>

        </div>
    `;
}


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

onAuthStateChanged(auth, async (user) => {

    try {

        if (!user) {

            window.location.href = "admin-login.html";

            return;
        }


        const userSnapshot =
            await get(
                ref(db, "users/" + user.uid)
            );


        if (!userSnapshot.exists()) {

            await signOut(auth);

            window.location.href = "admin-login.html";

            return;
        }


        const userData =
            userSnapshot.val();


        if (userData.role !== "admin") {

            await signOut(auth);

            window.location.href = "admin-login.html";

            return;
        }


        currentAdmin = user;


        await loadAllData();

    }

    catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        alert(
            "Unable to load admin dashboard."
        );

    }

});


/* =========================================================
   LOAD ALL DATA
========================================================= */

async function loadAllData() {

    await Promise.all([

        loadDashboardStats(),

        loadBookings(),

        loadCustomers(),

        loadMechanics()

    ]);

}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

async function loadDashboardStats() {

    try {

        const bookingSnapshot =
            await get(
                ref(db, "bookings")
            );


        const userSnapshot =
            await get(
                ref(db, "users")
            );


        let total = 0;

        let pending = 0;

        let completed = 0;

        let customers = 0;

        let mechanics = 0;


        /* -----------------------------------------
           BOOKINGS
        ----------------------------------------- */

        if (bookingSnapshot.exists()) {

            bookingSnapshot.forEach((child) => {

                const booking =
                    child.val() || {};


                total++;


                const status =
                    String(
                        booking.status || ""
                    ).trim();


                if (
                    status.toLowerCase()
                    === "pending"
                ) {

                    pending++;

                }


                if (
                    status.toLowerCase()
                    === "completed"
                ) {

                    completed++;

                }

            });

        }


        /* -----------------------------------------
           USERS
        ----------------------------------------- */

        if (userSnapshot.exists()) {

            userSnapshot.forEach((child) => {

                const user =
                    child.val() || {};


                const role =
                    String(
                        user.role || ""
                    ).toLowerCase();


                if (role === "customer") {

                    customers++;

                }


                if (role === "mechanic") {

                    mechanics++;

                }

            });

        }


        /* -----------------------------------------
           UPDATE UI
        ----------------------------------------- */

        if (totalBookings) {

            totalBookings.textContent =
                total;

        }


        if (pendingBookings) {

            pendingBookings.textContent =
                pending;

        }


        if (completedBookings) {

            completedBookings.textContent =
                completed;

        }


        if (totalCustomers) {

            totalCustomers.textContent =
                customers;

        }


        if (totalMechanics) {

            totalMechanics.textContent =
                mechanics;

        }

    }

    catch (error) {

        console.error(
            "Statistics error:",
            error
        );

    }

}


/* =========================================================
   LOAD BOOKINGS
========================================================= */

async function loadBookings() {

    if (!bookingContainer) return;


    try {

        bookingContainer.innerHTML = `
            <div class="admin-loading">
                <div class="admin-spinner"></div>
                Loading bookings...
            </div>
        `;


        const snapshot =
            await get(
                ref(db, "bookings")
            );


        allBookings = [];


        if (!snapshot.exists()) {

            showMessage(
                bookingContainer,
                "No bookings found."
            );

            return;
        }


        snapshot.forEach((child) => {

            const booking =
                child.val() || {};


            allBookings.push({

                id: child.key,

                ...booking

            });

        });


        /* Newest bookings first */

        allBookings.sort((a, b) => {

            const dateA =
                Number(
                    a.createdAt || 0
                );

            const dateB =
                Number(
                    b.createdAt || 0
                );

            return dateB - dateA;

        });


        renderBookings(allBookings);

    }

    catch (error) {

        console.error(
            "Bookings error:",
            error
        );


        showMessage(
            bookingContainer,
            "Unable to load bookings."
        );

    }

}


/* =========================================================
   RENDER BOOKINGS
========================================================= */

function renderBookings(bookings) {

    if (!bookingContainer) return;


    if (!bookings.length) {

        showMessage(
            bookingContainer,
            "No matching bookings found."
        );

        return;
    }


    bookingContainer.innerHTML = "";


    bookings.forEach((booking) => {

        const id =
            escapeHTML(
                booking.id
            );


        const vehicle =
            [

                booking.vehicleBrand,

                booking.vehicleModel

            ]

            .filter(Boolean)

            .join(" ");


        const customer =
            booking.customerName
            || "Customer";


        const vehicleNumber =
            booking.vehicleNumber
            || "-";


        const service =
            booking.serviceType
            || "-";


        const bookingDate =
            booking.bookingDate
            || "-";


        const bookingTime =
            booking.bookingTime
            || "-";


        const mechanic =
            booking.mechanicName
            || "Not Assigned";


        const amount =
            booking.finalAmount
            || booking.estimatedCost
            || "0";


        const status =
            booking.status
            || "Pending";


        const statusClass =
            getStatusClass(status);


        bookingContainer.innerHTML += `

            <div
                class="admin-booking-card"
                data-booking-id="${id}"
            >

                <div class="admin-booking-top">

                    <div>

                        <h3>
                            ${escapeHTML(
                                vehicle || "Vehicle"
                            )}
                        </h3>

                        <p>
                            Booking ID:
                            <strong>
                                ${id}
                            </strong>
                        </p>

                    </div>


                    <span
                        class="admin-status ${statusClass}"
                    >
                        ${escapeHTML(status)}
                    </span>

                </div>


                <div class="admin-booking-details">

                    <p>
                        <strong>
                            Customer:
                        </strong>

                        ${escapeHTML(customer)}
                    </p>


                    <p>
                        <strong>
                            Vehicle Number:
                        </strong>

                        ${escapeHTML(vehicleNumber)}
                    </p>


                    <p>
                        <strong>
                            Service:
                        </strong>

                        ${escapeHTML(service)}
                    </p>


                    <p>
                        <strong>
                            Mechanic:
                        </strong>

                        ${escapeHTML(mechanic)}
                    </p>


                    <p>
                        <strong>
                            Date:
                        </strong>

                        ${escapeHTML(bookingDate)}
                    </p>


                    <p>
                        <strong>
                            Time:
                        </strong>

                        ${escapeHTML(bookingTime)}
                    </p>


                    <p>
                        <strong>
                            Amount:
                        </strong>

                        ₹${escapeHTML(amount)}
                    </p>

                </div>


                <div class="admin-booking-actions">

                    <select
                        class="statusSelect"
                        data-id="${id}"
                    >

                        <option
                            value="Pending"
                            ${status === "Pending"
                                ? "selected"
                                : ""}
                        >
                            Pending
                        </option>


                        <option
                            value="Confirmed"
                            ${status === "Confirmed"
                                ? "selected"
                                : ""}
                        >
                            Confirmed
                        </option>


                        <option
                            value="In Progress"
                            ${status === "In Progress"
                                ? "selected"
                                : ""}
                        >
                            In Progress
                        </option>


                        <option
                            value="Completed"
                            ${status === "Completed"
                                ? "selected"
                                : ""}
                        >
                            Completed
                        </option>


                        <option
                            value="Cancelled"
                            ${status === "Cancelled"
                                ? "selected"
                                : ""}
                        >
                            Cancelled
                        </option>

                    </select>


                    <button
                        class="saveStatus"
                        data-id="${id}"
                    >
                        Update Status
                    </button>


                    <button
                        class="deleteBooking"
                        data-id="${id}"
                    >
                        Delete Booking
                    </button>

                </div>

            </div>

        `;

    });


    attachBookingEvents();

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    const value =
        String(status)
        .toLowerCase();


    if (value === "pending") {

        return "status-pending";

    }


    if (value === "confirmed") {

        return "status-confirmed";

    }


    if (
        value === "in progress"
        ||
        value === "in-progress"
    ) {

        return "status-progress";

    }


    if (value === "completed") {

        return "status-completed";

    }


    if (value === "cancelled") {

        return "status-cancelled";

    }


    return "status-pending";

}


/* =========================================================
   BOOKING EVENTS
========================================================= */

function attachBookingEvents() {


    /* -----------------------------------------
       UPDATE STATUS
    ----------------------------------------- */

    document
        .querySelectorAll(".saveStatus")
        .forEach((button) => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    const select =
                        document.querySelector(
                            `.statusSelect[data-id="${id}"]`
                        );


                    if (!select) return;


                    const newStatus =
                        select.value;


                    try {

                        button.disabled = true;

                        button.textContent =
                            "Updating...";


                        await update(

                            ref(
                                db,
                                "bookings/" + id
                            ),

                            {
                                status: newStatus
                            }

                        );


                        alert(
                            "Booking status updated successfully."
                        );


                        await loadAllData();

                    }

                    catch (error) {

                        console.error(error);

                        alert(
                            "Unable to update booking status."
                        );

                    }

                    finally {

                        button.disabled = false;

                        button.textContent =
                            "Update Status";

                    }

                }
            );

        });


    /* -----------------------------------------
       DELETE BOOKING
    ----------------------------------------- */

    document
        .querySelectorAll(".deleteBooking")
        .forEach((button) => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    const confirmed =
                        confirm(
                            "Are you sure you want to delete this booking?"
                        );


                    if (!confirmed) return;


                    try {

                        button.disabled = true;

                        button.textContent =
                            "Deleting...";


                        await remove(

                            ref(
                                db,
                                "bookings/" + id
                            )

                        );


                        alert(
                            "Booking deleted successfully."
                        );


                        await loadAllData();

                    }

                    catch (error) {

                        console.error(error);

                        alert(
                            "Unable to delete booking."
                        );

                    }

                }
            );

        });

}


/* =========================================================
   LOAD CUSTOMERS
========================================================= */

async function loadCustomers() {

    if (!customerContainer) return;


    try {

        customerContainer.innerHTML = `
            <div class="admin-loading">
                <div class="admin-spinner"></div>
                Loading customers...
            </div>
        `;


        const snapshot =
            await get(
                ref(db, "users")
            );


        allCustomers = [];


        if (snapshot.exists()) {

            snapshot.forEach((child) => {

                const user =
                    child.val() || {};


                if (
                    String(user.role || "")
                    .toLowerCase()
                    !== "customer"
                ) {

                    return;

                }


                allCustomers.push({

                    id: child.key,

                    ...user

                });

            });

        }


        renderCustomers();

    }

    catch (error) {

        console.error(
            "Customers error:",
            error
        );


        showMessage(
            customerContainer,
            "Unable to load customers."
        );

    }

}


/* =========================================================
   RENDER CUSTOMERS
========================================================= */

function renderCustomers() {

    if (!customerContainer) return;


    if (!allCustomers.length) {

        showMessage(
            customerContainer,
            "No customers found."
        );

        return;
    }


    customerContainer.innerHTML = "";


    allCustomers.forEach((user) => {

        customerContainer.innerHTML += `

            <div class="admin-card">

                <h3>
                    ${escapeHTML(
                        user.name || "Customer"
                    )}
                </h3>


                <p>

                    <strong>
                        Email:
                    </strong>

                    ${escapeHTML(
                        user.email || "-"
                    )}

                </p>


                <p>

                    <strong>
                        Phone:
                    </strong>

                    ${escapeHTML(
                        user.phone || "-"
                    )}

                </p>


                <p>

                    <strong>
                        Role:
                    </strong>

                    Customer

                </p>

            </div>

        `;

    });

}


/* =========================================================
   LOAD MECHANICS
========================================================= */

async function loadMechanics() {

    if (!mechanicContainer) return;


    try {

        mechanicContainer.innerHTML = `
            <div class="admin-loading">
                <div class="admin-spinner"></div>
                Loading mechanics...
            </div>
        `;


        const snapshot =
            await get(
                ref(db, "users")
            );


        allMechanics = [];


        if (snapshot.exists()) {

            snapshot.forEach((child) => {

                const user =
                    child.val() || {};


                if (
                    String(user.role || "")
                    .toLowerCase()
                    !== "mechanic"
                ) {

                    return;

                }


                allMechanics.push({

                    id: child.key,

                    ...user

                });

            });

        }


        renderMechanics();

    }

    catch (error) {

        console.error(
            "Mechanics error:",
            error
        );


        showMessage(
            mechanicContainer,
            "Unable to load mechanics."
        );

    }

}


/* =========================================================
   RENDER MECHANICS
========================================================= */

function renderMechanics() {

    if (!mechanicContainer) return;


    if (!allMechanics.length) {

        showMessage(
            mechanicContainer,
            "No mechanics found."
        );

        return;
    }


    mechanicContainer.innerHTML = "";


    allMechanics.forEach((mechanic) => {

        mechanicContainer.innerHTML += `

            <div class="admin-card">

                <h3>
                    ${escapeHTML(
                        mechanic.name
                        || "Mechanic"
                    )}
                </h3>


                <p>

                    <strong>
                        Email:
                    </strong>

                    ${escapeHTML(
                        mechanic.email || "-"
                    )}

                </p>


                <p>

                    <strong>
                        Phone:
                    </strong>

                    ${escapeHTML(
                        mechanic.phone || "-"
                    )}

                </p>


                <p>

                    <strong>
                        Experience:
                    </strong>

                    ${escapeHTML(
                        mechanic.experience || "-"
                    )}

                </p>


                <p>

                    <strong>
                        Specialization:
                    </strong>

                    ${escapeHTML(
                        mechanic.specialization || "-"
                    )}

                </p>

            </div>

        `;

    });

}


/* =========================================================
   SEARCH BOOKINGS
========================================================= */

if (searchBooking) {

    searchBooking.addEventListener(
        "input",
        () => {

            const value =
                searchBooking.value
                .trim()
                .toLowerCase();


            if (!value) {

                renderBookings(
                    allBookings
                );

                return;

            }


            const filtered =
                allBookings.filter(
                    (booking) => {

                        const searchableText = [

                            booking.customerName,

                            booking.customerEmail,

                            booking.vehicleBrand,

                            booking.vehicleModel,

                            booking.vehicleName,

                            booking.vehicleNumber,

                            booking.serviceType,

                            booking.status,

                            booking.mechanicName,

                            booking.bookingDate

                        ]

                        .filter(Boolean)

                        .join(" ")

                        .toLowerCase();


                        return searchableText
                            .includes(value);

                    }
                );


            renderBookings(
                filtered
            );

        }
    );

}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

if (refreshDashboard) {

    refreshDashboard.addEventListener(
        "click",
        async () => {

            try {

                refreshDashboard.disabled =
                    true;


                refreshDashboard.textContent =
                    "Refreshing...";


                await loadAllData();

            }

            catch (error) {

                console.error(error);

            }

            finally {

                refreshDashboard.disabled =
                    false;


                refreshDashboard.textContent =
                    "Refresh";

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "admin-login.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Logout failed."
                );

            }

        }
    );

}


/* =========================================================
   AUTO REFRESH
   Refresh data every 30 seconds.
========================================================= */

setInterval(
    async () => {

        if (!currentAdmin) return;

        try {

            await loadAllData();

        }

        catch (error) {

            console.error(
                "Auto refresh error:",
                error
            );

        }

    },
    30000
);


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Servora Admin Dashboard initialized."
        );

    }
);


/* =========================================================
   END OF ADMIN.JS
========================================================= */

console.log(
    "====================================="
);

console.log(
    "SERVORA ADMIN MODULE"
);

console.log(
    "Realtime Database Connected"
);

console.log(
    "Single Page Admin Dashboard Ready"
);

console.log(
    "====================================="
);
