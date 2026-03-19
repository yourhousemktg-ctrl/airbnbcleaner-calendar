// Cleaner Payments Calendar Logic - FIREBASE EDITION

// --- CONFIGURATION ---
const FIREBASE_URL = 'https://airbnb-calendar-37e67-default-rtdb.firebaseio.com';
const ADMIN_PASSWORD = 'MARCmackie3390#'; // simple password for the user

// --- STATE ---
let currentDate = new Date();
let selectedProperty = 'property-1';
const actualToday = new Date();
let isAdmin = sessionStorage.getItem('cleaner_admin') === 'true';

let paidDatesData = {
    'property-1': [],
    'property-2': []
};

// --- ELEMENTS ---
const monthYearDisplay = document.getElementById('current-month-year');
const calendarGrid = document.getElementById('calendar-grid');
const propertySelect = document.getElementById('property-select');
const prevBtn = document.getElementById('prev-month');
const nextBtn = document.getElementById('next-month');
const todayBtn = document.getElementById('today-btn');
const adminBtn = document.getElementById('admin-btn');

// --- DATABASE SYNC ---
const loadDataFromFirebase = async () => {
    try {
        const response = await fetch(`${FIREBASE_URL}/paidDates.json`);
        const data = await response.json();
        
        if (data) {
            paidDatesData = {
                'property-1': data['property-1'] || [],
                'property-2': data['property-2'] || []
            };
        }
        renderCalendar(false);
    } catch (e) {
        console.error("Error loading from Firebase:", e);
    }
};

const saveDataToFirebase = async () => {
    try {
        await fetch(`${FIREBASE_URL}/paidDates.json`, {
            method: 'PUT', // Overwrites the node
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paidDatesData)
        });
    } catch (e) {
        console.error("Error saving to Firebase:", e);
    }
};

// --- UTILITIES ---
const formatDateStr = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const isPaid = (dateStr) => {
    const propertyDates = paidDatesData[selectedProperty] || [];
    return propertyDates.includes(dateStr);
};

const togglePaidStatus = (dateStr) => {
    if (!isAdmin) {
        alert("🔒 View Only Mode! Click the Login button and enter the password to edit dates.");
        return;
    }

    if (!paidDatesData[selectedProperty]) {
        paidDatesData[selectedProperty] = [];
    }
    
    const propDates = paidDatesData[selectedProperty];
    const index = propDates.indexOf(dateStr);
    
    if (index === -1) {
        propDates.push(dateStr); // Mark paid
    } else {
        propDates.splice(index, 1); // Unmark
    }
    
    // Save to Firebase
    saveDataToFirebase();
    
    // Re-render
    renderCalendar(false); 
};

// --- INIT ADMIN BUTTON ---
const updateAdminUI = () => {
    if (isAdmin) {
        adminBtn.innerHTML = '🔓 Edit Mode';
        adminBtn.style.color = '#fff';
        adminBtn.style.background = 'rgba(59, 130, 246, 0.4)';
        adminBtn.style.borderColor = '#3b82f6';
    } else {
        adminBtn.innerHTML = '🔒 Login';
        adminBtn.style.color = '#34d399';
        adminBtn.style.background = 'rgba(16, 185, 129, 0.15)';
        adminBtn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    }
};

adminBtn.addEventListener('click', () => {
    if (isAdmin) {
        isAdmin = false;
        sessionStorage.removeItem('cleaner_admin');
        updateAdminUI();
        alert("Logged out. Calendar is now view-only.");
    } else {
        const pass = prompt("Enter the Admin Password:");
        if (pass === ADMIN_PASSWORD) {
            isAdmin = true;
            sessionStorage.setItem('cleaner_admin', 'true');
            updateAdminUI();
            alert("Unlocked! You can now click dates to mark them as paid.");
        } else if (pass !== null) {
            alert("Incorrect password.");
        }
    }
});

// --- CORE LOGIC ---
const isSameDate = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const renderCalendar = (animate = true) => {
    if (animate) {
        calendarGrid.classList.remove('animating');
        void calendarGrid.offsetWidth;
        calendarGrid.classList.add('animating');
    }
    
    calendarGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); 
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    for (let i = firstDay - 1; i >= 0; i--) {
        calendarGrid.appendChild(createDayCell(year, month - 1, daysInPrevMonth - i, true));
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        calendarGrid.appendChild(createDayCell(year, month, i, false));
    }
    
    const remainingCells = 42 - calendarGrid.children.length; 
    for (let i = 1; i <= remainingCells; i++) {
        calendarGrid.appendChild(createDayCell(year, month + 1, i, true));
    }
};

const createDayCell = (year, month, day, isOtherMonth) => {
    const adjustedDate = new Date(year, month, day);
    const dateStr = formatDateStr(adjustedDate.getFullYear(), adjustedDate.getMonth(), adjustedDate.getDate());
    const paid = isPaid(dateStr);
    
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    
    if (isOtherMonth) cell.classList.add('other-month');
    if (isSameDate(adjustedDate, actualToday)) cell.classList.add('is-today');
    if (paid) cell.classList.add('is-paid');
    
    const dayNum = document.createElement('div');
    dayNum.className = 'day-num';
    dayNum.textContent = adjustedDate.getDate();
    
    const dayContent = document.createElement('div');
    dayContent.className = 'day-content';
    if (paid) {
        dayContent.innerHTML = '<span class="money">$$$</span>';
    }
    
    cell.appendChild(dayNum);
    cell.appendChild(dayContent);
    
    if (!isOtherMonth) {
        cell.addEventListener('click', () => togglePaidStatus(dateStr));
    }
    
    return cell;
};

// --- EVENT LISTENERS ---
prevBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
nextBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
todayBtn.addEventListener('click', () => { currentDate = new Date(actualToday.getFullYear(), actualToday.getMonth(), 1); renderCalendar(); });
propertySelect.addEventListener('change', (e) => { selectedProperty = e.target.value; renderCalendar(); });

// --- INITIALIZATION ---
updateAdminUI();

if (actualToday.getFullYear() === 2026 && actualToday.getMonth() <= 3) {
    currentDate = new Date(2026, 2, 1);
} else {
    currentDate = new Date(actualToday.getFullYear(), actualToday.getMonth(), 1);
}

// Initial placeholder map while fetching from Firebase
renderCalendar();

// First-time seed: We need to push initial data if DB is empty
const seedDatabaseOnce = async () => {
    try {
        const response = await fetch(`${FIREBASE_URL}/paidDates.json`);
        const data = await response.json();
        if (!data) {
            // Seed it with the previous local storage default if DB is completely empty string/null
            const defaultData = {
                'property-1': ['2026-03-04', '2026-03-09', '2026-03-15', '2026-03-20', '2026-03-22'],
                'property-2': []
            };
            await fetch(`${FIREBASE_URL}/paidDates.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaultData)
            });
            console.log("Database seeded.");
        }
    } catch(e) { console.error(e); }
};

// Seed then load
seedDatabaseOnce().then(() => {
    loadDataFromFirebase();
});

// Poll the database every 10 seconds to get live updates if cleaner is watching
setInterval(loadDataFromFirebase, 10000);
