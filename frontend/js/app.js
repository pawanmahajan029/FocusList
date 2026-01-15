// API Configuration
const API_URL = 'http://localhost:7845/api/tasks';

// Global state
let tasks = [];
let currentCategory = 'ALL';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateUserProfile();
    setupEventListeners();
    loadTasks();
    setDefaultDates();
    handleCategoryFromURL();
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

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('name');
        window.location.href = 'index.html';
    }
}

// Handle category filter from URL parameter
function handleCategoryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
        currentCategory = category;
        document.getElementById('categoryFilter').value = category;
    }
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDateInput').value = today;
}

function setupEventListeners() {
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('taskNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Category Filter Listener
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        currentCategory = e.target.value;
        renderTasks();
        updateSummary();
    });
}

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
        console.warn('API unavailable, loading mock data for demo.');
        tasks = getMockData();
    } finally {
        renderTasks();
        updateSummary();
    }
}

function getMockData() {
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

    return [
        {
            _id: '1',
            name: 'Complete Project Documentation',
            category: 'WORK',
            timeline: { targetDate: yesterday.toISOString(), totalTaskCount: 1 },
            progress: { completed: 0 }
        },
        {
            _id: '2',
            name: 'Gym Workout',
            category: 'HEALTH',
            timeline: { targetDate: today.toISOString(), totalTaskCount: 1 },
            progress: { completed: 0 }
        },
        {
            _id: '3',
            name: 'Read 30 pages',
            category: 'LEARNING',
            timeline: { targetDate: today.toISOString(), totalTaskCount: 1 },
            progress: { completed: 1 } // Completed
        },
        {
            _id: '4',
            name: 'Weekly Grocery Shop',
            category: 'PERSONAL',
            timeline: { targetDate: tomorrow.toISOString(), totalTaskCount: 1 },
            progress: { completed: 0 }
        }
    ];
}

// Add new task
async function addTask() {
    const taskName = document.getElementById('taskNameInput').value.trim();
    const startDate = document.getElementById('startDateInput').value;
    const endDate = document.getElementById('endDateInput').value;
    const category = document.getElementById('categoryInput').value;

    if (!taskName) {
        alert('Please enter a task name');
        return;
    }

    if (!endDate) {
        alert('Please select an end deadline');
        return;
    }

    const taskData = {
        name: taskName,
        category: category,
        timeline: {
            startDate: startDate || new Date().toISOString(),
            targetDate: new Date(endDate).toISOString(),
            totalTaskCount: 1,
            completionType: 'count'
        },
        progress: { completed: 0 }
    };

    try {
        // Add timeout to fail fast if server is down
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Failed to create task');

        // Clear inputs
        document.getElementById('taskNameInput').value = '';
        setDefaultDates();

        // Redirect to dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.warn('Backend unavailable, adding task to local storage:', error.message);

        // Add task to in-memory storage when backend is unavailable
        const newTask = {
            _id: Date.now().toString(),
            ...taskData,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);

        // Clear inputs
        document.getElementById('taskNameInput').value = '';
        setDefaultDates();

        // Re-render tasks
        renderTasks();
        updateSummary();

        console.log('Task added locally (will not persist after refresh)');
    }
}

// Toggle task completion
async function toggleTask(taskId, checkbox) {
    try {
        const task = tasks.find(t => t._id === taskId);
        if (!task) return;

        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);

        const response = await fetch(`${API_URL}/${taskId}/progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                week: 1,
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                day: 'monday',
                checked: checkbox.checked
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Failed to update task');

        await loadTasks();
    } catch (error) {
        console.warn('Backend unavailable, updating task locally:', error.message);

        // Update task in memory (task already defined above)
        if (task) {
            if (checkbox.checked) {
                task.progress.completed = (task.progress.completed || 0) + 1;
            } else {
                task.progress.completed = Math.max(0, (task.progress.completed || 0) - 1);
            }

            renderTasks();
            updateSummary();
        }
    }
}

// Delete task
async function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;

    try {
        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);

        const response = await fetch(`${API_URL}/${taskId}`, {
            method: 'DELETE',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Failed to delete task');

        await loadTasks();
    } catch (error) {
        console.warn('Backend unavailable, deleting task locally:', error.message);

        // Remove task from memory
        const index = tasks.findIndex(t => t._id === taskId);
        if (index !== -1) {
            tasks.splice(index, 1);
            renderTasks();
            updateSummary();
        }
    }
}

// Render tasks grouped by status
function renderTasks() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const overdueTasks = [];
    const dueTodayTasks = [];
    const thisWeekTasks = [];
    const laterTasks = [];

    // Filter tasks based on category
    const filteredTasks = currentCategory === 'ALL'
        ? tasks
        : tasks.filter(t => t.category === currentCategory);

    filteredTasks.forEach(task => {
        if (!task.timeline || !task.timeline.targetDate) {
            laterTasks.push(task);
            return;
        }

        const dueDate = new Date(task.timeline.targetDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        if (dueDateOnly < today) {
            overdueTasks.push(task);
        } else if (dueDateOnly.getTime() === today.getTime()) {
            dueTodayTasks.push(task);
        } else if (dueDateOnly <= weekEnd) {
            thisWeekTasks.push(task);
        } else {
            laterTasks.push(task);
        }
    });

    // Sort each section by due date (ascending - nearest first)
    const sortByDueDate = (a, b) => {
        const dateA = a.timeline?.targetDate ? new Date(a.timeline.targetDate) : new Date('9999-12-31');
        const dateB = b.timeline?.targetDate ? new Date(b.timeline.targetDate) : new Date('9999-12-31');
        return dateA - dateB;
    };

    overdueTasks.sort(sortByDueDate);
    dueTodayTasks.sort(sortByDueDate);
    thisWeekTasks.sort(sortByDueDate);
    laterTasks.sort(sortByDueDate);

    renderTaskSection('overdue', overdueTasks);
    renderTaskSection('dueToday', dueTodayTasks);
    renderTaskSection('thisWeek', thisWeekTasks);
    renderTaskSection('later', laterTasks);
}

function renderTaskSection(sectionName, tasks) {
    const sectionMap = {
        'overdue': { section: 'overdueSection', list: 'overdueTasks', badge: 'overdueBadge' },
        'dueToday': { section: 'dueTodaySection', list: 'dueTodayTasks', badge: 'dueTodayBadge' },
        'thisWeek': { section: 'thisWeekSection', list: 'thisWeekTasks', badge: 'thisWeekBadge' },
        'later': { section: 'laterSection', list: 'laterTasks', badge: 'laterBadge' }
    };

    const { section, list, badge } = sectionMap[sectionName];
    const sectionEl = document.getElementById(section);
    const listEl = document.getElementById(list);
    const badgeEl = document.getElementById(badge);

    // Show all tasks (both completed and incomplete)
    if (tasks.length === 0) {
        sectionEl.style.display = 'none';
        return;
    }

    sectionEl.style.display = 'block';
    badgeEl.textContent = tasks.length;
    listEl.innerHTML = tasks.map(task => renderTaskItem(task, sectionName === 'overdue')).join('');
}

function renderTaskItem(task, isOverdue) {
    const completed = task.progress && task.progress.completed > 0;
    const totalTasks = task.timeline?.totalTaskCount || 1;
    const completedTasks = task.progress?.completed || 0;
    const dueDate = task.timeline?.targetDate ? new Date(task.timeline.targetDate) : null;

    let dueText = '';
    if (dueDate) {
        const now = new Date();
        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            dueText = `Due ${Math.abs(diffDays)} days ago`;
        } else if (diffDays === 0) {
            dueText = 'Due today';
        } else if (diffDays === 1) {
            dueText = 'Due tomorrow';
        } else {
            dueText = `Due in ${diffDays} days`;
        }
    }

    return `
        <div class="task-item ${isOverdue ? 'overdue' : ''} ${completed ? 'completed' : ''}">
            <input type="checkbox" 
                   class="task-checkbox ${completed ? 'checked' : ''}" 
                   ${completed ? 'checked' : ''}
                   onchange="toggleTask('${task._id}', this)">
            
            <div class="task-content">
                <div class="task-title">${task.name}</div>
                <div class="task-meta">
                    ${dueText ? `<div class="due-info">🕐 ${dueText}</div>` : ''}
                    ${task.category ? `<span class="task-category category-${task.category}">${task.category}</span>` : ''}
                    ${completedTasks > 0 ? `<span class="task-progress">${completedTasks}/${totalTasks}</span>` : ''}
                </div>
            </div>
            
            <button class="delete-btn" onclick="deleteTask('${task._id}')" title="Delete">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
}

// Update summary statistics
function updateSummary() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let completed = 0;
    let totalCompleted = 0;
    let totalTasks = 0;

    // Filter tasks based on category
    const filteredTasks = currentCategory === 'ALL'
        ? tasks
        : tasks.filter(t => t.category === currentCategory);

    filteredTasks.forEach(task => {
        const taskTotal = task.timeline?.totalTaskCount || 1;
        const taskCompletedCount = task.progress?.completed || 0;

        totalCompleted += taskCompletedCount;
        totalTasks += taskTotal;

        if (taskCompletedCount >= taskTotal) {
            completed++;
        }
    });

    document.getElementById('completedCount').textContent = completed;
    document.getElementById('totalTargetCount').textContent = filteredTasks.length;

    const percentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    document.getElementById('progressBarFill').style.width = percentage + '%';
    document.getElementById('progressText').textContent = `${percentage}% Complete`;
}
