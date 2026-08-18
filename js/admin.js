/* =========================================================
   SERVORA ADMIN.JS
   REALTIME DATABASE VERSION
   UPDATED FOR CURRENT CUSTOMER BOOKING SYSTEM
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


/* =========================================================
   HELPER FUNCTIONS
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


function getVehicleName(booking) {

    if (booking.vehicleName) {
        return booking.vehicleName;
    }

    const brand = booking.vehicleBrand || "";
    const model = booking.vehicleModel || "";

    const vehicle = `${brand} ${model}`.trim();

    return vehicle || "Vehicle Not Available";
}


function getAmount(booking) {

    if (
        booking.finalAmount !== undefined &&
        booking.finalAmount !== null &&
        booking.finalAmount !== ""
    ) {
        return booking.finalAmount;
    }

    if (
        booking.estimatedCost !== undefined &&
        booking.estimatedCost !== null &&
        booking.estimatedCost !== ""
    ) {
        return booking.estimatedCost;
    }

    return 0;
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


        const userRef = ref(
            db,
            "users/" + user.uid
        );


        const userSnap = await get(userRef);


        if (!userSnap.exists()) {

            await signOut(auth);

            window.location.href = "admin-login.html";

            return;

        }


        const data = userSnap.val();


        if (data.role !== "admin") {

            await signOut(auth);

            window.location.href = "admin-login.html";

            return;

        }


        currentAdmin = user;


        /* Load dashboard */

        await loadDashboard();

        await loadBookings();

        await loadCustomers();

        await loadMechanics();


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

const logoutBtn =
    document.getElementById("logoutBtn");


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

            }

        }
    );

}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

async function loadDashboard() {

    try {

        const bookingSnap =
            await get(
                ref(db, "bookings")
            );


        const userSnap =
            await get(
                ref(db, "users")
            );


        let totalBookings = 0;
        let pending = 0;
        let confirmed = 0;
        let inProgress = 0;
        let completed = 0;

        let totalCustomers = 0;
        let totalMechanics = 0;


        /* -----------------------------------------
           BOOKINGS
        ----------------------------------------- */

        if (bookingSnap.exists()) {

            bookingSnap.forEach((child) => {

                const booking = child.val();

                totalBookings++;


                if (booking.status === "Pending") {
                    pending++;
                }


                if (booking.status === "Confirmed") {
                    confirmed++;
                }


                if (booking.status === "In Progress") {
                    inProgress++;
                }


                if (booking.status === "Completed") {
                    completed++;
                }

            });

        }


        /* -----------------------------------------
           USERS
        ----------------------------------------- */

        if (userSnap.exists()) {

            userSnap.forEach((child) => {

                const user = child.val();


                if (user.role === "customer") {
                    totalCustomers++;
                }


                if (user.role === "mechanic") {
                    totalMechanics++;
                }

            });

        }


        /* -----------------------------------------
           UPDATE DASHBOARD
        ----------------------------------------- */

        const totalBookingsElement =
            document.getElementById(
                "totalBookings"
            );

        if (totalBookingsElement) {
            totalBookingsElement.textContent =
                totalBookings;
        }


        const pendingElement =
            document.getElementById(
                "pendingBookings"
            );

        if (pendingElement) {
            pendingElement.textContent =
                pending;
        }


        const completedElement =
            document.getElementById(
                "completedBookings"
            );

        if (completedElement) {
            completedElement.textContent =
                completed;
        }


        const customersElement =
            document.getElementById(
                "totalCustomers"
            );

        if (customersElement) {
            customersElement.textContent =
                totalCustomers;
        }


        const mechanicsElement =
            document.getElementById(
                "totalMechanics"
            );

        if (mechanicsElement) {
            mechanicsElement.textContent =
                totalMechanics;
        }


        /* Optional statistics */

        const confirmedElement =
            document.getElementById(
                "confirmedBookings"
            );

        if (confirmedElement) {
            confirmedElement.textContent =
                confirmed;
        }


        const progressElement =
            document.getElementById(
                "inProgressBookings"
            );

        if (progressElement) {
            progressElement.textContent =
                inProgress;
        }


    }
    catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


/* =========================================================
   LOAD BOOKINGS
========================================================= */

async function loadBookings() {

    const container =
        document.getElementById(
            "bookingContainer"
        );


    if (!container) {
        return;
    }


    try {

        container.innerHTML = `
            <p class="admin-loading">
                Loading bookings...
            </p>
        `;


        const snapshot =
            await get(
                ref(db, "bookings")
            );


        if (!snapshot.exists()) {

            container.innerHTML = `
                <div class="admin-empty">
                    <h3>No Bookings Found</h3>
                    <p>
                        Customer bookings will appear here.
                    </p>
                </div>
            `;

            return;

        }


        const bookings = [];


        snapshot.forEach((child) => {

            bookings.push({

                id: child.key,

                ...child.val()

            });

        });


        /* Latest bookings first */

        bookings.sort(
            (a, b) =>
                (b.createdAt || 0) -
                (a.createdAt || 0)
        );


        container.innerHTML = "";


        bookings.forEach((booking) => {

            const vehicleName =
                getVehicleName(booking);


            const amount =
                getAmount(booking);


            const status =
                booking.status || "Pending";


            container.innerHTML += `

                <div
                    class="admin-booking-card"
                    data-booking-id="${escapeHTML(booking.id)}"
                >

                    <div class="admin-booking-header">

                        <div>

                            <h3>
                                ${escapeHTML(
                                    booking.serviceType ||
                                    "Service Booking"
                                )}
                            </h3>

                            <span class="booking-id">
                                Booking ID:
                                ${escapeHTML(
                                    booking.id
                                )}
                            </span>

                        </div>

                    </div>


                    <div class="admin-booking-details">


                        <p>

                            <strong>
                                Customer:
                            </strong>

                            ${escapeHTML(
                                booking.customerName ||
                                "Not Available"
                            )}

                        </p>


                        <p>

                            <strong>
                                Email:
                            </strong>

                            ${escapeHTML(
                                booking.customerEmail ||
                                "Not Available"
                            )}

                        </p>


                        <p>

                            <strong>
                                Vehicle:
                            </strong>

                            ${escapeHTML(
                                vehicleName
                            )}

                        </p>


                        <p>

                            <strong>
                                Vehicle Number:
                            </strong>

                            ${escapeHTML(
                                booking.vehicleNumber ||
                                "Not Available"
                            )}

                        </p>


                        <p>

                            <strong>
                                Service:
                            </strong>

                            ${escapeHTML(
                                booking.serviceType ||
                                "Not Available"
                            )}

                        </p>


                        <p>

                            <strong>
                                Date:
                            </strong>

                            ${escapeHTML(
                                booking.bookingDate ||
                                "Not Selected"
                            )}

                        </p>


                        <p>

                            <strong>
                                Time:
                            </strong>

                            ${escapeHTML(
                                booking.bookingTime ||
                                "Not Selected"
                            )}

                        </p>


                        <p>

                            <strong>
                                Mechanic:
                            </strong>

                            ${escapeHTML(
                                booking.mechanicName ||
                                "Not Assigned"
                            )}

                        </p>


                        <p>

                            <strong>
                                Amount:
                            </strong>

                            ₹${escapeHTML(amount)}

                        </p>


                        <p>

                            <strong>
                                Payment:
                            </strong>

                            ${escapeHTML(
                                booking.paymentStatus ||
                                "Pending"
                            )}

                        </p>


                    </div>


                    ${
                        booking.mechanicNote
                        ?
                        `
                        <div class="admin-booking-note">

                            <strong>
                                Mechanic Note:
                            </strong>

                            <p>
                                ${escapeHTML(
                                    booking.mechanicNote
                                )}
                            </p>

                        </div>
                        `
                        :
                        ""
                    }


                    <div class="admin-booking-actions">


                        <label>
                            Status
                        </label>


                        <select
                            class="statusSelect"
                            data-id="${escapeHTML(
                                booking.id
                            )}"
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

                        </select>


                        <button
                            class="saveStatus"
                            data-id="${escapeHTML(
                                booking.id
                            )}"
                        >
                            Update Status
                        </button>


                        <button
                            class="deleteBooking"
                            data-id="${escapeHTML(
                                booking.id
                            )}"
                        >
                            Delete Booking
                        </button>


                    </div>


                </div>

            `;

        });


        attachBookingEvents();


    }
    catch (error) {

        console.error(
            "Booking loading error:",
            error
        );


        container.innerHTML = `

            <div class="admin-error">

                <h3>
                    Unable to Load Bookings
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

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


                    if (!select) {
                        return;
                    }


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
                                status: newStatus,
                                updatedAt:
                                    Date.now()
                            }
                        );


                        alert(
                            "Booking status updated successfully."
                        );


                        await loadDashboard();

                        await loadBookings();

                    }
                    catch (error) {

                        console.error(
                            "Status update error:",
                            error
                        );


                        alert(
                            "Unable to update booking status."
                        );


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


                    if (!confirmed) {
                        return;
                    }


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


                        await loadDashboard();

                        await loadBookings();

                    }
                    catch (error) {

                        console.error(
                            "Delete booking error:",
                            error
                        );


                        alert(
                            "Unable to delete booking."
                        );


                        button.disabled = false;

                        button.textContent =
                            "Delete Booking";

                    }

                }
            );

        });

}


/* =========================================================
   LOAD CUSTOMERS
========================================================= */

async function loadCustomers() {

    const container =
        document.getElementById(
            "customerContainer"
        );


    if (!container) {
        return;
    }


    try {

        container.innerHTML = `
            <p class="admin-loading">
                Loading customers...
            </p>
        `;


        const snapshot =
            await get(
                ref(db, "users")
            );


        if (!snapshot.exists()) {

            container.innerHTML = `
                <div class="admin-empty">
                    <h3>No Customers Found</h3>
                </div>
            `;

            return;

        }


        container.innerHTML = "";


        let count = 0;


        snapshot.forEach((child) => {

            const user =
                child.val();


            if (user.role !== "customer") {
                return;
            }


            count++;


            container.innerHTML += `

                <div class="admin-card">

                    <h3>
                        ${escapeHTML(
                            user.name ||
                            "Customer"
                        )}
                    </h3>


                    <p>

                        <strong>
                            Email:
                        </strong>

                        ${escapeHTML(
                            user.email ||
                            "Not Available"
                        )}

                    </p>


                    <p>

                        <strong>
                            Phone:
                        </strong>

                        ${escapeHTML(
                            user.phone ||
                            "-"
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


        if (count === 0) {

            container.innerHTML = `
                <div class="admin-empty">

                    <h3>
                        No Customers Found
                    </h3>

                    <p>
                        Registered customers will appear here.
                    </p>

                </div>
            `;

        }

    }
    catch (error) {

        console.error(
            "Customer loading error:",
            error
        );

        container.innerHTML = `
            <p>
                Unable to load customers.
            </p>
        `;

    }

}


/* =========================================================
   LOAD MECHANICS
========================================================= */

async function loadMechanics() {

    const container =
        document.getElementById(
            "mechanicContainer"
        );


    if (!container) {
        return;
    }


    try {

        container.innerHTML = `
            <p class="admin-loading">
                Loading mechanics...
            </p>
        `;


        const snapshot =
            await get(
                ref(db, "users")
            );


        if (!snapshot.exists()) {

            container.innerHTML = `
                <div class="admin-empty">

                    <h3>
                        No Mechanics Found
                    </h3>

                </div>
            `;

            return;

        }


        container.innerHTML = "";


        let count = 0;


        snapshot.forEach((child) => {

            const user =
                child.val();


            if (user.role !== "mechanic") {
                return;
            }


            count++;


            container.innerHTML += `

                <div class="admin-card">

                    <h3>

                        ${escapeHTML(
                            user.name ||
                            "Mechanic"
                        )}

                    </h3>


                    <p>

                        <strong>
                            Email:
                        </strong>

                        ${escapeHTML(
                            user.email ||
                            "Not Available"
                        )}

                    </p>


                    <p>

                        <strong>
                            Phone:
                        </strong>

                        ${escapeHTML(
                            user.phone ||
                            "-"
                        )}

                    </p>


                    <p>

                        <strong>
                            Experience:
                        </strong>

                        ${escapeHTML(
                            user.experience ||
                            "-"
                        )}

                    </p>


                    <p>

                        <strong>
                            Role:
                        </strong>

                        Mechanic

                    </p>

                </div>

            `;

        });


        if (count === 0) {

            container.innerHTML = `
                <div class="admin-empty">

                    <h3>
                        No Mechanics Found
                    </h3>

                    <p>
                        Mechanics managed by the admin
                        will appear here.
                    </p>

                </div>
            `;

        }

    }
    catch (error) {

        console.error(
            "Mechanic loading error:",
            error
        );

        container.innerHTML = `
            <p>
                Unable to load mechanics.
            </p>
        `;

    }

}


/* =========================================================
   SEARCH BOOKINGS
========================================================= */

const searchInput =
    document.getElementById(
        "searchBooking"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const value =
                searchInput.value
                    .toLowerCase()
                    .trim();


            document
                .querySelectorAll(
                    ".admin-booking-card"
                )
                .forEach((card) => {

                    const text =
                        card.innerText
                            .toLowerCase();


                    card.style.display =
                        text.includes(value)
                            ? ""
                            : "none";

                });

        }
    );

}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

const refreshBtn =
    document.getElementById(
        "refreshDashboard"
    );


if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async () => {

            refreshBtn.disabled = true;

            refreshBtn.textContent =
                "Refreshing...";


            try {

                await loadDashboard();

                await loadBookings();

                await loadCustomers();

                await loadMechanics();

            }
            catch (error) {

                console.error(
                    "Refresh error:",
                    error
                );

            }


            refreshBtn.disabled = false;

            refreshBtn.textContent =
                "Refresh";

        }
    );

}


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
    async () => {

        if (!currentAdmin) {
            return;
        }


        await loadDashboard();

        await loadBookings();

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
            "Servora Admin Dashboard Initialized"
        );

    }
);


/* =========================================================
   END
========================================================= */

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
