// API Configuration
const API_URL = 'http://localhost:7845/api/tasks';

// Category configuration with specific order
const CATEGORY_ORDER = ['LEARNING', 'WORK', 'PERSONAL', 'HEALTH'];

const CATEGORIES = {
    LEARNING: { name: 'Learning', icon: '<i class="fas fa-book-open"></i>' },
    WORK: { name: 'Work', icon: '<i class="fas fa-briefcase"></i>' },
    PERSONAL: { name: 'Personal', icon: '<i class="fas fa-home"></i>' },
    HEALTH: { name: 'Health', icon: '<i class="fas fa-dumbbell"></i>' }
};

// Reactive State Management
const state = new Proxy({
    allTasks: [], // Store all tasks from API
    tasks: [],    // Store currently filtered tasks
    currentFilter: 'all', // Current time filter
    categoryFilter: 'all', // Current category filter
    searchQuery: '' // Search query
}, {
    set(target, property, value) {
        target[property] = value;

        // When data source, filter, or search changes, re-apply filter logic
        if (property === 'allTasks' || property === 'currentFilter' || property === 'categoryFilter' || property === 'searchQuery') {
            applyFilters();
        }

        // When filtered tasks list changes, update the UI
        if (property === 'tasks') {
            updateDashboard();
            renderFilteredTasks();
        }

        return true;
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateUserProfile(); // Load user info
    renderInitialState();
    loadTasks();
    setupFilters();
});

function updateUserProfile() {
    const username = localStorage.getItem('username') || 'User';
    const name = localStorage.getItem('name') || username;

    // Update elements if they exist
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');

    if (avatarEl) avatarEl.textContent = username.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = name;
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('name');
        window.location.href = 'index.html';
    }
}

// Render initial state with zeros
function renderInitialState() {
    const categoryStats = {
        WORK: { total: 0, itemsCompleted: 0, itemsNeeded: 0 },
        LEARNING: { total: 0, itemsCompleted: 0, itemsNeeded: 0 },
        HEALTH: { total: 0, itemsCompleted: 0, itemsNeeded: 0 },
        PERSONAL: { total: 0, itemsCompleted: 0, itemsNeeded: 0 }
    };
    renderCategories(categoryStats);
}


// Load tasks from API
async function loadTasks() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) throw new Error('Failed to load tasks');
        state.allTasks = await response.json(); // Triggers reactivity
    } catch (error) {
        console.error('Failed to load tasks from API:', error);
        state.allTasks = []; // Triggers reactivity
    }
}


// Update dashboard with statistics
function updateDashboard() {
    // Calculate overall statistics based on ALL tasks (ignoring search/time filters for the stats cards preferably? 
    // Or normally dashboard stats adjust to filters. Let's make stats global but list filtered.
    // Actually, typically dashboard summary shows 'Current View' stats. Let's keep using state.tasks (filtered) 
    // BUT the standard is usually summary of EVERYTHING vs filtered list. 
    // Let's use state.allTasks for the summary cards to show "Total" overview, 
    // and only use filtered for the list. 
    // HOWEVER, the previous logic used `state.tasks` for stats. 
    // Providing immediate feedback on filter is nice. Let's stick to using filtered tasks for stats *if* the user wants to see stats for "Today" specifically.
    // BUT search is usually a finder.
    // Let's rely on `state.tasks` (filtered) for consistency with previous behavior.

    let totalItemsCompleted = 0;
    let totalItemsNeeded = 0;
    let totalTaskCount = 0;

    const categoryStats = {
        WORK: { total: 0, itemsCompleted: 0, itemsNeeded: 0 },
        LEARNING: { total: 0, itemsCompleted: 0, itemsNeeded: 0 },
        HEALTH: { total: 0, itemsCompleted: 0, itemsNeeded: 0 },
        PERSONAL: { total: 0, itemsCompleted: 0, itemsNeeded: 0 }
    };

    state.tasks.forEach(task => {
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
    const fullyCompletedTasks = state.tasks.filter(task => {
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

        // Determine active state for styling
        const isActive = state.categoryFilter === key ? 'active-category' : '';

        return `
            <div onclick="filterByCategory('${key}')" class="category-card ${key} ${isActive}" style="cursor: pointer;">
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
            </div>
        `;
    }).join('');

    categoriesGrid.innerHTML = categoryCards;
}

function getCompletedColor(category) {
    switch (category) {
        case 'LEARNING': return '#f43f5e'; // Rose
        case 'WORK': return '#6366f1'; // Indigo
        case 'PERSONAL': return '#10b981'; // Emerald
        case 'HEALTH': return '#06b6d4'; // Cyan
        default: return '#64748b';
    }
}

function getPendingColor(category) {
    switch (category) {
        case 'LEARNING': return '#f43f5e';
        case 'WORK': return '#6366f1';
        case 'PERSONAL': return '#10b981';
        case 'HEALTH': return '#06b6d4';
        default: return '#64748b';
    }
}

// Setup filter button event listeners
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.querySelector('.search-bar input');

    // Time filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Update current filter - Triggers reactivity
            state.currentFilter = button.dataset.filter;
        });
    });

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase().trim();
        });
    }
}

// Filter by category
function filterByCategory(category) {
    if (state.categoryFilter === category) {
        // Toggle off if already selected
        state.categoryFilter = 'all';
    } else {
        state.categoryFilter = category;
    }

    // Scroll to task list to see results
    const taskSection = document.getElementById('filteredTasksSection');
    if (taskSection) {
        taskSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Apply filters (Time + Category + Search) to tasks
function applyFilters() {
    let filtered = [...state.allTasks];

    // 1. Apply Time Filter
    if (state.currentFilter !== 'all') {
        filtered = filtered.filter(task => {
            if (!task.timeline) return false;

            const startDate = task.timeline.startDate ? new Date(task.timeline.startDate) : null;
            const targetDate = task.timeline.targetDate ? new Date(task.timeline.targetDate) : null;

            if (!startDate && !targetDate) return false;

            const taskDate = targetDate || startDate;

            switch (state.currentFilter) {
                case 'today': return isToday(taskDate);
                case 'week': return isThisWeek(taskDate);
                case 'month': return isThisMonth(taskDate);
                default: return true;
            }
        });
    }

    // 2. Apply Category Filter
    if (state.categoryFilter !== 'all') {
        filtered = filtered.filter(task => task.category === state.categoryFilter);
    }

    // 3. Apply Search Filter
    if (state.searchQuery) {
        filtered = filtered.filter(task => {
            const nameMatch = task.name && task.name.toLowerCase().includes(state.searchQuery);
            const categoryMatch = task.category && task.category.toLowerCase().includes(state.searchQuery);
            return nameMatch || categoryMatch;
        });
    }

    state.tasks = filtered; // Update state.tasks, triggers UI Update

    // Re-render categories to update active state styling
    // We need to calculate fresh stats based on ALL tasks, not filtered tasks?
    // Actually, stats usually remain global.
    // However, we need to re-render to update the 'active-category' class if we added it.
    updateDashboard();
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
    let title = 'Tasks';

    if (state.categoryFilter !== 'all') {
        const catName = CATEGORIES[state.categoryFilter].name;
        title = `${catName} Tasks`;
    } else {
        const timeTitles = {
            'all': 'All Tasks',
            'today': 'Tasks Due Today',
            'week': 'Tasks Due This Week',
            'month': 'Tasks Due This Month'
        };
        title = timeTitles[state.currentFilter] || 'Filtered Tasks';
    }

    tasksTitle.textContent = title;

    // Show/hide section based on filter
    // Always show if a category is selected OR if it's not 'all' time filter
    // If it is 'all' time filter AND 'all' category AND no search, maybe hide?
    // User requested to see list on click.
    if (state.currentFilter === 'all' && state.categoryFilter === 'all' && !state.searchQuery) {
        taskSection.style.display = 'none';
        return;
    }

    taskSection.style.display = 'block';

    // If no tasks, show message
    if (state.tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="no-tasks-message">
                <i class="fas fa-inbox"></i>
                <p>No tasks found for this time period</p>
            </div>
        `;
        return;
    }

    // Render task cards
    const taskCards = state.tasks.map(task => {
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
                <div class="task-actions">
                    <div class="task-progress-info">
                        <div class="task-progress-bar">
                            <div class="task-progress-fill ${category}" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="task-progress-text">
                            ${completedItems} of ${totalItems} completed (${progressPercent}%)
                        </div>
                    </div>
                    <button class="delete-btn" onclick="deleteTaskConfirmed('${task._id}')" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    tasksList.innerHTML = taskCards;
}

// Delete Task Function
async function deleteTaskConfirmed(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_URL}/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete task');

        // Update local state (reactivity will handle UI update)
        const updatedTasks = state.allTasks.filter(t => t._id !== taskId);
        state.allTasks = updatedTasks;

    } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task');
    }
}

// Format date helper
function formatDate(date) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
