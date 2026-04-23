function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("rememberUser");
    window.location.replace("sign.html");
}


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM ready");
    const userName = localStorage.getItem("userName") || localStorage.getItem("userEmail");
    const nameEl = document.getElementById('userName');
    if (nameEl) {
        nameEl.textContent = userName || "Guest";
    }
});


const SUPABASE_URL = "https://zrgvxxbdevcwkpohckwj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZ3Z4eGJkZXZjd2twb2hja3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzAwNzgsImV4cCI6MjA5MjI0NjA3OH0.-js43IF_QQk7793-AqP6aSV2VbyWiZWj9SH5tprYjJs";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let map;
let userMarker;
let markers = [];

/* ===== BUTTON EVENTS ===== */
document.querySelector(".petrol-btn").onclick = () => start("petrol");
document.querySelector(".diesel-btn").onclick = () => start("Diesel");
document.querySelector(".cng-btn").onclick = () => start("cng");
document.querySelector(".electric-btn").onclick = () => start("EV");


/* ===== MAIN FUNCTION ===== */
async function start(type) {

    document.querySelector(".map-section").style.display = "grid";

    navigator.geolocation.getCurrentPosition(async (pos) => {

        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        /* MAP INIT */
        if (!map) {
            map = L.map('map').setView([userLat, userLng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
                .addTo(map);
        }

        /* USER MARKER */
        if (userMarker) map.removeLayer(userMarker);

        userMarker = L.marker([userLat, userLng])
            .addTo(map)
            .bindPopup("You are here")
            .openPopup();

        /* REMOVE OLD MARKERS */
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        /* ===== FETCH DATA ===== */
        const { data, error } = await client
            .from(type)
            .select("*");

        /* 🔥 DEBUG LOG */
        console.log("TABLE:", type);
        console.log("DATA:", data);
        console.log("ERROR:", error);

        if (error) {
            document.getElementById("stationInfoPanel").innerHTML =
                "❌ Error: " + error.message;
            return;
        }

        if (!data || data.length === 0) {
            document.getElementById("stationInfoPanel").innerHTML =
                "❌ No data found in table: " + type;
            return;
        }

        /* ===== PROCESS DATA ===== */
        const processed = data.map(s => {

            const lat = parseFloat(s.latitude);
            const lng = parseFloat(s.longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            return {
                ...s,
                latitude: lat,
                longitude: lng,
                dist: getDistance(userLat, userLng, lat, lng)
            };

        }).filter(Boolean);

        if (!processed.length) {
            document.getElementById("stationInfoPanel").innerHTML =
                "❌ Invalid latitude/longitude data";
            return;
        }

        /* ===== FILTER 30KM ===== */
        const nearby = processed
            .filter(s => s.dist <= 30)
            .sort((a, b) => a.dist - b.dist);

        const finalData = nearby.length ? nearby : processed;

        /* ===== SHOW UI ===== */
        showUI(finalData.slice(0, 4), type);

        /* ===== ADD MARKERS ===== */
        finalData.slice(0, 4).forEach(s => {

            const m = L.marker([s.latitude, s.longitude])
                .addTo(map)
                .bindPopup(`${s.Station || "Station"} (${s.dist.toFixed(1)} km)`);

            markers.push(m);
        });

    });
}

/* ===== UI ===== */
function showUI(stations, type) {

    const panel = document.getElementById("stationInfoPanel");

    panel.innerHTML = `
        <div class="station-title">
            Nearby ${type.toUpperCase()} Stations
        </div>

        ${stations.map(s => `
            <div class="station-item">

                <div class="row top">
                    <h3>${s.Station || '--'}</h3>
                    <span class="price">₹${s.Price || '--'}</span>
                </div>

                <div class="address">
                    📍 ${s.Address || '--'}
                </div>

                <div class="row info">
                    <span>⭐ ${s.Rating || '--'}</span>
                    <span>📍 ${s.dist.toFixed(1)} km</span>
                    <span>⏱ ${s["Travel Time"] || '--'} min</span>
                </div>

                <div class="actions">
                    <button onclick="viewOnMap(${s.latitude}, ${s.longitude})">View</button>
                    <button onclick="route(${s.latitude}, ${s.longitude})">Route</button>
                </div>

            </div>
        `).join("")}
    `;
}


/* ===== VIEW ===== */
function viewOnMap(lat, lng) {
    map.setView([lat, lng], 15);

    L.marker([lat, lng]).addTo(map)
        .bindPopup("Station")
        .openPopup();
}


/* ===== ROUTE ===== */
function route(lat, lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
}


/* ===== DISTANCE ===== */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}


let selectedEVStation = null;
let selectedDate = null;
let selectedSlot = null;
let currentEVData = [];

// Update your existing start function for EV
const originalStart = start;
start = async function (type) {
    if (type === "EV") {
        document.getElementById("evBookingSection").style.display = "none";
    }
    await originalStart(type);
}

// Update showUI to add "Book Slot" button for EV
function showUI(stations, type) {
    const panel = document.getElementById("stationInfoPanel");
    currentEVData = stations; // Store for booking

    panel.innerHTML = `
        <div class="station-title">
            Nearby ${type.toUpperCase()} Stations
        </div>
        ${stations.map((s, idx) => `
            <div class="station-item">
                <div class="row top">
                    <h3>${s.Station || '--'}</h3>
                    <span class="price">₹${s.Price || '--'}/kWh</span>
                </div>
                <div class="address">📍 ${s.Address || '--'}</div>
                <div class="row info">
                    <span>⭐ ${s.Rating || '--'}</span>
                    <span>📍 ${s.dist.toFixed(1)} km</span>
                    <span>⏱ ${s["Travel Time"] || '--'} min</span>
                </div>
                <div class="actions">
                    <button onclick="viewOnMap(${s.latitude}, ${s.longitude})">View</button>
                    <button onclick="route(${s.latitude}, ${s.longitude})">Route</button>
                </div>
                ${type === 'EV' ? `<button class="btn-book-ev" onclick="openEVBooking(${idx})">⚡ Book Charging Slot</button>` : ''}
            </div>
        `).join("")}
    `;
}

// Open EV Booking Panel
function openEVBooking(stationIndex) {
    selectedEVStation = currentEVData[stationIndex];
    selectedDate = null;
    selectedSlot = null;

    document.getElementById("evBookingSection").style.display = "block";
    document.getElementById("evStationName").textContent = selectedEVStation.Station;
    document.getElementById("evStationAddress").textContent = selectedEVStation.Address;
    document.getElementById("evStationDist").textContent = `• ${selectedEVStation.dist.toFixed(1)} km`;
    document.getElementById("evStationPrice").textContent = `• ₹${selectedEVStation.Price}/kWh`;

    generateDatePicker();
    document.getElementById("slotsGrid").innerHTML = '<p style="color:#666;text-align:center;grid-column:1/-1;">Select a date first</p>';
    updateBookingSummary();

    document.getElementById("evBookingSection").scrollIntoView({ behavior: 'smooth' });
}

// Generate next 7 days
function generateDatePicker() {
    const datePicker = document.getElementById("datePicker");
    datePicker.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const num = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const dateStr = date.toISOString().split('T')[0];

        const dateEl = document.createElement('div');
        dateEl.className = 'date-item';
        dateEl.dataset.date = dateStr;
        dateEl.innerHTML = `
            <div class="date-day">${day}</div>
            <div class="date-num">${num}</div>
            <div class="date-month">${month}</div>
        `;
        dateEl.onclick = () => selectDate(dateStr, dateEl);
        datePicker.appendChild(dateEl);
    }
}

// Select date and load slots
async function selectDate(dateStr, el) {
    document.querySelectorAll('.date-item').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
    selectedDate = dateStr;
    selectedSlot = null;

    await loadSlotsForDate(dateStr);
    updateBookingSummary();
}

// Load slots from Supabase
async function loadSlotsForDate(dateStr) {
    const slotsGrid = document.getElementById("slotsGrid");
    slotsGrid.innerHTML = '<p style="color:#666;text-align:center;grid-column:1/-1;">Loading slots...</p>';

    // Fetch latest booking data
    const { data, error } = await client
        .from('EV')
        .select('booked_slots, slot_duration, total_slots')
        .eq('id', selectedEVStation.id)
        .single();

    if (error) {
        slotsGrid.innerHTML = '<p style="color:#ff5722;text-align:center;grid-column:1/-1;">Error loading slots</p>';
        return;
    }

    const bookedSlots = data.booked_slots?.[dateStr] || [];
    const duration = data.slot_duration || 30;
    const totalSlots = data.total_slots || 12;

    // Generate time slots from 6:00 to 22:00
    slotsGrid.innerHTML = '';
    for (let hour = 6; hour < 22; hour++) {
        for (let min = 0; min < 60; min += duration) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
            const isBooked = bookedSlots.includes(timeStr);

            const slotEl = document.createElement('div');
            slotEl.className = `slot-item ${isBooked ? 'booked' : ''}`;
            slotEl.textContent = timeStr;
            slotEl.dataset.time = timeStr;

            if (!isBooked) {
                slotEl.onclick = () => selectSlot(timeStr, slotEl);
            }

            slotsGrid.appendChild(slotEl);
        }
    }
}

function selectSlot(timeStr, el) {
    document.querySelectorAll('.slot-item.selected').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    selectedSlot = timeStr;
    updateBookingSummary();
}

function updateBookingSummary() {
    const summary = document.getElementById("bookingSummary");
    const btn = document.getElementById("btnBookSlot");

    if (selectedDate && selectedSlot) {
        summary.innerHTML = `<strong style="color:#00FFD1">${selectedEVStation.Station}</strong><br>
                             ${selectedDate} at ${selectedSlot}`;
        summary.classList.add('active');
        btn.disabled = false;
    } else {
        summary.innerHTML = '<span>Select a slot to continue</span>';
        summary.classList.remove('active');
        btn.disabled = true;
    }
}

async function confirmEVBooking() {
    if (!selectedDate || !selectedSlot) return;

    const btn = document.getElementById("btnBookSlot");
    btn.disabled = true;
    btn.textContent = "Booking...";

    try {
        // STEP 1: Get latest data
        const { data: current, error: fetchError } = await client
            .from("EV")
            .select("booked_slots")
            .eq("id", selectedEVStation.id)
            .single();

        if (fetchError) throw fetchError;

        // STEP 2: Safe object
        let bookedSlots = current?.booked_slots || {};

        if (!bookedSlots[selectedDate]) {
            bookedSlots[selectedDate] = [];
        }
        if (!selectedCylinder) {
            alert("❌ Please select cylinder type");
            return;
        }

        if (!selectedPayment) {
            alert("❌ Please select payment method");
            return;
        }
        // STEP 3: Already booked check
        if (bookedSlots[selectedDate].includes(selectedSlot)) {
            alert("❌ Slot already booked, choose another");
            btn.disabled = false;
            btn.textContent = "Confirm Booking";
            return;
        }

        // STEP 4: Add slot
        bookedSlots[selectedDate].push(selectedSlot);

        // STEP 5: Update Supabase
        const { error: updateError } = await client
            .from("EV")
            .update({
                booked_slots: bookedSlots
            })
            .eq("id", selectedEVStation.id);

        if (updateError) throw updateError;

        // STEP 6: SUCCESS UI
        const ref = "#EV" + Math.random().toString(36).substring(2, 8).toUpperCase();

        document.getElementById("evBookingRef").textContent = ref;
        document.getElementById("evBookingDetails").innerHTML =
            `${selectedEVStation.Station}<br>${selectedDate} at ${selectedSlot}`;

        document.getElementById("modalOverlay").classList.add("show");
        document.getElementById("evBookingModal").classList.add("show");

    } catch (err) {
        console.error("Booking Error:", err);
        alert("❌ Booking failed: " + err.message);
    }

    btn.disabled = false;
    btn.textContent = "Confirm Booking";
}

function closeEVModal() {
    document.getElementById("modalOverlay").classList.remove('show');
    document.getElementById("evBookingModal").classList.remove('show');
    document.getElementById("evBookingSection").style.display = "none";
    selectedEVStation = null;
    selectedDate = null;
    selectedSlot = null;
}






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
/* ================== GAS BOOKING ================== */

/* ================== GAS BOOKING ================== */

let selectedProvider = null;
let selectedCylinder = null;
let selectedPayment = null;

/* ===== PROVIDER SELECT ===== */
document.querySelectorAll(".provider-option").forEach(option => {
    option.addEventListener("click", () => {

        document.querySelectorAll(".provider-option")
            .forEach(o => o.classList.remove("selected"));

        option.classList.add("selected");

        const type = option.dataset.provider;

        if (type === "hp") selectedProvider = "HP Gas";
        if (type === "bharat") selectedProvider = "Bharat Gas";
        if (type === "indian") selectedProvider = "Indian Gas";
    });
});

/* ===== CYLINDER SELECT ===== */
document.querySelectorAll(".cylinder-option").forEach(option => {
    option.addEventListener("click", () => {

        document.querySelectorAll(".cylinder-option")
            .forEach(o => o.classList.remove("selected"));

        option.classList.add("selected");

        const weight = option.dataset.type;

        if (weight === "14.2") selectedCylinder = "14.2 kg Regular";
        if (weight === "5") selectedCylinder = "5 kg Compact";
        if (weight === "19") selectedCylinder = "19 kg Commercial";
    });
});

/* ===== PAYMENT SELECT ===== */
document.querySelectorAll(".payment-option").forEach(option => {
    option.addEventListener("click", () => {

        document.querySelectorAll(".payment-option")
            .forEach(o => o.classList.remove("selected"));

        option.classList.add("selected");

        const type = option.dataset.payment;

        selectedPayment = type === "online"
            ? "Online Payment"
            : "Cash on Delivery";
    });
});

/* ===== NEXT STEP ===== */
function nextStep() {

    const steps = document.querySelectorAll(".step-content");
    const indicators = document.querySelectorAll(".step-indicator");

    let current = [...steps].findIndex(s => s.classList.contains("active"));

    /* STEP 1 VALIDATION */
    if (current === 0 && !selectedProvider) {
        alert("❌ Please select gas provider");
        return;
    }

    /* STEP 2 VALIDATION */
    if (current === 1) {

        const name = document.getElementById("fullName").value;
        const mobile = document.getElementById("mobileNumber").value;
        const consumer = document.getElementById("consumerId").value;
        const address = document.getElementById("address").value;
        const date = document.getElementById("deliveryDate").value;

        if (!name || !mobile || !consumer || !address || !date) {
            alert("❌ Please fill all details");
            return;
        }

        if (!selectedCylinder) {
            alert("❌ Please select cylinder type");
            return;
        }

        if (!selectedPayment) {
            alert("❌ Please select payment method");
            return;
        }

        /* SUMMARY UPDATE */
        document.getElementById("summaryProvider").innerText = selectedProvider;
        document.getElementById("summaryName").innerText = name;
        document.getElementById("summaryMobile").innerText = mobile;
        document.getElementById("summaryConsumer").innerText = consumer;
        document.getElementById("summaryCylinder").innerText = selectedCylinder;
        document.getElementById("summaryDate").innerText = date;
        document.getElementById("summaryAddress").innerText = address;
        document.getElementById("summaryPayment").innerText = selectedPayment;
    }

    /* STEP CHANGE */
    steps[current].classList.remove("active");
    indicators[current].classList.remove("active");

    steps[current + 1].classList.add("active");
    indicators[current + 1].classList.add("active");
}

/* ===== CONFIRM BOOKING (FINAL) ===== */
async function confirmBooking() {

    if (!selectedProvider || !selectedCylinder || !selectedPayment) {
        alert("❌ Missing selection");
        return;
    }

    const successBox = document.getElementById("bookingSuccess");
    const step3 = document.getElementById("step3");

    const ref = "#FUEL" + Math.floor(Math.random() * 1000000);

    const bookingData = {
        provider: selectedProvider,
        name: document.getElementById("summaryName").innerText,
        mobile: document.getElementById("summaryMobile").innerText,
        consumer_id: document.getElementById("summaryConsumer").innerText,
        cylinder: selectedCylinder,
        delivery_date: document.getElementById("summaryDate").innerText,
        address: document.getElementById("summaryAddress").innerText,
        payment: selectedPayment,
        booking_ref: ref
    };

    console.log("DATA:", bookingData);

    try {
        const { error } = await client
            .from("gas_booking_data")
            .insert([bookingData]);

        if (error) throw error;

        /* SUCCESS UI */
        step3.style.display = "none";
        successBox.style.display = "block";
        document.getElementById("bookingRef").innerText = ref;

    } catch (err) {
        console.error(err);
        alert("❌ Error: " + err.message);
    }
}







window.addEventListener('load', function () {
    let selectedCategory = 'suggestion';
    let currentFilter = 'all';

    let feedbackData = [
        {
            id: 1,
            name: "Amit Desai",
            initial: "AD",
            color: "#FF9F43",
            category: "suggestion",
            service: "EV Charging",
            text: "Please add more fast chargers at Mumbai-Pune highway. Current ones are always busy during weekends. Maybe 4-5 more units would help reduce waiting time significantly.",
            time: "3 hours ago",
            status: "pending"
        },
        {
            id: 2,
            name: "Priya Menon",
            initial: "PM",
            color: "#00D9FF",
            category: "compliment",
            service: "Mobile App",
            text: "The new app update is fantastic! Real-time station status is super accurate now. Love the dark theme and the booking flow is much smoother. Keep it up team!",
            time: "1 day ago",
            status: "resolved"
        },
        {
            id: 3,
            name: "Rajesh Kumar",
            initial: "RK",
            color: "#7B61FF",
            category: "bug",
            service: "Petrol Station",
            text: "Payment gateway failed twice at HP Pump, Satara Road. Had to pay cash. Card machine shows error code 500. Please check the terminal.",
            time: "2 days ago",
            status: "pending"
        },
        {
            id: 4,
            name: "Sneha Patil",
            initial: "SP",
            color: "#00C853",
            category: "suggestion",
            service: "CNG Station",
            text: "Can we get a waiting area with seating at CNG stations? Sometimes queue is 30+ mins and standing is tiring especially for elderly people.",
            time: "4 days ago",
            status: "resolved"
        }
    ];

    // Category Pills
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', function () {
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            selectedCategory = this.getAttribute('data-category');
            document.getElementById('selectedCategory').value = selectedCategory;
        });
    });

    // Filter
    document.getElementById('feedbackFilter').addEventListener('change', function () {
        currentFilter = this.value;
        renderFeedback();
    });

    // Render Feedback
    function renderFeedback() {
        const feed = document.getElementById('feedbackFeed');
        if (!feed) return;

        let filteredData = [...feedbackData];
        if (currentFilter !== 'all') {
            filteredData = filteredData.filter(f => f.category === currentFilter);
        }

        if (filteredData.length === 0) {
            feed.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">📭</div>
                            <p>No feedback found in this category</p>
                        </div>
                    `;
            return;
        }

        feed.innerHTML = filteredData.map((item, index) => `
                    <div class="feedback-card" style="animation-delay: ${index * 0.1}s">
                        <div class="card-top">
                            <div class="user-avatar" style="background:${item.color}">
                                ${item.initial}
                            </div>
                            <div class="user-details">
                                <div class="user-name">${item.name}</div>
                                <div class="user-meta">
                                    <span class="category-tag">${item.category}</span>
                                    <span class="time-badge">${item.time}</span>
                                </div>
                            </div>
                        <div class="card-message">${item.text}</div>
                        <div class="card-footer">
                            <div class="status-badge ${item.status}">
                                ${item.status === 'resolved' ? 'Resolved' : 'In Review'}
                            </div>
                            <div class="action-buttons">
                                <button class="action-icon" onclick="likeFeedback(${item.id})">👍</button>
                                <button class="action-icon" onclick="replyFeedback(${item.id})">💬</button>
                                <button class="action-icon">📤</button>
                            </div>
                        </div>
                    </div>
                `).join('');
    }

    // Like Feedback
    window.likeFeedback = function (id) {
        console.log('Liked feedback:', id);
        alert('Thanks for the support!');
    };

    // Reply Feedback
    window.replyFeedback = function (id) {
        console.log('Reply to feedback:', id);
        alert('Reply feature coming soon!');
    };

    // Submit Form
    document.getElementById('feedbackForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const service = document.getElementById('serviceType').value;
        const text = document.getElementById('feedbackText').value.trim();

        if (!service || !text) {
            alert("Please fill all fields");
            return;
        }

        const categoryColors = {
            suggestion: '#FF9F43',
            bug: '#FF6B6B',
            compliment: '#00D9FF'
        };

        const newFeedback = {
            id: Date.now(),
            name: "You",
            initial: "Y",
            color: categoryColors[selectedCategory],
            category: selectedCategory,
            service: service,
            text: text,
            time: "Just now",
            status: "pending"
        };

        feedbackData.unshift(newFeedback);
        renderFeedback();

        this.reset();
        selectedCategory = 'suggestion';
        document.getElementById('selectedCategory').value = 'suggestion';
        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        document.querySelector('.category-pill[data-category="suggestion"]').classList.add('active');

        alert("✅ Feedback submitted successfully!");
    });

    // Init
    renderFeedback();
});




let currentStep = 1;

let selectedProvider = null;
let selectedCylinder = null;
let selectedPayment = null;

/* ================= STEP NAVIGATION ================= */

function nextStep() {

    if (currentStep === 1 && !selectedProvider) {
        alert("Please select a provider");
        return;
    }

    if (currentStep === 2) {

        const form = document.getElementById("bookingForm");

        if (!form.checkValidity() || !selectedCylinder || !selectedPayment) {
            alert("Please fill all details");
            return;
        }

        updateSummary();
    }

    document.getElementById(`step${currentStep}`).classList.remove("active");
    document.querySelector(`.step-indicator[data-step="${currentStep}"]`).classList.remove("active");

    currentStep++;

    document.getElementById(`step${currentStep}`).classList.add("active");
    document.querySelector(`.step-indicator[data-step="${currentStep}"]`).classList.add("active");
}

/* ================= PROVIDER SELECT ================= */

document.querySelectorAll(".provider-option").forEach(option => {
    option.addEventListener("click", () => {

        document.querySelectorAll(".provider-option").forEach(o => o.classList.remove("selected"));

        option.classList.add("selected");
        selectedProvider = option.innerText.trim();
    });
});

/* ================= CYLINDER SELECT ================= */

document.querySelectorAll(".cylinder-option").forEach(option => {
    option.addEventListener("click", () => {

        document.querySelectorAll(".cylinder-option").forEach(o => o.classList.remove("selected"));

        option.classList.add("selected");

        const weight = option.querySelector(".cylinder-weight").innerText;
        const type = option.querySelector(".cylinder-type").innerText;

        selectedCylinder = `${weight} ${type}`;
    });
});

/* ================= PAYMENT SELECT ================= */

document.querySelectorAll(".payment-option").forEach(option => {
    option.addEventListener("click", () => {

        document.querySelectorAll(".payment-option").forEach(o => o.classList.remove("selected"));

        option.classList.add("selected");

        selectedPayment = option.innerText.trim();
    });
});

/* ================= SUMMARY ================= */

function updateSummary() {

    document.getElementById("summaryProvider").innerText = selectedProvider;
    document.getElementById("summaryName").innerText = document.getElementById("fullName").value;
    document.getElementById("summaryMobile").innerText = document.getElementById("mobileNumber").value;
    document.getElementById("summaryConsumer").innerText = document.getElementById("consumerId").value;
    document.getElementById("summaryCylinder").innerText = selectedCylinder;
    document.getElementById("summaryDate").innerText = document.getElementById("deliveryDate").value;
    document.getElementById("summaryAddress").innerText = document.getElementById("address").value;
    document.getElementById("summaryPayment").innerText = selectedPayment;
}

/* ================= CONFIRM BOOKING ================= */

async function confirmBooking() {

    const bookingData = {
        provider: selectedProvider,
        name: document.getElementById("fullName").value,
        mobile: document.getElementById("mobileNumber").value,
        consumer_id: document.getElementById("consumerId").value,
        address: document.getElementById("address").value,
        cylinder: selectedCylinder,
        delivery_date: document.getElementById("deliveryDate").value,
        payment: selectedPayment
    };

    /* 🔥 INSERT INTO SUPABASE */
    const { data, error } = await supabase
        .from("gas_bookings")   // 👈 table name
        .insert([bookingData]);

    if (error) {
        console.error(error);
        alert("Booking Failed ❌");
        return;
    }

    /* SUCCESS UI */
    document.getElementById("step3").style.display = "none";
    document.getElementById("bookingSuccess").style.display = "block";

    document.getElementById("bookingRef").innerText =
        "#FUEL" + Math.floor(100000 + Math.random() * 900000);
}