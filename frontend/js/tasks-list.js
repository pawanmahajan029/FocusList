// API Configuration
const API_URL = 'http://localhost:7845/api/tasks';

// Global state
let allTasks = [];
let filteredTasks = [];
let currentStatusFilter = 'ALL';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadTasks();
});

function setupEventListeners() {
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        currentStatusFilter = e.target.value;
        applyFilters();
    });
}

// Load tasks from API
async function loadTasks() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) throw new Error('Failed to load tasks');
        allTasks = await response.json();
    } catch (error) {
        console.error('Failed to load tasks from API:', error);
        allTasks = [];
    } finally {
        applyFilters();
    }
}

// Apply filters
function applyFilters() {
    filteredTasks = allTasks.filter(task => {
        // Status filter only
        let statusMatch = true;
        if (currentStatusFilter === 'PENDING') {
            const totalTasks = task.timeline?.totalTaskCount || 1;
            const completedTasks = task.progress?.completed || 0;
            statusMatch = completedTasks < totalTasks;
        } else if (currentStatusFilter === 'COMPLETED') {
            const totalTasks = task.timeline?.totalTaskCount || 1;
            const completedTasks = task.progress?.completed || 0;
            statusMatch = completedTasks >= totalTasks;
        }

        return statusMatch;
    });

    renderTasks();
    updateSummary();
}

// Render tasks
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    const emptyState = document.getElementById('emptyState');

    if (filteredTasks.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    emptyState.style.display = 'none';

    // Sort tasks by date (most recent first)
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const dateA = a.timeline?.targetDate ? new Date(a.timeline.targetDate) : new Date(0);
        const dateB = b.timeline?.targetDate ? new Date(b.timeline.targetDate) : new Date(0);
        return dateB - dateA;
    });

    container.innerHTML = sortedTasks.map(task => renderTaskCard(task)).join('');
}

// Render individual task card
function renderTaskCard(task) {
    const category = task.category || 'PERSONAL';
    const totalTasks = task.timeline?.totalTaskCount || 1;
    const completedTasks = task.progress?.completed || 0;
    const isCompleted = completedTasks >= totalTasks;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Format dates
    const startDate = task.timeline?.startDate ? new Date(task.timeline.startDate) : null;
    const targetDate = task.timeline?.targetDate ? new Date(task.timeline.targetDate) : null;

    let dateDisplay = '';
    if (targetDate) {
        dateDisplay = `<span><i class="fas fa-calendar-check"></i> Due: ${formatDate(targetDate)}</span>`;
    } else if (startDate) {
        dateDisplay = `<span><i class="fas fa-calendar-alt"></i> Started: ${formatDate(startDate)}</span>`;
    }

    return `
        <div class="task-card ${isCompleted ? 'completed' : ''}">
            <div class="task-header">
                <div>
                    <span class="task-category ${category}">${getCategoryName(category)}</span>
                    <div class="task-name">${task.name || 'Untitled Task'}</div>
                </div>
                <input type="checkbox" 
                       class="task-checkbox" 
                       ${isCompleted ? 'checked' : ''}
                       onchange="toggleTask('${task._id}', this)"
                       ${isCompleted ? 'disabled' : ''}>
            </div>
            
            <div class="task-date">
                ${dateDisplay}
            </div>

            <div class="task-actions">
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${category}" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="progress-text">${progressPercent}% Complete</div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px;">
                        ${completedTasks}/${totalTasks} items
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteTask('${task._id}')" title="Delete Task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
}

// Delete task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_URL}/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete task');

        // Remove from local array and re-render
        allTasks = allTasks.filter(t => t._id !== taskId);
        applyFilters();

        // Optional: Show a toast or notification
    } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task. Please try again.');
    }
}

// Toggle task completion
async function toggleTask(taskId, checkbox) {
    try {
        const response = await fetch(`${API_URL}/${taskId}/progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                week: 1, // Defaulting to week 1 for now
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                day: 'monday', // This simulates a daily check, but backend might need specific day logic
                checked: checkbox.checked
            })
        });

        if (!response.ok) throw new Error('Failed to update task');

        await loadTasks();
    } catch (error) {
        console.error('Failed to update task:', error);
        checkbox.checked = !checkbox.checked; // Revert checkbox
    }
}

// Update summary
function updateSummary() {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => {
        const total = task.timeline?.totalTaskCount || 1;
        const completed = task.progress?.completed || 0;
        return completed >= total;
    }).length;
    const pendingTasks = totalTasks - completedTasks;

    document.getElementById('totalTasksCount').textContent = totalTasks;
    document.getElementById('completedTasksCount').textContent = completedTasks;
    document.getElementById('pendingTasksCount').textContent = pendingTasks;
}

// Helper functions
function getCategoryName(category) {
    const categories = {
        'LEARNING': 'Learning',
        'WORK': 'Work',
        'PERSONAL': 'Personal',
        'HEALTH': 'Health'
    };
    return categories[category] || category;
}

function formatDate(date) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
