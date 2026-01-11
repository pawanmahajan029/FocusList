// API Configuration
const API_URL = 'http://localhost:7845/api/tasks';

// Global state
let tasks = [];

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
        tasks = await response.json();
    } catch (error) {
        console.warn('API unavailable, loading mock data for design preview.');
        tasks = getMockData(); // Fallback to mock data
    } finally {
        updateDashboard();
    }
}

function getMockData() {
    return [
        // LEARNING: 2 Completed, 0 Pending
        { category: 'LEARNING', timeline: { totalTaskCount: 1 }, progress: { completed: 1 } },
        { category: 'LEARNING', timeline: { totalTaskCount: 1 }, progress: { completed: 1 } },

        // WORK: 0 Completed, 0 Pending ("0" badge in screenshot)
        // No tasks needed if logic handles 0 properly, but let's leave empty.

        // PERSONAL: 0 Completed, 0 Pending
        // No tasks.

        // HEALTH: 1 Completed, 0 Pending
        { category: 'HEALTH', timeline: { totalTaskCount: 1 }, progress: { completed: 1 } }
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
