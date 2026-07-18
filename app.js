// 🌀 1. Configuration & App State
const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbxOhgEbJy59cGN0D4-S466DNB-mvSf553STAGfX64fai88FWkO6uu0vJ5xdnr6iSFvd/exec"; // <-- Put your deployed API URL here!

const services = [
    { name: "Standard Wash & Fold (GH1.50/item)", rate: 1.5 },
    { name: "Premium Wash, Dry & Iron (GH2.50/item)", rate: 2.5 },
    { name: "Delicate/Dry Clean Service (GH4.00/item)", rate: 4.0 },
    { name: "monthly subscription (GH200/discount)", rate: 200.0}
];

const bookingDetails = {
    name: "",
    serviceName: "",
    price: 0,
    orderId: ""
};

// ⚙️ 2. On Website Load: Populate Services Dropdown
document.addEventListener("DOMContentLoaded", () => {
    const serviceSelect = document.getElementById('serviceSelect');
    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.name;
        option.innerText = service.name;
        serviceSelect.appendChild(option);
    });
});

// 📬 3. POST: Submit Form to Google Sheets
async function handleBookingSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById('submitBtn');
    
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Processing pickup... ⏳";
    submitBtn.disabled = true;

    const formData = new URLSearchParams(new FormData(form));

    try {
        const response = await fetch(GOOGLE_APP_URL, {
            method: 'POST',
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        const data = await response.json();

        if (data.result === 'success') {
            // Save state & reveal Checkout summary
            const selectEl = document.getElementById('serviceSelect');
            
            bookingDetails.name = form.elements['name'].value;
            bookingDetails.serviceName = selectEl.value;
            bookingDetails.price = 20.00; // standard safety deposit
            bookingDetails.orderId = data.orderId;

            document.getElementById('summaryName').innerText = bookingDetails.name;
            document.getElementById('summaryService').innerText = bookingDetails.serviceName;
            document.getElementById('summaryTotal').innerText = `$${bookingDetails.price.toFixed(2)}`;

            document.getElementById('nav-checkout').classList.remove('hidden');
            const paymentSection = document.getElementById('payment');
            paymentSection.classList.remove('hidden');
            paymentSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert("Something went wrong with your booking. Please try again.");
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        alert("Success! Your booking went through, but unable to connect directly with the web client. Write down your Order ID!");
    } finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
}

// 📦 4. GET: Retrieve Status Tracking Data
async function trackOrder() {
    const trackingInput = document.getElementById('trackingInput');
    const orderId = trackingInput.value.trim().toUpperCase();
    
    if (!orderId) {
        alert("Please enter a valid Order ID.");
        return;
    }

    try {
        const response = await fetch(`${GOOGLE_APP_URL}?orderId=${orderId}`);
        const data = await response.json();

        if (data.result === 'success') {
            document.getElementById('tracker-display').classList.remove('hidden');
            document.getElementById('tracker-customer-name').innerText = `Hello, ${data.name}!`;
            document.getElementById('tracker-service-name').innerText = data.service;
            document.getElementById('tracker-badge-status').innerText = data.status;

            updateTimelineVisuals(data.status);
        } else {
            alert("Order ID not found. Double-check your code and try again.");
            document.getElementById('tracker-display').classList.add('hidden');
        }
    } catch (error) {
        console.error("Error retrieving order status:", error);
        alert("Network error occurred while fetching order status.");
    }
}

// 🎨 5. Animation Helper: Update the Visual Tracker State
function updateTimelineVisuals(status) {
    const statusLower = status.toLowerCase();
    let currentStep = 1;
    let progressPercent = 0;

    if (statusLower.includes("wash")) {
        currentStep = 2;
        progressPercent = 33;
    } else if (statusLower.includes("dry") || statusLower.includes("fold")) {
        currentStep = 3;
        progressPercent = 66;
    } else if (statusLower.includes("deliver") || statusLower.includes("ready") || statusLower.includes("complete")) {
        currentStep = 4;
        progressPercent = 100;
    }

    document.getElementById('tracker-progress-line').style.width = `${progressPercent}%`;

    for (let step = 1; step <= 4; step++) {
        const circle = document.getElementById(`step-circle-${step}`);
        if (step <= currentStep) {
            circle.classList.remove('bg-slate-200', 'text-slate-500');
            circle.classList.add('bg-blue-600', 'text-white');
        } else {
            circle.classList.remove('bg-blue-600', 'text-white');
            circle.classList.add('bg-slate-200', 'text-slate-500');
        }
    }
}

// 🏁 6. Finish Order Flow
function handlePaymentSubmit(event) {
    event.preventDefault();
    const generatedID = bookingDetails.orderId || "your emailed ID";
    
    alert(`🎉 Success! Your laundry pickup is locked in.\n\n📍 Your Order ID is: ${generatedID}\n\nUse this Order ID to track your progress at the top of the homepage!`);
    
    document.getElementById('bookingForm').reset();
    document.getElementById('payment').classList.add('hidden');
    document.getElementById('nav-checkout').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
