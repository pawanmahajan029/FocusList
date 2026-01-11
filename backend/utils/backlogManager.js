// Backlog Manager Utility
// Handles missed task collection and backlog management

/**
 * Get date from week number and day name
 */
function getDateFromWeekDay(week, year, dayName) {
    const dayMap = {
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6,
        'sunday': 0
    };

    const dayOfWeek = dayMap[dayName.toLowerCase()];
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7;
    const targetDate = new Date(year, 0, 1 + daysOffset);

    // Adjust to the correct day of the week
    const currentDay = targetDate.getDay();
    const diff = dayOfWeek - currentDay;
    targetDate.setDate(targetDate.getDate() + diff);

    return targetDate;
}

/**
 * Get current week number
 */
function getCurrentWeekNumber() {
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Collect all missed tasks from previous weeks
 */
function collectMissedTasks(task, currentWeek, currentYear) {
    const missed = [];

    if (!task.weeklyProgress || task.weeklyProgress.length === 0) {
        return missed;
    }

    task.weeklyProgress.forEach(week => {
        // Only check past weeks
        const isPastWeek = week.year < currentYear ||
            (week.year === currentYear && week.week < currentWeek);

        if (isPastWeek) {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

            days.forEach(day => {
                const isCompleted = week.days[day];
                const isSkipped = week.skipped && week.skipped[day] && week.skipped[day].skipped;

                // If not completed and not skipped, it's missed
                if (!isCompleted && !isSkipped) {
                    const originalDate = getDateFromWeekDay(week.week, week.year, day);

                    // Check if already in missed tasks
                    const alreadyTracked = task.missedTasks.some(m =>
                        m.weekNumber === week.week &&
                        m.yearNumber === week.year &&
                        m.dayName === day
                    );

                    if (!alreadyTracked) {
                        missed.push({
                            originalDate,
                            weekNumber: week.week,
                            yearNumber: week.year,
                            dayName: day,
                            status: 'pending'
                        });
                    }
                }
            });
        }
    });

    return missed;
}

/**
 * Update backlog count and metadata
 */
function updateBacklog(task) {
    const pendingMissed = task.missedTasks.filter(m => m.status === 'pending');

    task.backlog.count = pendingMissed.length;
    task.backlog.totalMissedFromPreviousWeeks = pendingMissed.length;

    if (pendingMissed.length > 0) {
        // Sort by date to find oldest
        pendingMissed.sort((a, b) => new Date(a.originalDate) - new Date(b.originalDate));
        task.backlog.oldestMissedDate = pendingMissed[0].originalDate;
    } else {
        task.backlog.oldestMissedDate = null;
    }

    return task;
}

/**
 * Generate weekly plan with carryover tasks
 */
function generateWeeklyPlan(task, week, year) {
    const currentWeek = week || getCurrentWeekNumber();
    const currentYear = year || new Date().getFullYear();

    // Get new tasks for this week (based on goal)
    const newTasksCount = task.goalTarget || 7;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const newTasks = days.slice(0, newTasksCount).map(day => ({
        day,
        type: 'new',
        week: currentWeek,
        year: currentYear
    }));

    // Get carried over tasks (pending missed tasks)
    const carriedOverTasks = task.missedTasks
        .filter(m => m.status === 'pending')
        .map(m => ({
            day: m.dayName,
            type: 'carryover',
            originalWeek: m.weekNumber,
            originalYear: m.yearNumber,
            originalDate: m.originalDate,
            missedId: m._id
        }));

    return {
        newTasks,
        carriedOverTasks,
        totalThisWeek: newTasks.length + carriedOverTasks.length,
        week: currentWeek,
        year: currentYear
    };
}

/**
 * Mark a specific day as missed
 */
function markDayAsMissed(task, week, year, dayName) {
    const originalDate = getDateFromWeekDay(week, year, dayName);

    // Check if already marked as missed
    const alreadyMissed = task.missedTasks.some(m =>
        m.weekNumber === week &&
        m.yearNumber === year &&
        m.dayName === dayName
    );

    if (!alreadyMissed) {
        task.missedTasks.push({
            originalDate,
            weekNumber: week,
            yearNumber: year,
            dayName,
            status: 'pending'
        });
    }

    return task;
}

/**
 * Complete a missed task
 */
function completeMissedTask(task, missedId, status, reason, alternateTask) {
    const missedTask = task.missedTasks.id(missedId);

    if (!missedTask) {
        throw new Error('Missed task not found');
    }

    missedTask.status = status || 'completed-late';
    missedTask.completedDate = new Date();

    if (reason) {
        missedTask.reason = reason;
    }

    if (alternateTask) {
        missedTask.alternateTask = alternateTask;
    }

    // Update progress if completed late or replaced
    if (status === 'completed-late' || status === 'replaced') {
        task.progress.completed = (task.progress.completed || 0) + 1;
    }

    return task;
}

/**
 * Reschedule a missed task to a new date
 */
function rescheduleMissedTask(task, missedId, newWeek, newYear, newDay) {
    const missedTask = task.missedTasks.id(missedId);

    if (!missedTask) {
        throw new Error('Missed task not found');
    }

    // Remove from missed tasks
    task.missedTasks.pull(missedId);

    // Add to the new week's plan
    let weekProgress = task.weeklyProgress.find(w => w.week === newWeek && w.year === newYear);

    if (!weekProgress) {
        weekProgress = {
            week: newWeek,
            year: newYear,
            month: new Date(newYear, 0, 1 + (newWeek - 1) * 7).getMonth() + 1,
            days: {}
        };
        task.weeklyProgress.push(weekProgress);
    }

    // Mark as not completed yet in the new week
    weekProgress.days[newDay] = false;

    return task;
}

/**
 * Auto-sync missed tasks with weekly progress
 */
function syncMissedTasks(task) {
    const currentWeek = getCurrentWeekNumber();
    const currentYear = new Date().getFullYear();

    // Collect new missed tasks
    const newMissed = collectMissedTasks(task, currentWeek, currentYear);

    // Add to task's missed tasks array
    newMissed.forEach(missed => {
        task.missedTasks.push(missed);
    });

    // Update backlog
    updateBacklog(task);

    return task;
}

module.exports = {
    getDateFromWeekDay,
    getCurrentWeekNumber,
    collectMissedTasks,
    updateBacklog,
    generateWeeklyPlan,
    markDayAsMissed,
    completeMissedTask,
    rescheduleMissedTask,
    syncMissedTasks
};
