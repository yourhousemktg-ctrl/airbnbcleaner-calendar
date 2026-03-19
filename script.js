// Cleaner Payments Calendar Logic

// State
let currentDate = new Date(); // Dynamic date that user is currently viewing
let selectedProperty = 'property-1';
const actualToday = new Date(); // Fixed 'today' reference

// Seeding standard dates mentioned (assuming March 2026 based on the current context)
const defaultPaidDates = {
    'property-1': [
        '2026-03-04',
        '2026-03-09',
        '2026-03-15',
        '2026-03-20',
        '2026-03-22'
    ],
    'property-2': []
};

// Load paid dates from localStorage or initialize with default seed
let paidDatesData = JSON.parse(localStorage.getItem('cleaner_paid_dates')) || defaultPaidDates;

// Elements
const monthYearDisplay = document.getElementById('current-month-year');
const calendarGrid = document.getElementById('calendar-grid');
const propertySelect = document.getElementById('property-select');
const prevBtn = document.getElementById('prev-month');
const nextBtn = document.getElementById('next-month');
const todayBtn = document.getElementById('today-btn');

// Formatting utilities
const formatDateStr = (year, month, day) => {
    // month is 0-indexed, so we add 1
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const isPaid = (dateStr) => {
    const propertyDates = paidDatesData[selectedProperty] || [];
    return propertyDates.includes(dateStr);
};

const togglePaidStatus = (dateStr) => {
    // Ensure property array exists
    if (!paidDatesData[selectedProperty]) {
        paidDatesData[selectedProperty] = [];
    }
    
    const propDates = paidDatesData[selectedProperty];
    const index = propDates.indexOf(dateStr);
    
    if (index === -1) {
        // Not paid -> Mark as paid
        propDates.push(dateStr);
    } else {
        // Paid -> Unmark
        propDates.splice(index, 1);
    }
    
    // Save to localStorage so it persists
    localStorage.setItem('cleaner_paid_dates', JSON.stringify(paidDatesData));
    
    // Re-render calendar to show changes
    renderCalendar(false); // don't animate on simple toggles
};

const isSameDate = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const renderCalendar = (animate = true) => {
    if (animate) {
        calendarGrid.classList.remove('animating');
        // trigger reflow
        void calendarGrid.offsetWidth;
        calendarGrid.classList.add('animating');
    }
    
    calendarGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed
    
    // Display Title (Month Year)
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
    
    // Find what day of the week the first of the month falls on
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    // Total days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Total days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // 1. Fill previous month padded days
    for (let i = firstDay - 1; i >= 0; i--) {
        const prevDay = daysInPrevMonth - i;
        const cell = createDayCell(year, month - 1, prevDay, true);
        calendarGrid.appendChild(cell);
    }
    
    // 2. Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const cell = createDayCell(year, month, i, false);
        calendarGrid.appendChild(cell);
    }
    
    // 3. Fill next month days to complete 42 cell grid (6 rows of 7 days)
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; 
    
    for (let i = 1; i <= remainingCells; i++) {
        const cell = createDayCell(year, month + 1, i, true);
        calendarGrid.appendChild(cell);
    }
};

const createDayCell = (year, month, day, isOtherMonth) => {
    // JavaScript Date handles month underflow/overflow automatically
    // e.g. new Date(2026, -1, 15) evaluates to Dec 15, 2025
    const adjustedDate = new Date(year, month, day);
    const adjYear = adjustedDate.getFullYear();
    const adjMonth = adjustedDate.getMonth();
    const adjDay = adjustedDate.getDate();
    
    const dateStr = formatDateStr(adjYear, adjMonth, adjDay);
    const paid = isPaid(dateStr);
    
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    
    if (isOtherMonth) {
        cell.classList.add('other-month');
    }
    if (isSameDate(adjustedDate, actualToday)) {
        cell.classList.add('is-today');
    }
    if (paid) {
        cell.classList.add('is-paid');
    }
    
    // Number wrapper
    const dayNum = document.createElement('div');
    dayNum.className = 'day-num';
    dayNum.textContent = adjDay;
    
    // Content wrapper for "Open" or "$$$"
    const dayContent = document.createElement('div');
    dayContent.className = 'day-content';
    if (paid) {
        dayContent.innerHTML = '<span class="money">$$$</span>';
    }
    
    cell.appendChild(dayNum);
    cell.appendChild(dayContent);
    
    // Add click event only to days in the current focused month
    if (!isOtherMonth) {
        cell.addEventListener('click', () => togglePaidStatus(dateStr));
    }
    
    return cell;
};

// Event Listeners for controls
prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

todayBtn.addEventListener('click', () => {
    // Reset back to actual today's month and year
    currentDate = new Date(actualToday.getFullYear(), actualToday.getMonth(), 1);
    renderCalendar();
});

propertySelect.addEventListener('change', (e) => {
    selectedProperty = e.target.value;
    renderCalendar(); // Re-render when property changes
});

// Initialization
// Start the view in March 2026 where our seeded data is, 
// unless they've opened it far into the future, then show actual today.
// In a real app we'd probably just use actualToday initially, 
// but to show the seeded data let's center on March 2026 if today is in 2026.
if (actualToday.getFullYear() === 2026 && actualToday.getMonth() <= 3) {
    currentDate = new Date(2026, 2, 1); // Month 2 is March (0-indexed)
} else {
    currentDate = new Date(actualToday.getFullYear(), actualToday.getMonth(), 1);
}

renderCalendar();
