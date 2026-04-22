const menu = document.querySelector(".nav__menu");
const openBtn = document.getElementById("open-menu-btn");
const closeBtn = document.getElementById("close-menu-btn");
const setting = document.getElementById("settingbtn")

openBtn.onclick = () => {
    menu.classList.add("show");
    openBtn.style.display = "none";
    closeBtn.style.display = "block";


};

closeBtn.onclick = () => {
    menu.classList.remove("show");
    openBtn.style.display = "block";
    closeBtn.style.display = "none";
};

const elements = document.querySelectorAll(".fade-up");

window.addEventListener("scroll", () => {
    elements.forEach(el => {
        const position = el.getBoundingClientRect().top;
        const screenHeight = window.innerHeight;

        if (position < screenHeight - 100) {
            el.classList.add("show");
        }
    });
});










const fuelButtons = document.querySelectorAll(".fuel-btn button");

fuelButtons.forEach(button => {
    button.addEventListener("click", () => {

        // remove active from all
        fuelButtons.forEach(btn => btn.classList.remove("active"));

        // add active to clicked
        button.classList.add("active");

    });
});









// Agency select
document.querySelectorAll(".agency-box").forEach(box => {
    box.onclick = () => {
        document.querySelectorAll(".agency-box").forEach(b => b.classList.remove("active"));
        box.classList.add("active");
    };
});

// Booking click
const steps = document.querySelectorAll(".step");
const popup = document.getElementById("popup");

document.getElementById("bookBtn").onclick = () => {

    let i = 0;

    let interval = setInterval(() => {
        if (i < steps.length) {
            steps[i].classList.add("active");
            i++;
        } else {
            clearInterval(interval);

            // show popup
            popup.style.display = "block";

            setTimeout(() => {
                popup.style.display = "none";
            }, 3000);
        }
    }, 1000);
};

// Live price update
setInterval(() => {
    let price = 880 + Math.floor(Math.random() * 50);
    document.getElementById("price").innerText = "₹" + price;
}, 3000);




















let selectedRating = 0;

// STAR CLICK
const stars = document.querySelectorAll("#stars span");
stars.forEach(star => {
    star.onclick = () => {
        selectedRating = star.dataset.value;

        stars.forEach(s => s.classList.remove("active"));
        for (let i = 0; i < selectedRating; i++) {
            stars[i].classList.add("active");
        }
    };
});

const btn = document.getElementById("submitFeedback");
const list = document.getElementById("feedbackList");

// LOAD
function loadFeedback() {
    list.innerHTML = "";
    const data = JSON.parse(localStorage.getItem("feedbacks")) || [];

    data.forEach(fb => {
        const div = document.createElement("div");
        div.classList.add("feedback-card");

        // avatar first letter
        const letter = fb.name.charAt(0).toUpperCase();

        // stars
        let starsHTML = "★".repeat(fb.rating);

        div.innerHTML = `
            <div class="avatar">${letter}</div>
            <h4>${fb.name}</h4>
            <div class="rating">${starsHTML}</div>
            <p>${fb.message}</p>
        `;

        list.appendChild(div);
    });
}

// ADD
btn.onclick = () => {
    const name = document.getElementById("name").value;
    const message = document.getElementById("message").value;

    if (!name || !message || selectedRating == 0) {
        return alert("Fill all fields + rating");
    }

    const data = JSON.parse(localStorage.getItem("feedbacks")) || [];

    data.push({ name, message, rating: selectedRating });

    localStorage.setItem("feedbacks", JSON.stringify(data));

    loadFeedback();

    // reset
    document.getElementById("name").value = "";
    document.getElementById("message").value = "";
    selectedRating = 0;
    stars.forEach(s => s.classList.remove("active"));
};

// DEMO DATA
if (!localStorage.getItem("feedbacks")) {
    const demo = [
        { name: "Rahul", message: "Amazing service!", rating: 5 },
        { name: "Priya", message: "Very easy to use 👍", rating: 4 },
        { name: "Amit", message: "Loved tracking feature!", rating: 5 },
        { name: "Sneha", message: "Fast delivery 🚀", rating: 4 },
        { name: "Rohit", message: "Clean UI design", rating: 5 }
    ];
    localStorage.setItem("feedbacks", JSON.stringify(demo));
}

// INIT
loadFeedback();















// reviwe


const form = document.getElementById("feedbackForm");
const wrapper = document.querySelector(".swiper-wrapper");

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const rating = document.getElementById("rating").value;
    const message = document.getElementById("message").value;

    addSlide(name, rating, message);

    form.reset();
});

function addSlide(name, rating, message) {
    const slide = document.createElement("article");
    slide.classList.add("testimonial", "swiper-slide");

    let stars = "⭐".repeat(rating);

    slide.innerHTML = `
        <div class="testimonial__info">
            <h5>${name}</h5>
            <small>${stars}</small>
        </div>
        <div class="testimonial__body">
            <p>${message}</p>
        </div>
    `;

    wrapper.prepend(slide);

    // Swiper refresh
    if (typeof swiper !== "undefined") {
        swiper.update();
    }
}




// ============================================
// SETTINGS PANEL FUNCTIONS
// ============================================
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    const isOpening = !panel.classList.contains('active');
    panel.classList.toggle('active');

    // Show default content when opening
    if (isOpening) {
        showContent('info');
    }
}

function showContent(type, event) {
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    if (event && event.target) {
        event.target.closest('.menu-item').classList.add('active');
    }

    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;

    // Get user data from localStorage or use defaults
    const userData = JSON.parse(localStorage.getItem('userData')) || {
        mobile: '+91 98765 43210',
        email: 'user@example.com',
        name: 'John Doe',
        profilePic: null
    };

    switch (type) {
        case 'info':
            contentArea.innerHTML = `
                        <div class="info-section">
                            <h3>Your Info</h3>
                            <div class="info-card">
                                <div class="info-item">
                                    <span class="info-label">Full Name</span>
                                    <span class="info-value">${userData.name || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Email Address</span>
                                    <span class="info-value">${userData.email || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Mobile Number</span>
                                    <span class="info-value">${userData.mobile || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    `;
            break;

        case 'notifications':
            contentArea.innerHTML = `
                        <div class="notifications-section">
                            <h3>Notifications</h3>
                            <div class="notification-list">
                                <div class="notification-item">
                                    <div class="notification-icon">⛽</div>
                                    <div class="notification-content">
                                        <div class="notification-title">Fuel Price Update</div>
                                        <div class="notification-text">Petrol prices updated in your area</div>
                                        <div class="notification-time">2 hours ago</div>
                                    </div>
                                </div>
                                <div class="notification-item">
                                    <div class="notification-icon">🔋</div>
                                    <div class="notification-content">
                                        <div class="notification-title">EV Station Maintenance</div>
                                        <div class="notification-text">Tata Power station will be closed for maintenance</div>
                                        <div class="notification-time">1 day ago</div>
                                    </div>
                                </div>
                                <div class="notification-item">
                                    <div class="notification-icon">🎉</div>
                                    <div class="notification-content">
                                        <div class="notification-title">New Feature Available</div>
                                        <div class="notification-text">Try our new route optimization feature</div>
                                        <div class="notification-time">3 days ago</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
            break;

        case 'privacy':
            contentArea.innerHTML = `
                        <div class="privacy-section">
                            <h3>Privacy & Security</h3>
                            <div class="settings-list">
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">Location Services</div>
                                        <div class="setting-description">Allow access to your location for better station recommendations</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">Data Sharing</div>
                                        <div class="setting-description">Share anonymous usage data to improve our service</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <div class="setting-title">Push Notifications</div>
                                        <div class="setting-description">Receive notifications about fuel prices and station updates</div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    `;
            break;

        case 'about':
            contentArea.innerHTML = `
                        <div class="about-section">
                            <h3>About FuelFinder</h3>
                            <div class="about-content">
                                <div class="app-info">
                                    <div class="app-version">Version 2.1.0</div>
                                    <div class="app-description">
                                        FuelFinder helps you find the nearest fuel stations, compare prices, and book gas cylinders in Kolhapur and surrounding areas.
                                    </div>
                                </div>
                                <div class="feature-list">
                                    <div class="feature-item">
                                        <span class="feature-icon">🗺️</span>
                                        <span>Interactive Maps</span>
                                    </div>
                                    <div class="feature-item">
                                        <span class="feature-icon">⛽</span>
                                        <span>Real-time Fuel Prices</span>
                                    </div>
                                    <div class="feature-item">
                                        <span class="feature-icon">🔋</span>
                                        <span>EV Charging Stations</span>
                                    </div>
                                    <div class="feature-item">
                                        <span class="feature-icon">📦</span>
                                        <span>Gas Cylinder Booking</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
            break;

        case 'help':
            contentArea.innerHTML = `
                        <div class="help-section">
                            <h3>Help & Feedback</h3>
                            <div class="help-content">
                                <div class="help-item">
                                    <div class="help-icon">❓</div>
                                    <div class="help-text">
                                        <div class="help-title">How to find stations</div>
                                        <div class="help-description">Use the map or station list to find fuel stations near you</div>
                                    </div>
                                </div>
                                <div class="help-item">
                                    <div class="help-icon">📞</div>
                                    <div class="help-text">
                                        <div class="help-title">Contact Support</div>
                                        <div class="help-description">support@fuelfinder.com | +91 98765 43210</div>
                                    </div>
                                </div>
                                <div class="help-item">
                                    <div class="help-icon">💬</div>
                                    <div class="help-text">
                                        <div class="help-title">Chat with AI Assistant</div>
                                        <div class="help-description">Click the chat icon in the bottom right corner</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
            break;

        case 'signout':
            signOut();
            break;
    }

}
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    const overlay = document.getElementById('overlay');

    panel.classList.toggle('active');
    overlay.classList.toggle('active');
}

if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "login.html";
}










document.querySelectorAll(".fuel-btn button").forEach(btn => {
    btn.addEventListener("click", function () {
        document.querySelectorAll(".fuel-btn button").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
    });
});

function nextStep() {
    const steps = document.querySelectorAll(".step-content");
    const indicators = document.querySelectorAll(".step-indicator");

    let current = [...steps].findIndex(s => s.classList.contains("active"));

    if (current < steps.length - 1) {
        steps[current].classList.remove("active");
        indicators[current].classList.remove("active");

        steps[current + 1].classList.add("active");
        indicators[current + 1].classList.add("active");
    }

    // Fill summary automatically
    if (current === 1) {
        document.getElementById("summaryName").innerText = fullName.value;
        document.getElementById("summaryMobile").innerText = mobileNumber.value;
        document.getElementById("summaryConsumer").innerText = consumerId.value;
        document.getElementById("summaryAddress").innerText = address.value;
        document.getElementById("summaryDate").innerText = deliveryDate.value;
    }
}

function confirmBooking() {
    document.getElementById("step3").style.display = "none";
    document.getElementById("bookingSuccess").style.display = "block";

    document.getElementById("bookingRef").innerText =
        "#FUEL" + Math.floor(Math.random() * 1000000);
}

const paymentOptions = document.querySelectorAll(".payment-option");
const onlineDetails = document.getElementById("onlinePaymentDetails");

paymentOptions.forEach(option => {
    option.addEventListener("click", () => {

        // active class handle
        paymentOptions.forEach(o => o.classList.remove("selected"));
        option.classList.add("selected");

        const type = option.getAttribute("data-payment");

        // 🔥 HE TULA VICHARLALA CODE ITHE TAKAYCHA
        if (type === "online") {
            onlineDetails.classList.remove("hide");
            onlineDetails.classList.add("show");
            onlineDetails.style.display = "block";
        } else {
            onlineDetails.classList.remove("show");
            onlineDetails.classList.add("hide");

            setTimeout(() => {
                onlineDetails.style.display = "none";
            }, 300);
        }

    });
});


// Pre-loaded reviews
const mockReviews = [
    {
        id: 1,
        name: "Rajesh Kumar",
        initial: "R",
        color: "#FF6B00",
        rating: 5,
        fuel: "petrol",
        text: "Best fuel station in Pune! The staff is incredibly helpful and they always maintain high quality fuel. Been a loyal customer for 3 years now.",
        time: "2 hours ago"
    },
    {
        id: 2,
        name: "Priya Sharma",
        initial: "P",
        color: "#00FFD1",
        rating: 4,
        fuel: "ev",
        text: "Tata Power EV Hub is amazing. Fast charging and clean facilities. Wish they had more slots though.",
        time: "5 hours ago"
    },
    {
        id: 3,
        name: "Amit Patel",
        initial: "A",
        color: "#4A90D9",
        rating: 5,
        fuel: "diesel",
        text: "Perfect for my commercial vehicle. Always get diesel at fair price and never face quality issues.",
        time: "1 day ago"
    },
    {
        id: 4,
        name: "Sneha Joshi",
        initial: "S",
        color: "#00C853",
        rating: 4,
        fuel: "cng",
        text: "CNG station near my house is great. Fast filling and saves money compared to petrol.",
        time: "1 day ago"
    },
    {
        id: 5,
        name: "Vikram Singh",
        initial: "V",
        color: "#FFD600",
        rating: 5,
        fuel: "gas",
        text: "HP Gas delivers within 24 hours every time. Their online booking system is super convenient!",
        time: "2 days ago"
    }
];