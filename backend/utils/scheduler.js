// Scheduler Utility
// Smart scheduling, recovery suggestions, and velocity tracking

const { calculateForecast } = require('./deadlineCalculator');

/**
 * Suggest catch-up plan to get back on track
 */
function suggestCatchUp(task) {
    const debtCount = task.health?.debtCount || 0;
    const daysRemaining = task.progress?.daysRemaining || 0;

    if (debtCount === 0) {
        return null;
    }

    if (daysRemaining <= 0) {
        return {
            message: 'Deadline has passed. Consider extending the deadline or marking tasks as skipped.',
            extraTasksThisWeek: debtCount,
            weeksToRecover: 0
        };
    }

    const weeksRemaining = Math.ceil(daysRemaining / 7);
    const extraPerWeek = Math.ceil(debtCount / weeksRemaining);

    return {
        message: `Complete ${extraPerWeek} extra task${extraPerWeek > 1 ? 's' : ''} per week to get back on track`,
        extraTasksThisWeek: extraPerWeek,
        weeksToRecover: weeksRemaining,
        totalDebt: debtCount
    };
}

/**
 * Auto-adjust pace recommendation
 */
function autoAdjustPace(task) {
    const completed = task.progress?.completed || 0;
    const totalTaskCount = task.timeline?.totalTaskCount || 1;
    const daysRemaining = task.progress?.daysRemaining || 0;
    const currentPace = task.progress?.pace?.expected || 0;

    if (daysRemaining <= 0) {
        return null;
    }

    const remainingTasks = totalTaskCount - completed;
    const newPace = Math.ceil((remainingTasks / daysRemaining) * 7);

    if (newPace === currentPace) {
        return null;
    }

    return {
        oldPace: currentPace,
        newPace,
        message: `To finish on time, complete ${newPace} task${newPace > 1 ? 's' : ''} per week instead of ${currentPace}`,
        increase: newPace - currentPace
    };
}

/**
 * Track recovery streak
 */
function trackRecovery(task) {
    const wasRecovering = task.recovery?.isRecovering || false;
    const debtCount = task.health?.debtCount || 0;
    const trend = task.velocity?.trend || 'stable';

    // Is recovering if there's debt and velocity is improving
    const isRecovering = debtCount > 0 && trend === 'improving';

    if (isRecovering) {
        task.recovery.consecutiveCatchupDays = (task.recovery.consecutiveCatchupDays || 0) + 1;
    } else {
        task.recovery.consecutiveCatchupDays = 0;
    }

    task.recovery.isRecovering = isRecovering;
    task.recovery.tasksToRecover = debtCount;

    return task;
}

/**
 * Calculate weekly velocity and trend
 */
function calculateVelocity(task) {
    const currentWeek = getCurrentWeekNumber();
    const currentYear = new Date().getFullYear();
    const lastWeek = currentWeek - 1;

    // Get this week's completed count
    const thisWeekProgress = task.weeklyProgress.find(w =>
        w.week === currentWeek && w.year === currentYear
    );
    const thisWeekCount = thisWeekProgress ?
        Object.values(thisWeekProgress.days).filter(d => d === true).length : 0;

    // Get last week's completed count
    const lastWeekProgress = task.weeklyProgress.find(w =>
        w.week === lastWeek && w.year === currentYear
    );
    const lastWeekCount = lastWeekProgress ?
        Object.values(lastWeekProgress.days).filter(d => d === true).length : 0;

    // Calculate average
    const allWeeks = task.weeklyProgress.map(w =>
        Object.values(w.days).filter(d => d === true).length
    );
    const average = allWeeks.length > 0 ?
        Math.round((allWeeks.reduce((a, b) => a + b, 0) / allWeeks.length) * 10) / 10 : 0;

    // Determine trend
    let trend = 'stable';
    if (thisWeekCount > lastWeekCount) {
        trend = 'improving';
    } else if (thisWeekCount < lastWeekCount) {
        trend = 'declining';
    }

    return {
        lastWeek: lastWeekCount,
        thisWeek: thisWeekCount,
        average,
        trend
    };
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
 * Suggest optimal catch-up days
 */
function suggestOptimalDays(task) {
    const debtCount = task.health?.debtCount || 0;

    if (debtCount === 0) {
        return null;
    }

    // Analyze which days user is most productive
    const dayStats = {
        monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
        friday: 0, saturday: 0, sunday: 0
    };

    task.weeklyProgress.forEach(week => {
        Object.entries(week.days).forEach(([day, completed]) => {
            if (completed) {
                dayStats[day]++;
            }
        });
    });

    // Sort days by productivity
    const sortedDays = Object.entries(dayStats)
        .sort((a, b) => b[1] - a[1])
        .map(([day]) => day);

    const suggestedDays = sortedDays.slice(0, Math.min(debtCount, 3));

    return {
        suggestedDays,
        message: `Based on your history, try catching up on ${suggestedDays.join(', ')}`,
        mostProductiveDay: sortedDays[0]
    };
}

/**
 * Calculate buffer days earned
 */
function calculateBufferDays(task) {
    const daysAhead = task.health?.daysAhead || 0;

    if (daysAhead <= 0) {
        return 0;
    }

    // Buffer days = days ahead that can be used for breaks
    return Math.floor(daysAhead);
}

/**
 * Update all scheduling metrics
 */
function updateSchedulingMetrics(task) {
    // Update velocity
    const velocity = calculateVelocity(task);
    task.velocity.lastWeek = velocity.lastWeek;
    task.velocity.thisWeek = velocity.thisWeek;
    task.velocity.average = velocity.average;
    task.velocity.trend = velocity.trend;

    // Track recovery
    trackRecovery(task);

    // Calculate buffer days
    task.health.bufferDays = calculateBufferDays(task);

    return task;
}

module.exports = {
    suggestCatchUp,
    autoAdjustPace,
    trackRecovery,
    calculateVelocity,
    suggestOptimalDays,
    calculateBufferDays,
    updateSchedulingMetrics
};
