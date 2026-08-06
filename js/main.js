/* ==========================================
   SERVORA - MAIN JAVASCRIPT
   Part 1
========================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* ======================================
       Sticky Navbar
    ====================================== */

    const header = document.querySelector("header");

    if (header) {

        window.addEventListener("scroll", function () {

            if (window.scrollY > 50) {
                header.classList.add("sticky");
            } else {
                header.classList.remove("sticky");
            }

        });

    }

    /* ======================================
       Mobile Menu
    ====================================== */

    const menuBtn = document.querySelector(".menu-btn");
    const navLinks = document.querySelector(".nav-links");

    if (menuBtn && navLinks) {

        menuBtn.addEventListener("click", function () {

            navLinks.classList.toggle("active");

            if (menuBtn.querySelector("i")) {

                menuBtn.querySelector("i").classList.toggle("fa-bars");
                menuBtn.querySelector("i").classList.toggle("fa-times");

            }

        });

        document.querySelectorAll(".nav-links a").forEach(link => {

            link.addEventListener("click", function () {

                navLinks.classList.remove("active");

                if (menuBtn.querySelector("i")) {

                    menuBtn.querySelector("i").classList.remove("fa-times");
                    menuBtn.querySelector("i").classList.add("fa-bars");

                }

            });

        });

    }

    /* ======================================
       Smooth Scroll
    ====================================== */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (e) {

            const target = document.querySelector(this.getAttribute("href"));

            if (target) {

                e.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth"
                });

            }

        });

    });

    /* ======================================
       FAQ Accordion
    ====================================== */

    const faqButtons = document.querySelectorAll(".faq-question");

    faqButtons.forEach(button => {

        button.addEventListener("click", function () {

            const answer = this.nextElementSibling;

            document.querySelectorAll(".faq-answer").forEach(item => {

                if (item !== answer) {

                    item.style.display = "none";

                }

            });

            if (answer.style.display === "block") {

                answer.style.display = "none";

            } else {

                answer.style.display = "block";

            }

        });

    });

    /* ======================================
       Scroll Reveal Animation
    ====================================== */

    const revealElements = document.querySelectorAll(

        ".service-card, \
        .choose-card, \
        .achievement-card, \
        .testimonial-card, \
        .dashboard-card, \
        .booking-card, \
        .history-card, \
        .vehicle-card, \
        .admin-card, \
        .mechanic-card"

    );

    function revealOnScroll() {

        const trigger = window.innerHeight - 120;

        revealElements.forEach(el => {

            const top = el.getBoundingClientRect().top;

            if (top < trigger) {

                el.style.opacity = "1";
                el.style.transform = "translateY(0)";

            }

        });

    }

    revealElements.forEach(el => {

        el.style.opacity = "0";
        el.style.transform = "translateY(40px)";
        el.style.transition = "0.6s ease";

    });

    revealOnScroll();

    window.addEventListener("scroll", revealOnScroll);

    /* ======================================
       Button Ripple Effect
    ====================================== */

    document.querySelectorAll("button,.btn-primary,.btn-secondary").forEach(btn => {

        btn.addEventListener("click", function (e) {

            const circle = document.createElement("span");

            const diameter = Math.max(this.clientWidth, this.clientHeight);

            circle.style.width = diameter + "px";
            circle.style.height = diameter + "px";

            circle.style.position = "absolute";
            circle.style.borderRadius = "50%";
            circle.style.background = "rgba(255,255,255,.4)";
            circle.style.pointerEvents = "none";

            const rect = this.getBoundingClientRect();

            circle.style.left = e.clientX - rect.left - diameter / 2 + "px";
            circle.style.top = e.clientY - rect.top - diameter / 2 + "px";

            circle.classList.add("ripple");

            this.appendChild(circle);

            setTimeout(() => {

                circle.remove();

            }, 600);

        });

    });

});

/* ==========================================
   SERVORA - MAIN JAVASCRIPT
   Part 2
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ======================================
       Active Navigation
    ====================================== */

    const currentPage = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".nav-links a").forEach(link => {

    const href = link.getAttribute("href");

    if (!href) return;

    if (href === currentPage) {

        document
            .querySelectorAll(".nav-links a")
            .forEach(item => item.classList.remove("active"));

        link.classList.add("active");

    }

});

    /* ======================================
       Animated Counter
    ====================================== */

    const counters = document.querySelectorAll(".counter");

    counters.forEach(counter => {

        const target = Number(counter.dataset.target);

        if (isNaN(target)) return;

        let count = 0;

        const speed = target / 100;

        const updateCounter = () => {

            if (count < target) {

                count += speed;

                counter.innerText = Math.ceil(count);

                requestAnimationFrame(updateCounter);

            } else {

                counter.innerText = target;

            }

        };

        updateCounter();

    });

    /* ======================================
       Back To Top Button
    ====================================== */

    let topBtn = document.getElementById("backToTop");

    if (!topBtn) {

        topBtn = document.createElement("button");

        topBtn.id = "backToTop";

        topBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';

        document.body.appendChild(topBtn);

    }

    topBtn.style.cssText = `
        position:fixed;
        right:25px;
        bottom:25px;
        width:50px;
        height:50px;
        border:none;
        border-radius:50%;
        background:#2563EB;
        color:#fff;
        cursor:pointer;
        display:none;
        z-index:9999;
        box-shadow:0 10px 25px rgba(0,0,0,.2);
    `;

    window.addEventListener("scroll", () => {

        if (window.scrollY > 400) {

            topBtn.style.display = "block";

        } else {

            topBtn.style.display = "none";

        }

    });

    topBtn.addEventListener("click", () => {

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    });

    /* ======================================
       Contact Form Validation
    ====================================== */

    const contactForm = document.querySelector("#contactForm");

    if (contactForm) {

        contactForm.addEventListener("submit", function (e) {

            const inputs = this.querySelectorAll("input[required], textarea[required]");

            let valid = true;

            inputs.forEach(input => {

                if (input.value.trim() === "") {

                    input.style.border = "2px solid red";

                    valid = false;

                } else {

                    input.style.border = "1px solid #ddd";

                }

            });

            if (!valid) {

                e.preventDefault();

                alert("Please fill all required fields.");

            }

        });

    }

    /* ======================================
       Newsletter Validation
    ====================================== */

    const newsletter = document.querySelector("#newsletterForm");

    if (newsletter) {

        newsletter.addEventListener("submit", function (e) {

            e.preventDefault();

            const email = this.querySelector("input");

            if (!email.value.includes("@")) {

                alert("Please enter a valid email.");

                return;

            }

            alert("Thank you for subscribing!");

            this.reset();

        });

    }

    /* ======================================
       Image Lazy Loading
    ====================================== */

    const lazyImages = document.querySelectorAll("img[data-src]");

    if ("IntersectionObserver" in window) {

        const observer = new IntersectionObserver(entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    const img = entry.target;

                    img.src = img.dataset.src;

                    img.removeAttribute("data-src");

                    observer.unobserve(img);

                }

            });

        });

        lazyImages.forEach(img => observer.observe(img));

    }

    /* ======================================
       Print Helper
    ====================================== */

    const printBtn = document.getElementById("printBtn");

    if (printBtn) {

        printBtn.addEventListener("click", () => {

            window.print();

        });

    }

    /* ======================================
       Utility Functions
    ====================================== */

    window.showSuccess = function (message) {

        alert(message);

    };

    window.showError = function (message) {

        alert(message);

    };

    /* ======================================
       Footer Year
    ====================================== */

    const year = document.getElementById("currentYear");

    if (year) {

        year.textContent = new Date().getFullYear();

    }

    /* ======================================
       Page Loader
    ====================================== */

    const loader = document.getElementById("loader");

    if (loader) {

        window.addEventListener("load", () => {

            loader.style.opacity = "0";

            setTimeout(() => {

                loader.style.display = "none";

            }, 500);

        });

    }

    console.log("✅ Servora Main JS Loaded Successfully");

});