/* =========================================================
   SERVORA ADMIN.JS
   SINGLE-PAGE ADMIN DASHBOARD
   FIREBASE REALTIME DATABASE
========================================================= */

import {
    auth,
    db
} from "../js/firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    ref,
    get,
    update,
    remove,
    set,
    push
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentAdmin = null;

let allBookings = [];
let allCustomers = [];
let allMechanics = [];

let currentBookingId = null;


/* =========================================================
   ELEMENTS
========================================================= */

const logoutBtn =
    document.getElementById("logoutBtn");

const refreshBtn =
    document.getElementById("refreshDashboard");

const searchBooking =
    document.getElementById("searchBooking");

const bookingContainer =
    document.getElementById("bookingContainer");

const customerContainer =
    document.getElementById("customerContainer");

const mechanicContainer =
    document.getElementById("mechanicContainer");


/* =========================================================
   SAFE HTML
   Prevents database text from being inserted as HTML.
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
   AUTHENTICATION
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";

        return;
    }

    try {

        const userSnapshot =
            await get(
                ref(db, "users/" + user.uid)
            );

        if (!userSnapshot.exists()) {

            await signOut(auth);

            window.location.href = "../login.html";

            return;
        }

        const userData =
            userSnapshot.val();

        /*
         * Admin access check
         */

        if (userData.role !== "admin") {

            await signOut(auth);

            window.location.href = "../login.html";

            return;
        }

        currentAdmin = {
            uid: user.uid,
            ...userData
        };


        /*
         * Display admin name if element exists
         */

        const adminName =
            document.getElementById("adminName");

        if (adminName) {

            adminName.textContent =
                userData.name || "Administrator";

        }


        /*
         * Load everything
         */

        await refreshAllData();

    }

    catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

    }

});


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
                    "../login.html";

            }

            catch (error) {

                console.error(error);

                alert(
                    "Unable to logout. Please try again."
                );

            }

        }
    );

}


/* =========================================================
   REFRESH EVERYTHING
========================================================= */

async function refreshAllData() {

    try {

        await Promise.all([

            loadDashboardStats(),

            loadBookings(),

            loadCustomers(),

            loadMechanics()

        ]);

    }

    catch (error) {

        console.error(
            "Dashboard refresh error:",
            error
        );

    }

}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

async function loadDashboardStats() {

    const bookingSnapshot =
        await get(
            ref(db, "bookings")
        );

    const userSnapshot =
        await get(
            ref(db, "users")
        );


    let totalBookings = 0;

    let pendingBookings = 0;

    let confirmedBookings = 0;

    let inProgressBookings = 0;

    let completedBookings = 0;

    let cancelledBookings = 0;

    let totalCustomers = 0;

    let totalMechanics = 0;


    /*
     * BOOKINGS
     */

    if (bookingSnapshot.exists()) {

        bookingSnapshot.forEach((child) => {

            const booking =
                child.val();

            totalBookings++;


            const status =
                String(
                    booking.status || "Pending"
                ).toLowerCase();


            if (status === "pending") {

                pendingBookings++;

            }

            else if (status === "confirmed") {

                confirmedBookings++;

            }

            else if (
                status === "in progress" ||
                status === "in-progress"
            ) {

                inProgressBookings++;

            }

            else if (status === "completed") {

                completedBookings++;

            }

            else if (status === "cancelled") {

                cancelledBookings++;

            }

        });

    }


    /*
     * USERS
     */

    if (userSnapshot.exists()) {

        userSnapshot.forEach((child) => {

            const user =
                child.val();


            if (user.role === "customer") {

                totalCustomers++;

            }


            if (user.role === "mechanic") {

                totalMechanics++;

            }

        });

    }


    /*
     * Update dashboard elements
     */

    setText(
        "totalBookings",
        totalBookings
    );

    setText(
        "pendingBookings",
        pendingBookings
    );

    setText(
        "confirmedBookings",
        confirmedBookings
    );

    setText(
        "inProgressBookings",
        inProgressBookings
    );

    setText(
        "completedBookings",
        completedBookings
    );

    setText(
        "cancelledBookings",
        cancelledBookings
    );

    setText(
        "totalCustomers",
        totalCustomers
    );

    setText(
        "totalMechanics",
        totalMechanics
    );

}


/* =========================================================
   SAFE TEXT UPDATE
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}


/* =========================================================
   LOAD BOOKINGS
========================================================= */

async function loadBookings() {

    if (!bookingContainer) {
        return;
    }


    bookingContainer.innerHTML = `

        <div class="admin-loading">

            <div class="admin-spinner"></div>

            Loading bookings...

        </div>

    `;


    try {

        const snapshot =
            await get(
                ref(db, "bookings")
            );


        allBookings = [];


        if (snapshot.exists()) {

            snapshot.forEach((child) => {

                allBookings.push({

                    id: child.key,

                    ...child.val()

                });

            });

        }


        /*
         * Latest bookings first
         */

        allBookings.sort(
            (a, b) =>
                getTimestamp(b) -
                getTimestamp(a)
        );


        renderBookings(
            allBookings
        );

    }

    catch (error) {

        console.error(error);

        bookingContainer.innerHTML = `

            <div class="admin-empty">

                <i class="fas fa-triangle-exclamation"></i>

                <h3>Unable to load bookings</h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>

        `;

    }

}


/* =========================================================
   BOOKING RENDER
========================================================= */

function renderBookings(bookings) {

    if (!bookingContainer) {
        return;
    }


    if (!bookings.length) {

        bookingContainer.innerHTML = `

            <div class="admin-empty">

                <i class="fas fa-calendar-xmark"></i>

                <h3>No Bookings Found</h3>

                <p>
                    Customer bookings will appear here.
                </p>

            </div>

        `;

        return;
    }


    bookingContainer.innerHTML =
        bookings.map(
            booking => createBookingCard(booking)
        ).join("");


    attachBookingEvents();

}


/* =========================================================
   CREATE BOOKING CARD
========================================================= */

function createBookingCard(booking) {

    const vehicle =
        [
            booking.vehicleBrand,
            booking.vehicleModel
        ]
        .filter(Boolean)
        .join(" ");


    const status =
        booking.status || "Pending";


    const statusClass =
        getStatusClass(status);


    const amount =
        booking.finalAmount ??
        booking.estimatedCost ??
        booking.amount ??
        0;


    return `

        <div
            class="admin-booking-card"
            data-booking-id="${escapeHTML(booking.id)}"
        >

            <div class="admin-booking-top">

                <div>

                    <h3>

                        ${escapeHTML(
                            vehicle ||
                            booking.vehicleName ||
                            "Vehicle"
                        )}

                    </h3>

                    <p>

                        Booking ID:
                        <strong>
                            ${escapeHTML(booking.id)}
                        </strong>

                    </p>

                </div>


                <span class="admin-status ${statusClass}">

                    ${escapeHTML(status)}

                </span>

            </div>


            <div class="admin-booking-details">

                <p>

                    <strong>Customer:</strong>

                    ${escapeHTML(
                        booking.customerName ||
                        "Not Available"
                    )}

                </p>


                <p>

                    <strong>Email:</strong>

                    ${escapeHTML(
                        booking.customerEmail ||
                        "-"
                    )}

                </p>


                <p>

                    <strong>Vehicle Number:</strong>

                    ${escapeHTML(
                        booking.vehicleNumber ||
                        "-"
                    )}

                </p>


                <p>

                    <strong>Service:</strong>

                    ${escapeHTML(
                        booking.serviceType ||
                        "-"
                    )}

                </p>


                <p>

                    <strong>Booking Date:</strong>

                    ${escapeHTML(
                        booking.bookingDate ||
                        "-"
                    )}

                </p>


                <p>

                    <strong>Booking Time:</strong>

                    ${escapeHTML(
                        booking.bookingTime ||
                        "-"
                    )}

                </p>


                <p>

                    <strong>Mechanic:</strong>

                    ${escapeHTML(
                        booking.mechanicName ||
                        "Not Assigned"
                    )}

                </p>


                <p>

                    <strong>Amount:</strong>

                    ₹${escapeHTML(amount)}

                </p>

            </div>


            <div class="admin-booking-actions">

                <select
                    class="statusSelect"
                    data-id="${escapeHTML(booking.id)}"
                >

                    <option value="Pending"
                        ${status === "Pending" ? "selected" : ""}>
                        Pending
                    </option>

                    <option value="Confirmed"
                        ${status === "Confirmed" ? "selected" : ""}>
                        Confirmed
                    </option>

                    <option value="In Progress"
                        ${status === "In Progress" ? "selected" : ""}>
                        In Progress
                    </option>

                    <option value="Completed"
                        ${status === "Completed" ? "selected" : ""}>
                        Completed
                    </option>

                    <option value="Cancelled"
                        ${status === "Cancelled" ? "selected" : ""}>
                        Cancelled
                    </option>

                </select>


                <button
                    class="saveStatus"
                    data-id="${escapeHTML(booking.id)}"
                >

                    <i class="fas fa-save"></i>

                    Update Status

                </button>


                <button
                    class="deleteBooking"
                    data-id="${escapeHTML(booking.id)}"
                >

                    <i class="fas fa-trash"></i>

                    Delete

                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    switch (
        String(status).toLowerCase()
    ) {

        case "confirmed":
            return "status-confirmed";

        case "in progress":
        case "in-progress":
            return "status-progress";

        case "completed":
            return "status-completed";

        case "cancelled":
            return "status-cancelled";

        default:
            return "status-pending";

    }

}


/* =========================================================
   BOOKING EVENTS
========================================================= */

function attachBookingEvents() {


    /*
     * UPDATE STATUS
     */

    document
        .querySelectorAll(".saveStatus")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    const select =
                        document.querySelector(
                            `.statusSelect[data-id="${CSS.escape(id)}"]`
                        );


                    if (!select) {
                        return;
                    }


                    const newStatus =
                        select.value;


                    try {

                        button.disabled = true;

                        button.innerHTML =
                            "Updating...";


                        await update(
                            ref(
                                db,
                                "bookings/" + id
                            ),
                            {
                                status: newStatus,

                                updatedAt:
                                    Date.now()
                            }
                        );


                        showNotification(
                            "Success",
                            "Booking status updated successfully.",
                            "success"
                        );


                        await refreshAllData();

                    }

                    catch (error) {

                        console.error(error);

                        showNotification(
                            "Error",
                            "Unable to update booking status.",
                            "error"
                        );

                        button.disabled = false;

                        button.innerHTML =
                            '<i class="fas fa-save"></i> Update Status';

                    }

                }
            );

        });


    /*
     * DELETE BOOKING
     */

    document
        .querySelectorAll(".deleteBooking")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    const confirmed =
                        confirm(
                            "Are you sure you want to delete this booking?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    try {

                        button.disabled = true;

                        button.innerHTML =
                            "Deleting...";


                        await remove(
                            ref(
                                db,
                                "bookings/" + id
                            )
                        );


                        showNotification(
                            "Success",
                            "Booking deleted successfully.",
                            "success"
                        );


                        await refreshAllData();

                    }

                    catch (error) {

                        console.error(error);

                        showNotification(
                            "Error",
                            "Unable to delete booking.",
                            "error"
                        );

                        button.disabled = false;

                        button.innerHTML =
                            '<i class="fas fa-trash"></i> Delete';

                    }

                }
            );

        });

}


/* =========================================================
   LOAD CUSTOMERS
========================================================= */

async function loadCustomers() {

    if (!customerContainer) {
        return;
    }


    customerContainer.innerHTML = `

        <div class="admin-loading">

            <div class="admin-spinner"></div>

            Loading customers...

        </div>

    `;


    try {

        const snapshot =
            await get(
                ref(db, "users")
            );


        allCustomers = [];


        if (snapshot.exists()) {

            snapshot.forEach((child) => {

                const user =
                    child.val();


                if (
                    user.role === "customer"
                ) {

                    allCustomers.push({

                        id: child.key,

                        ...user

                    });

                }

            });

        }


        renderCustomers(
            allCustomers
        );

    }

    catch (error) {

        console.error(error);

        customerContainer.innerHTML = `

            <div class="admin-empty">

                <h3>
                    Unable to load customers
                </h3>

            </div>

        `;

    }

}


/* =========================================================
   RENDER CUSTOMERS
========================================================= */

function renderCustomers(customers) {

    if (!customerContainer) {
        return;
    }


    if (!customers.length) {

        customerContainer.innerHTML = `

            <div class="admin-empty">

                <i class="fas fa-users"></i>

                <h3>
                    No Customers Found
                </h3>

                <p>
                    Registered customers will appear here.
                </p>

            </div>

        `;

        return;
    }


    customerContainer.innerHTML =
        customers.map(
            customer => `

                <div class="admin-card">

                    <h3>

                        ${escapeHTML(
                            customer.name ||
                            "Customer"
                        )}

                    </h3>


                    <p>

                        <strong>Email:</strong>

                        ${escapeHTML(
                            customer.email ||
                            "-"
                        )}

                    </p>


                    <p>

                        <strong>Phone:</strong>

                        ${escapeHTML(
                            customer.phone ||
                            "-"
                        )}

                    </p>


                    <p>

                        <strong>Role:</strong>

                        Customer

                    </p>

                </div>

            `
        ).join("");

}


/* =========================================================
   LOAD MECHANICS
========================================================= */

async function loadMechanics() {

    if (!mechanicContainer) {
        return;
    }


    mechanicContainer.innerHTML = `

        <div class="admin-loading">

            <div class="admin-spinner"></div>

            Loading mechanics...

        </div>

    `;


    try {

        const snapshot =
            await get(
                ref(db, "users")
            );


        allMechanics = [];


        if (snapshot.exists()) {

            snapshot.forEach((child) => {

                const user =
                    child.val();


                if (
                    user.role === "mechanic"
                ) {

                    allMechanics.push({

                        id: child.key,

                        ...user

                    });

                }

            });

        }


        renderMechanics(
            allMechanics
        );

    }

    catch (error) {

        console.error(error);

        mechanicContainer.innerHTML = `

            <div class="admin-empty">

                <h3>
                    Unable to load mechanics
                </h3>

            </div>

        `;

    }

}


/* =========================================================
   RENDER MECHANICS
========================================================= */

function renderMechanics(mechanics) {

    if (!mechanicContainer) {
        return;
    }


    if (!mechanics.length) {

        mechanicContainer.innerHTML = `

            <div class="admin-empty">

                <i class="fas fa-user-gear"></i>

                <h3>
                    No Mechanics Found
                </h3>

                <p>
                    Mechanics managed by the admin
                    will appear here.
                </p>

            </div>

        `;

        return;
    }


    mechanicContainer.innerHTML =
        mechanics.map(
            mechanic => `

                <div class="admin-card">

                    <h3>

                        ${escapeHTML(
                            mechanic.name ||
                            "Mechanic"
                        )}

                    </h3>


                    <p>

                        <strong>Email:</strong>

                        ${escapeHTML(
                            mechanic.email ||
                            "-"
                        )}

                    </p>


                    <p>

                        <strong>Phone:</strong>

                        ${escapeHTML(
                            mechanic.phone ||
                            "-"
                        )}

                    </p>


                    <p>

                        <strong>Experience:</strong>

                        ${escapeHTML(
                            mechanic.experience ||
                            "-"
                        )}

                    </p>


                    <p>

                        <strong>Role:</strong>

                        Mechanic

                    </p>

                </div>

            `
        ).join("");

}


/* =========================================================
   SEARCH BOOKINGS
========================================================= */

if (searchBooking) {

    searchBooking.addEventListener(
        "input",
        () => {

            const searchValue =
                searchBooking.value
                    .trim()
                    .toLowerCase();


            if (!searchValue) {

                renderBookings(
                    allBookings
                );

                return;

            }


            const filtered =
                allBookings.filter(
                    booking => {

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
                            .includes(searchValue);

                    }
                );


            renderBookings(
                filtered
            );

        }
    );

}


/* =========================================================
   REFRESH BUTTON
========================================================= */

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async () => {

            try {

                refreshBtn.disabled = true;

                refreshBtn.innerHTML =
                    '<i class="fas fa-spinner fa-spin"></i> Refreshing...';


                await refreshAllData();


                showNotification(
                    "Dashboard Updated",
                    "Latest data has been loaded.",
                    "success"
                );

            }

            catch (error) {

                console.error(error);

            }

            finally {

                refreshBtn.disabled = false;

                refreshBtn.innerHTML =
                    '<i class="fas fa-refresh"></i> Refresh';

            }

        }
    );

}


/* =========================================================
   NOTIFICATION
========================================================= */

function showNotification(
    title,
    message,
    type = "success"
) {

    let notification =
        document.getElementById(
            "adminNotification"
        );


    /*
     * Create notification automatically
     * if it does not exist in HTML.
     */

    if (!notification) {

        notification =
            document.createElement("div");

        notification.id =
            "adminNotification";

        notification.className =
            "admin-notification";

        document.body.appendChild(
            notification
        );

    }


    notification.className =
        "admin-notification show " +
        type;


    notification.innerHTML = `

        <h4>
            ${escapeHTML(title)}
        </h4>

        <p>
            ${escapeHTML(message)}
        </p>

    `;


    setTimeout(() => {

        notification.classList.remove(
            "show"
        );

    }, 3500);

}


/* =========================================================
   TIMESTAMP HELPER
========================================================= */

function getTimestamp(item) {

    if (!item) {
        return 0;
    }


    /*
     * Firebase timestamp
     */

    if (
        typeof item.createdAt ===
        "number"
    ) {

        return item.createdAt;

    }


    if (
        typeof item.updatedAt ===
        "number"
    ) {

        return item.updatedAt;

    }


    /*
     * Date string fallback
     */

    if (item.bookingDate) {

        const date =
            new Date(
                item.bookingDate
            ).getTime();


        if (!isNaN(date)) {

            return date;

        }

    }


    return 0;

}


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
    async () => {

        /*
         * Only refresh if the admin
         * is authenticated.
         */

        if (!currentAdmin) {
            return;
        }


        try {

            await refreshAllData();

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
            "====================================="
        );

        console.log(
            "SERVORA ADMIN DASHBOARD"
        );

        console.log(
            "Single Page Admin Panel"
        );

        console.log(
            "Realtime Database Connected"
        );

        console.log(
            "====================================="

        );

    }
);


/* =========================================================
   END OF ADMIN.JS
========================================================= */
