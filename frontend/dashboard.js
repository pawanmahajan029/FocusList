// API Configuration
const API_URL = 'http://localhost:7845/api/tasks';

// Global state
let tasks = [];
let allTasks = []; // Store all tasks for filtering
let currentFilter = 'all'; // Current time filter

// Category configuration with specific order
const CATEGORY_ORDER = ['LEARNING', 'WORK', 'PERSONAL', 'HEALTH'];

const CATEGORIES = {
    LEARNING: { name: 'Learning', icon: '<i class="fas fa-book-open"></i>' },
    WORK: { name: 'Work', icon: '<i class="fas fa-briefcase"></i>' },
    PERSONAL: { name: 'Personal', icon: '<i class="fas fa-home"></i>' },
    HEALTH: { name: 'Health', icon: '<i class="fas fa-dumbbell"></i>' }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupFilterButtons();
});

// Load tasks from API
async function loadTasks() {
    try {
        // Add timeout to fail fast if server is down
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout

        const response = await fetch(API_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Failed to load tasks');
        const apiTasks = await response.json();

        // Use mock data if API returns empty array
        if (!apiTasks || apiTasks.length === 0) {
            console.warn('API returned empty data, using mock data for demonstration.');
            allTasks = getMockData();
        } else {
            allTasks = apiTasks;
        }
    } catch (error) {
        console.warn('API unavailable, loading mock data for design preview.');
        allTasks = getMockData(); // Fallback to mock data
    } finally {
        applyTimeFilter(); // Apply current filter
        updateDashboard();
        renderFilteredTasks();
    }
}

function getMockData() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    return [
        // Today tasks
        {
            name: 'Complete JavaScript Tutorial',
            category: 'LEARNING',
            timeline: {
                startDate: today.toISOString(),
                targetDate: today.toISOString(),
                totalTaskCount: 5
            },
            progress: { completed: 3 }
        },
        {
            name: 'Finish Project Presentation',
            category: 'WORK',
            timeline: {
                startDate: today.toISOString(),
                targetDate: today.toISOString(),
                totalTaskCount: 3
            },
            progress: { completed: 1 }
        },

        // This week tasks
        {
            name: 'Gym Workout Routine',
            category: 'HEALTH',
            timeline: {
                startDate: today.toISOString(),
                targetDate: nextWeek.toISOString(),
                totalTaskCount: 7
            },
            progress: { completed: 4 }
        },
        {
            name: 'Organize Home Office',
            category: 'PERSONAL',
            timeline: {
                startDate: today.toISOString(),
                targetDate: tomorrow.toISOString(),
                totalTaskCount: 2
            },
            progress: { completed: 1 }
        },

        // This month tasks
        {
            name: 'Read 3 Technical Books',
            category: 'LEARNING',
            timeline: {
                startDate: today.toISOString(),
                targetDate: nextMonth.toISOString(),
                totalTaskCount: 10
            },
            progress: { completed: 5 }
        },

        // Past task (should only show in "All")
        {
            name: 'Q4 Report Submission',
            category: 'WORK',
            timeline: {
                startDate: lastMonth.toISOString(),
                targetDate: lastMonth.toISOString(),
                totalTaskCount: 5
            },
            progress: { completed: 5 }
        }
    ];
}

// Update dashboard with statistics
// Update dashboard with statistics
function updateDashboard() {
    // Calculate overall statistics
    let totalItemsCompleted = 0;  // Sum of all completed items across all tasks
    let totalItemsNeeded = 0;     // Sum of all items needed across all tasks
    let totalTaskCount = 0;       // Number of tasks

    const categoryStats = {
        WORK: { total: 0, itemsCompleted: 0, itemsNeeded: 0 },
        LEARNING: { total: 0, itemsCompleted: 0, itemsNeeded: 0 },
        HEALTH: { total: 0, itemsCompleted: 0, itemsNeeded: 0 },
        PERSONAL: { total: 0, itemsCompleted: 0, itemsNeeded: 0 }
    };

    tasks.forEach(task => {
        const taskTotal = task.timeline?.totalTaskCount || 1;
        const taskCompletedCount = task.progress?.completed || 0;

        totalTaskCount++;
        totalItemsCompleted += taskCompletedCount;
        totalItemsNeeded += taskTotal;

        if (task.category && categoryStats[task.category]) {
            categoryStats[task.category].total++;
            categoryStats[task.category].itemsCompleted += taskCompletedCount;
            categoryStats[task.category].itemsNeeded += taskTotal;
        }
    });

    // Calculate how many tasks are fully completed
    const fullyCompletedTasks = tasks.filter(task => {
        const taskTotal = task.timeline?.totalTaskCount || 1;
        const taskCompletedCount = task.progress?.completed || 0;
        return taskCompletedCount >= taskTotal;
    }).length;

    // Update overall summary
    document.getElementById('totalCompleted').textContent = fullyCompletedTasks;
    document.getElementById('totalTasks').textContent = totalTaskCount;

    // Calculate overall progress based on items, not tasks
    const overallProgress = totalItemsNeeded > 0
        ? Math.round((totalItemsCompleted / totalItemsNeeded) * 100)
        : 0;
    document.getElementById('overallProgress').textContent = overallProgress + '%';

    const activeCategories = Object.values(categoryStats).filter(stat => stat.total > 0).length;
    document.getElementById('activeCategories').textContent = activeCategories;

    // Render category cards
    renderCategories(categoryStats);
}

// Render category cards
function renderCategories(categoryStats) {
    const categoriesGrid = document.getElementById('categoriesGrid');

    const categoryCards = CATEGORY_ORDER.map((key) => {
        const config = CATEGORIES[key];
        const stats = categoryStats[key];

        // Calculate completed and pending based on items
        const itemsCompleted = stats.itemsCompleted || 0;
        const itemsNeeded = stats.itemsNeeded || 0;
        const itemsPending = itemsNeeded - itemsCompleted;

        // Calculate progress percentage based on items
        const progress = itemsNeeded > 0
            ? Math.round((itemsCompleted / itemsNeeded) * 100)
            : 0;

        // Custom stats colors based on category
        const completedColor = getCompletedColor(key);
        const pendingColor = getPendingColor(key);

        return `
            <a href="index.html?category=${key}" class="category-card ${key}">
                <div class="category-card-header">
                    <div class="category-title">
                        <span class="category-icon ${key}">${config.icon}</span>
                        <span class="category-name">${config.name}</span>
                    </div>
                    <div class="category-badge">${stats.total}</div>
                </div>
                
                <div class="category-card-stats">
                    <div class="stat-box">
                        <div class="stat-number" style="color: ${completedColor}">${itemsCompleted}</div>
                        <div class="stat-text">COMPLETED</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number" style="color: ${pendingColor}">${itemsPending}</div>
                        <div class="stat-text">PENDING</div>
                    </div>
                </div>

                <div class="category-card-progress">
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar-track">
                            <div class="progress-bar-fill ${key}" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="progress-percentage">${progress}% Complete</div>
                </div>
            </a>
        `;
    }).join('');

    categoriesGrid.innerHTML = categoryCards;
}

function getCompletedColor(category) {
    switch (category) {
        case 'LEARNING': return '#f5576c';
        case 'WORK': return '#667eea';
        case 'PERSONAL': return '#2dd4bf'; // Teal
        case 'HEALTH': return '#00f2fe';
        default: return '#64748b';
    }
}

function getPendingColor(category) {
    switch (category) {
        case 'LEARNING': return '#f5576c';
        case 'WORK': return '#667eea';
        case 'PERSONAL': return '#2dd4bf';
        case 'HEALTH': return '#00f2fe';
        default: return '#64748b';
    }
}

// Setup filter button event listeners
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Update current filter
            currentFilter = button.dataset.filter;

            // Apply filter and update dashboard
            applyTimeFilter();
            updateDashboard();
            renderFilteredTasks();
        });
    });
}

// Apply time-based filter to tasks
function applyTimeFilter() {
    const now = new Date();

    if (currentFilter === 'all') {
        tasks = [...allTasks];
        return;
    }

    tasks = allTasks.filter(task => {
        // Check if task has timeline dates
        if (!task.timeline) return false;

        const startDate = task.timeline.startDate ? new Date(task.timeline.startDate) : null;
        const targetDate = task.timeline.targetDate ? new Date(task.timeline.targetDate) : null;

        // If no dates, exclude from filtered view
        if (!startDate && !targetDate) return false;

        // Use the most relevant date (prefer target date, fallback to start date)
        const taskDate = targetDate || startDate;

        switch (currentFilter) {
            case 'today':
                return isToday(taskDate);

            case 'week':
                return isThisWeek(taskDate);

            case 'month':
                return isThisMonth(taskDate);

            default:
                return true;
        }
    });
}

// Date helper functions
function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

function isThisWeek(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get the start of the week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Get the end of the week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
}

function isThisMonth(date) {
    const now = new Date();
    return date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
}

// Render filtered tasks list
function renderFilteredTasks() {
    const taskSection = document.getElementById('filteredTasksSection');
    const tasksList = document.getElementById('filteredTasksList');
    const tasksTitle = document.getElementById('filteredTasksTitle');

    // Update title based on filter
    const filterTitles = {
        'all': 'All Tasks',
        'today': 'Tasks Due Today',
        'week': 'Tasks Due This Week',
        'month': 'Tasks Due This Month'
    };
    tasksTitle.textContent = filterTitles[currentFilter] || 'Filtered Tasks';

    // Show/hide section based on filter
    if (currentFilter === 'all') {
        taskSection.style.display = 'none';
        return;
    }

    taskSection.style.display = 'block';

    // If no tasks, show message
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="no-tasks-message">
                <i class="fas fa-inbox"></i>
                <p>No tasks found for this time period</p>
            </div>
        `;
        return;
    }

    // Render task cards
    const taskCards = tasks.map(task => {
        const category = task.category || 'PERSONAL';
        const categoryConfig = CATEGORIES[category];
        const taskName = task.name || 'Untitled Task';

        // Calculate progress
        const totalItems = task.timeline?.totalTaskCount || 1;
        const completedItems = task.progress?.completed || 0;
        const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        // Format dates
        const startDate = task.timeline?.startDate ? new Date(task.timeline.startDate) : null;
        const targetDate = task.timeline?.targetDate ? new Date(task.timeline.targetDate) : null;

        let dateDisplay = '';
        if (targetDate) {
            dateDisplay = `<div class="task-date">
                <i class="fas fa-calendar-check"></i>
                <span>Due: ${formatDate(targetDate)}</span>
            </div>`;
        } else if (startDate) {
            dateDisplay = `<div class="task-date">
                <i class="fas fa-calendar-alt"></i>
                <span>Started: ${formatDate(startDate)}</span>
            </div>`;
        }

        return `
            <div class="task-card">
                <div class="task-card-header">
                    <div class="task-info">
                        <div class="task-name">${taskName}</div>
                        <div class="task-meta-info">
                            <span class="task-category-badge ${category}">
                                ${categoryConfig ? categoryConfig.name : category}
                            </span>
                            ${dateDisplay}
                        </div>
                    </div>
                </div>
                <div class="task-progress-info">
                    <div class="task-progress-bar">
                        <div class="task-progress-fill ${category}" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="task-progress-text">
                        ${completedItems} of ${totalItems} completed (${progressPercent}%)
                    </div>
                </div>
            </div>
        `;
    }).join('');

    tasksList.innerHTML = taskCards;
}

// Format date helper
function formatDate(date) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
