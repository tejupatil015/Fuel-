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
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// हे सगळे variables आधी declare केले
let bookingData = {
    provider: null,
    fullName: null,
    email: null,
    mobileNumber: null,
    consumerId: null,
    address: null,
    cylinderType: null, // selectedCylinder नाही - cylinderType आहे
    deliveryDate: null,
    paymentMethod: null
};

let currentStep = 1;

// Page load झाल्यावर run होईल
window.addEventListener('DOMContentLoaded', function() {
    setupListeners();
    setMinDate();
});

function setupListeners() {
    // Provider Selection
    document.querySelectorAll('.provider-option').forEach(el => {
        el.addEventListener('click', function() {
            document.querySelectorAll('.provider-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            bookingData.provider = this.getAttribute('data-provider');
            hideError();
        });
    });

    // Cylinder Selection
    document.querySelectorAll('.cylinder-option').forEach(el => {
        el.addEventListener('click', function() {
            document.querySelectorAll('.cylinder-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            bookingData.cylinderType = this.getAttribute('data-type'); // इथे cylinderType use करतो
            hideError();
        });
    });

    // Payment Selection
    document.querySelectorAll('.payment-option').forEach(el => {
        el.addEventListener('click', function() {
            document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            bookingData.paymentMethod = this.getAttribute('data-payment');
            hideError();
        });
    });

    // Buttons
    const step1Btn = document.getElementById('step1Next');
    const step2Back = document.getElementById('step2Back');
    const step2Next = document.getElementById('step2Next');
    const step3Back = document.getElementById('step3Back');
    const confirmBtn = document.getElementById('confirmBtn');

    if (step1Btn) step1Btn.addEventListener('click', () => nextStep(1));
    if (step2Back) step2Back.addEventListener('click', () => previousStep());
    if (step2Next) step2Next.addEventListener('click', () => nextStep(2));
    if (step3Back) step3Back.addEventListener('click', () => previousStep());
    if (confirmBtn) confirmBtn.addEventListener('click', confirmBooking);
}

function nextStep(step) {
    if (step === 1) {
        if (!bookingData.provider) {
            showError("Please select a gas provider");
            return;
        }
    } else if (step === 2) {
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const mobileNumber = document.getElementById('mobileNumber').value.trim();
        const consumerId = document.getElementById('consumerId').value.trim();
        const address = document.getElementById('address').value.trim();
        const deliveryDate = document.getElementById('deliveryDate').value;

        if (!fullName) { showError("Please enter your full name"); return; }
        if (!email) { showError("Please enter your email"); return; }
        if (!mobileNumber) { showError("Please enter mobile number"); return; }
        if (mobileNumber.length!== 10 ||!/^\d+$/.test(mobileNumber)) {
            showError("Please enter valid 10-digit mobile number");
            return;
        }
        if (!consumerId) { showError("Please enter consumer ID"); return; }
        if (!address) { showError("Please enter delivery address"); return; }
        if (!deliveryDate) { showError("Please select delivery date"); return; }
        if (!bookingData.cylinderType) { showError("Please select cylinder type"); return; }
        if (!bookingData.paymentMethod) { showError("Please select payment method"); return; }

        bookingData.fullName = fullName;
        bookingData.email = email;
        bookingData.mobileNumber = mobileNumber;
        bookingData.consumerId = consumerId;
        bookingData.address = address;
        bookingData.deliveryDate = deliveryDate;
        updateSummary();
    }

    currentStep = step + 1;
    showStep(currentStep);
    hideError();
}

function previousStep() {
    currentStep--;
    showStep(currentStep);
}

function showStep(step) {
    document.querySelectorAll('.step-content').forEach(c => c.classList.remove('active'));
    const stepEl = document.getElementById('step' + step);
    if (stepEl) stepEl.classList.add('active');

    document.querySelectorAll('.step-indicator').forEach((ind, i) => {
        const s = i + 1;
        if (s < step) {
            ind.classList.add('completed');
            ind.classList.remove('active');
        } else if (s === step) {
            ind.classList.add('active');
            ind.classList.remove('completed');
        } else {
            ind.classList.remove('active', 'completed');
        }
    });
    window.scrollTo(0, 0);
}

function updateSummary() {
    const provMap = { 'hp': 'HP Gas', 'bharat': 'Bharat Gas', 'indane': 'Indane', 'indian': 'Indian Gas' };
    const payMap = { 'online': 'Online Payment', 'cod': 'Cash on Delivery' };

    document.getElementById('summaryProvider').textContent = provMap[bookingData.provider] || '-';
    document.getElementById('summaryName').textContent = bookingData.fullName;
    document.getElementById('summaryEmail').textContent = bookingData.email;
    document.getElementById('summaryMobile').textContent = bookingData.mobileNumber;
    document.getElementById('summaryConsumer').textContent = bookingData.consumerId;
    document.getElementById('summaryCylinder').textContent = bookingData.cylinderType + ' kg';
    document.getElementById('summaryDate').textContent = bookingData.deliveryDate;
    document.getElementById('summaryAddress').textContent = bookingData.address;
    document.getElementById('summaryPayment').textContent = payMap[bookingData.paymentMethod] || '-';
}

async function confirmBooking() {
    const btn = document.getElementById('confirmBtn');
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = 'Processing...';
    showLoading(true);
    hideError();

    try {
        // Final validation
        if (!bookingData.provider ||!bookingData.fullName ||!bookingData.email ||
           !bookingData.mobileNumber ||!bookingData.consumerId ||!bookingData.address ||
           !bookingData.cylinderType ||!bookingData.deliveryDate ||!bookingData.paymentMethod) {
            throw new Error('Please fill all required fields');
        }

        const bookingRef = '#FUEL' + Date.now().toString().slice(-8).toUpperCase();

        const { data, error } = await client
         .from('gas_bookings')
         .insert([{
                booking_ref: bookingRef,
                provider: bookingData.provider,
                full_name: bookingData.fullName,
                email: bookingData.email,
                mobile_number: bookingData.mobileNumber,
                consumer_id: bookingData.consumerId,
                delivery_address: bookingData.address,
                cylinder_type: bookingData.cylinderType,
                delivery_date: bookingData.deliveryDate,
                payment_method: bookingData.paymentMethod,
                status: 'confirmed'
            }])
         .select();

        if (error) throw error;

        showLoading(false);
        document.getElementById('bookingRef').textContent = bookingRef;
        document.querySelectorAll('.step-content').forEach(c => c.classList.remove('active'));
        document.getElementById('successState').classList.add('active');

    } catch (err) {
        showLoading(false);
        console.error('Booking Error:', err);
        showError('Error processing booking: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Confirm Booking';
    }
}

function showError(msg) {
    const el = document.getElementById('errorMessage');
    if (el) {
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 5000);
    }
}

function hideError() {
    const el = document.getElementById('errorMessage');
    if (el) el.classList.remove('show');
}

function showLoading(show) {
    const el = document.getElementById('loadingState');
    if (el) {
        if (show) el.classList.add('show');
        else el.classList.remove('show');
    }
}

function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('deliveryDate');
    if (dateInput) dateInput.setAttribute('min', today);
}



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



// ===== GAS BOOKING SYSTEM =====
let bookingData = {
    provider: 'hp',
    name: '',
    mobile: '',
    consumerId: '',
    address: '',
    cylinderType: '14.2',
    deliveryDate: '',
    paymentMethod: 'online'
};

let currentStep = 1;

// Page load झाल्यावर run कर
document.addEventListener('DOMContentLoaded', () => {
    initBooking();
    setMinDate();
});

function initBooking() {
    // Provider selection
    document.querySelectorAll('.provider-option').forEach(opt => {
        opt.addEventListener('click', function() {
            document.querySelectorAll('.provider-option').forEach(p => p.classList.remove('selected'));
            this.classList.add('selected');
            bookingData.provider = this.getAttribute('data-provider');
        });
    });

    // Cylinder selection
    document.querySelectorAll('.cylinder-option').forEach(opt => {
        opt.addEventListener('click', function() {
            document.querySelectorAll('.cylinder-option').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            bookingData.cylinderType = this.getAttribute('data-type');
        });
    });

    // Payment selection
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.addEventListener('click', function() {
            document.querySelectorAll('.payment-option').forEach(p => p.classList.remove('selected'));
            this.classList.add('selected');
            bookingData.paymentMethod = this.getAttribute('data-payment');
        });
    });

    // Continue buttons
    document.querySelectorAll('.btn-book').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.textContent.includes('Continue')) {
                handleNextStep();
            } else if (this.textContent.includes('Confirm')) {
                handleConfirmBooking(this);
            }
        });
    });

    // Default selections
    document.querySelector('.provider-option[data-provider="hp"]')?.classList.add('selected');
    document.querySelector('.cylinder-option[data-type="14.2"]')?.classList.add('selected');
    document.querySelector('.payment-option[data-payment="online"]')?.classList.add('selected');
}

function setMinDate() {
    const dateInput = document.getElementById('deliveryDate');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
    }
}

function handleNextStep() {
    if (currentStep === 1) {
        if (!bookingData.provider) {
            alert('Please select a gas provider');
            return;
        }
        showStep(2);
    }
    else if (currentStep === 2) {
        if (!validateForm()) return;
        saveFormData();
        updateSummary();
        showStep(3);
    }
}

function validateForm() {
    const name = document.getElementById('fullName').value.trim();
    const mobile = document.getElementById('mobileNumber').value.trim();
    const consumer = document.getElementById('consumerId').value.trim();
    const address = document.getElementById('address').value.trim();
    const date = document.getElementById('deliveryDate').value;

    if (!name) { alert('Please enter your full name'); return false; }
    if (!mobile || mobile.length!== 10) { alert('Enter valid 10-digit mobile'); return false; }
    if (!consumer) { alert('Please enter consumer ID'); return false; }
    if (!address) { alert('Please enter address'); return false; }
    if (!date) { alert('Please select delivery date'); return false; }
    return true;
}

function saveFormData() {
    bookingData.name = document.getElementById('fullName').value.trim();
    bookingData.mobile = document.getElementById('mobileNumber').value.trim();
    bookingData.consumerId = document.getElementById('consumerId').value.trim();
    bookingData.address = document.getElementById('address').value.trim();
    bookingData.deliveryDate = document.getElementById('deliveryDate').value;
}

function showStep(step) {
    currentStep = step;
    document.querySelectorAll('.step-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step-indicator').forEach(s => s.classList.remove('active'));

    document.getElementById(`step${step}`).classList.add('active');
    document.querySelector(`.step-indicator[data-step="${step}"]`).classList.add('active');

    for (let i = 1; i < step; i++) {
        document.querySelector(`.step-indicator[data-step="${i}"]`).classList.add('completed');
    }
}

function updateSummary() {
    const providers = { hp: 'HP Gas', bharat: 'Bharat Gas', indian: 'Indian Gas' };
    const cylinders = { '5': '5 kg Compact', '14.2': '14.2 kg Regular', '19': '19 kg Commercial' };
    const payments = { online: 'Online Payment', cod: 'Cash on Delivery' };

    document.getElementById('summaryProvider').textContent = providers[bookingData.provider];
    document.getElementById('summaryName').textContent = bookingData.name;
    document.getElementById('summaryMobile').textContent = bookingData.mobile;
    document.getElementById('summaryConsumer').textContent = bookingData.consumerId;
    document.getElementById('summaryCylinder').textContent = cylinders[bookingData.cylinderType];
    document.getElementById('summaryDate').textContent = new Date(bookingData.deliveryDate).toLocaleDateString('en-IN');
    document.getElementById('summaryAddress').textContent = bookingData.address;
    document.getElementById('summaryPayment').textContent = payments[bookingData.paymentMethod];
}

async function handleConfirmBooking(btn) {
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        const { data, error } = await client
           .from('gas_bookings')
           .insert([{
                provider: bookingData.provider,
                customer_name: bookingData.name,
                mobile_number: bookingData.mobile,
                consumer_id: bookingData.consumerId,
                delivery_address: bookingData.address,
                cylinder_type: bookingData.cylinderType,
                delivery_date: bookingData.deliveryDate,
                payment_method: bookingData.paymentMethod,
                status: 'pending'
            }])
           .select();

        if (error) throw error;

        const bookingId = data[0]?.id || Math.floor(Math.random() * 1000000);
        document.getElementById('bookingRef').textContent = `#FUEL${String(bookingId).padStart(6, '0')}`;

        document.querySelectorAll('.step-content').forEach(s => s.classList.remove('active'));
        document.getElementById('bookingSuccess').classList.add('active');
        document.querySelectorAll('.step-indicator').forEach(s => s.classList.add('completed'));

    } catch (error) {
        alert('Booking failed: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Confirm Booking';
    }
}





 const SUPABASE_URL = "https://zrgvxxbdevcwkpohckwj.supabase.co";
        const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZ3Z4eGJkZXZjd2twb2hja3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzAwNzgsImV4cCI6MjA5MjI0NjA3OH0.-js43IF_QQk7793-AqP6aSV2VbyWiZWj9SH5tprYjJs";
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        let bookingData = {
            provider: null,
            fullName: null,
            email: null,
            mobileNumber: null,
            consumerId: null,
            address: null,
            cylinderType: null,
            deliveryDate: null,
            paymentMethod: null
        };

        let currentStep = 1;

        window.onload = function () {
            setupListeners();
            setMinDate();
        };

        function setupListeners() {
            document.querySelectorAll('.provider-option').forEach(el => {
                el.onclick = function () {
                    document.querySelectorAll('.provider-option').forEach(o => o.classList.remove('selected'));
                    this.classList.add('selected');
                    bookingData.provider = this.getAttribute('data-provider');
                    hideError();
                };
            });

            document.querySelectorAll('.cylinder-option').forEach(el => {
                el.onclick = function () {
                    document.querySelectorAll('.cylinder-option').forEach(o => o.classList.remove('selected'));
                    this.classList.add('selected');
                    bookingData.cylinderType = this.getAttribute('data-type');
                    hideError();
                };
            });

            document.querySelectorAll('.payment-option').forEach(el => {
                el.onclick = function () {
                    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
                    this.classList.add('selected');
                    bookingData.paymentMethod = this.getAttribute('data-payment');
                    hideError();
                };
            });

            document.getElementById('step1Next').onclick = () => nextStep(1);
            document.getElementById('step2Back').onclick = () => previousStep();
            document.getElementById('step2Next').onclick = () => nextStep(2);
            document.getElementById('step3Back').onclick = () => previousStep();
            document.getElementById('confirmBtn').onclick = confirmBooking;
        }

        function nextStep(step) {
            if (step === 1) {
                if (!bookingData.provider) {
                    showError("Please select a gas provider");
                    return;
                }
            } else if (step === 2) {
                const fullName = document.getElementById('fullName').value.trim();
                const email = document.getElementById('email').value.trim();
                const mobileNumber = document.getElementById('mobileNumber').value.trim();
                const consumerId = document.getElementById('consumerId').value.trim();
                const address = document.getElementById('address').value.trim();
                const deliveryDate = document.getElementById('deliveryDate').value;

                if (!fullName) { showError("Please enter your full name"); return; }
                if (!email) { showError("Please enter your email"); return; }
                if (!mobileNumber) { showError("Please enter mobile number"); return; }
                if (mobileNumber.length !== 10 || !/^\d+$/.test(mobileNumber)) {
                    showError("Please enter valid 10-digit mobile number");
                    return;
                }
                if (!consumerId) { showError("Please enter consumer ID"); return; }
                if (!address) { showError("Please enter delivery address"); return; }
                if (!deliveryDate) { showError("Please select delivery date"); return; }
                if (!bookingData.cylinderType) { showError("Please select cylinder type"); return; }
                if (!bookingData.paymentMethod) { showError("Please select payment method"); return; }

                bookingData.fullName = fullName;
                bookingData.email = email;
                bookingData.mobileNumber = mobileNumber;
                bookingData.consumerId = consumerId;
                bookingData.address = address;
                bookingData.deliveryDate = deliveryDate;
                updateSummary();
            }

            currentStep = step + 1;
            showStep(currentStep);
            hideError();
        }

        function previousStep() {
            currentStep--;
            showStep(currentStep);
        }

        function showStep(step) {
            document.querySelectorAll('.step-content').forEach(c => c.classList.remove('active'));
            document.getElementById('step' + step).classList.add('active');

            document.querySelectorAll('.step-indicator').forEach((ind, i) => {
                const s = i + 1;
                if (s < step) {
                    ind.classList.add('completed');
                    ind.classList.remove('active');
                } else if (s === step) {
                    ind.classList.add('active');
                    ind.classList.remove('completed');
                } else {
                    ind.classList.remove('active', 'completed');
                }
            });
            window.scrollTo(0, 0);
        }

        function updateSummary() {
            const provMap = { 'hp': 'HP Gas', 'bharat': 'Bharat Gas', 'indane': 'Indane', 'indian': 'Indian Gas' };
            const payMap = { 'online': 'Online Payment', 'cod': 'Cash on Delivery' };

            document.getElementById('summaryProvider').textContent = provMap[bookingData.provider] || '-';
            document.getElementById('summaryName').textContent = bookingData.fullName;
            document.getElementById('summaryEmail').textContent = bookingData.email;
            document.getElementById('summaryMobile').textContent = bookingData.mobileNumber;
            document.getElementById('summaryConsumer').textContent = bookingData.consumerId;
            document.getElementById('summaryCylinder').textContent = bookingData.cylinderType + ' kg';
            document.getElementById('summaryDate').textContent = bookingData.deliveryDate;
            document.getElementById('summaryAddress').textContent = bookingData.address;
            document.getElementById('summaryPayment').textContent = payMap[bookingData.paymentMethod] || '-';
        }

        async function confirmBooking() {
            const btn = document.getElementById('confirmBtn');
            btn.disabled = true;
            btn.textContent = 'Processing...';
            showLoading(true);
            hideError();

            try {
                const bookingRef = '#FUEL' + Date.now().toString().slice(-8).toUpperCase();

                const { data, error } = await client
                    .from('gas_bookings')
                    .insert([{
                        booking_ref: bookingRef,
                        provider: bookingData.provider,
                        full_name: bookingData.fullName,
                        email: bookingData.email,
                        mobile_number: bookingData.mobileNumber,
                        consumer_id: bookingData.consumerId,
                        delivery_address: bookingData.address,
                        cylinder_type: bookingData.cylinderType,
                        delivery_date: bookingData.deliveryDate,
                        payment_method: bookingData.paymentMethod,
                        status: 'confirmed'
                    }])
                    .select();

                if (error) throw error;

                showLoading(false);
                document.getElementById('bookingRef').textContent = bookingRef;
                document.querySelectorAll('.step-content').forEach(c => c.classList.remove('active'));
                document.getElementById('successState').classList.add('active');

            } catch (err) {
                showLoading(false);
                console.error('Error:', err);
                showError('Error processing booking: ' + err.message);
                btn.disabled = false;
                btn.textContent = 'Confirm Booking';
            }
        }

        function showError(msg) {
            const el = document.getElementById('errorMessage');
            el.textContent = msg;
            el.classList.add('show');
            setTimeout(() => el.classList.remove('show'), 5000);
        }

        function hideError() {
            document.getElementById('errorMessage').classList.remove('show');
        }

        function showLoading(show) {
            const el = document.getElementById('loadingState');
            if (show) el.classList.add('show');
            else el.classList.remove('show');
        }

        function setMinDate() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('deliveryDate').setAttribute('min', today);
        }


        // ============================================
// MOBILE MENU TOGGLE LOGIC
// ============================================
const menu = document.querySelector(".nav__menu");
const openBtn = document.getElementById("open-menu-btn");
const closeBtn = document.getElementById("close-menu-btn");
const menuLinks = document.querySelectorAll(".nav__menu li a");

// Open Menu
openBtn.onclick = () => {
    menu.classList.add("show");
    openBtn.style.display = "none";
    closeBtn.style.display = "block";
    document.body.style.overflow = "hidden"; // Scroll lock
};

// Close Menu Function
const closeMenu = () => {
    menu.classList.remove("show");
    openBtn.style.display = "block";
    closeBtn.style.display = "none";
    document.body.style.overflow = "auto"; // Scroll unlock
};

closeBtn.onclick = closeMenu;

// Close menu when clicking on link
menuLinks.forEach(link => {
    link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
            closeMenu();
        }
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        menu.classList.contains('show') &&
        !menu.contains(e.target) && 
        !openBtn.contains(e.target)) {
        closeMenu();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        menu.classList.remove("show");
        openBtn.style.display = "none";
        closeBtn.style.display = "none";
        document.body.style.overflow = "auto";
    } else {
        openBtn.style.display = "block";
        closeBtn.style.display = "none";
    }
});

// Initial check on page load
if (window.innerWidth > 768) {
    openBtn.style.display = "none";
    closeBtn.style.display = "none";
}