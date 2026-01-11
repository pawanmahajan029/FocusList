// Deadline Calculator Utility
// Handles all timeline and progress calculations

/**
 * Calculate days elapsed since task start
 */
function getDaysElapsed(startDate) {
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Calculate expected progress based on timeline
 */
function calculateExpectedProgress(task) {
    if (!task.timeline || !task.timeline.targetDate) {
        return { expectedCompleted: 0, expectedPercentage: 0 };
    }

    const daysElapsed = getDaysElapsed(task.timeline.startDate);
    const totalDays = task.timeline.totalDuration ||
        getDaysElapsed(task.timeline.targetDate);
    const totalTasks = task.timeline.totalTaskCount || 1;

    const expectedCompleted = Math.round((daysElapsed / totalDays) * totalTasks);
    const expectedPercentage = Math.round((daysElapsed / totalDays) * 100);

    return {
        expectedCompleted: Math.min(expectedCompleted, totalTasks),
        expectedPercentage: Math.min(expectedPercentage, 100),
        daysElapsed,
        daysRemaining: Math.max(0, totalDays - daysElapsed)
    };
}

/**
 * Calculate actual progress percentage
 */
function calculateActualProgress(task) {
    const totalTasks = task.timeline?.totalTaskCount || 1;
    const completed = task.progress?.completed || 0;
    const percentage = Math.round((completed / totalTasks) * 100);

    return {
        completed,
        percentage: Math.min(percentage, 100)
    };
}

/**
 * Calculate pace and status (ahead, on-track, behind, critical)
 */
function calculatePaceStatus(task) {
    const completed = task.progress?.completed || 0;
    const expected = task.progress?.expected || 0;
    const difference = completed - expected;

    let status;
    if (difference >= 2) {
        status = 'ahead';
    } else if (difference >= -1) {
        status = 'on-track';
    } else if (difference >= -3) {
        status = 'behind';
    } else {
        status = 'critical';
    }

    return {
        status,
        difference,
        daysAhead: difference
    };
}

/**
 * Calculate expected and actual pace (tasks per week)
 */
function calculatePace(task) {
    const totalDays = task.timeline?.totalDuration || 1;
    const totalTasks = task.timeline?.totalTaskCount || 1;
    const daysElapsed = getDaysElapsed(task.timeline?.startDate);
    const completed = task.progress?.completed || 0;

    // Expected pace
    const expectedPace = (totalTasks / totalDays) * 7;

    // Actual pace
    const actualPace = daysElapsed > 0 ? (completed / daysElapsed) * 7 : 0;

    return {
        expected: Math.round(expectedPace * 10) / 10,
        actual: Math.round(actualPace * 10) / 10
    };
}

/**
 * Suggest recovery pace to get back on track
 */
function suggestRecoveryPace(task) {
    const daysRemaining = task.progress?.daysRemaining || 0;
    const debtCount = task.health?.debtCount || 0;
    const totalTasks = task.timeline?.totalTaskCount || 1;
    const completed = task.progress?.completed || 0;

    if (daysRemaining <= 0 || debtCount === 0) {
        return null;
    }

    const remainingTasks = totalTasks - completed;
    const tasksNeeded = remainingTasks + debtCount;
    const weeksRemaining = Math.ceil(daysRemaining / 7);
    const suggestedPace = Math.ceil(tasksNeeded / weeksRemaining);

    return {
        suggestedPace,
        message: `Complete ${suggestedPace} tasks per week to get back on track`,
        weeksToRecover: weeksRemaining,
        extraTasksNeeded: debtCount
    };
}

/**
 * Calculate forecast (will finish early or late)
 */
function calculateForecast(task) {
    const actualPace = task.progress?.pace?.actual || 0;
    const daysRemaining = task.progress?.daysRemaining || 0;
    const totalTasks = task.timeline?.totalTaskCount || 1;
    const completed = task.progress?.completed || 0;

    if (actualPace === 0) {
        return {
            willFinishEarly: false,
            daysDifference: 0,
            message: 'Not enough data to forecast'
        };
    }

    const remainingTasks = totalTasks - completed;
    const daysNeeded = Math.ceil((remainingTasks / actualPace) * 7);
    const daysDifference = daysNeeded - daysRemaining;

    let message;
    if (daysDifference < 0) {
        message = `At current pace, you'll finish ${Math.abs(daysDifference)} days early`;
    } else if (daysDifference > 0) {
        message = `At current pace, you'll finish ${daysDifference} days late`;
    } else {
        message = "At current pace, you'll finish exactly on time";
    }

    return {
        willFinishEarly: daysDifference < 0,
        daysDifference: Math.abs(daysDifference),
        message
    };
}

/**
 * Calculate health status based on progress
 */
function calculateHealthStatus(task) {
    const difference = task.health?.daysAhead || 0;

    let status;
    if (difference >= 2) {
        status = 'healthy';
    } else if (difference >= -1) {
        status = 'at-risk';
    } else if (difference >= -3) {
        status = 'behind';
    } else {
        status = 'critical';
    }

    return {
        status,
        bufferDays: Math.max(0, difference),
        debtCount: Math.max(0, -difference),
        creditCount: Math.max(0, difference)
    };
}

/**
 * Update all progress metrics for a task
 */
function updateTaskProgress(task) {
    // Calculate expected progress
    const expected = calculateExpectedProgress(task);
    task.progress.expected = expected.expectedCompleted;
    task.progress.daysElapsed = expected.daysElapsed;
    task.progress.daysRemaining = expected.daysRemaining;

    // Calculate actual progress
    const actual = calculateActualProgress(task);
    task.progress.percentage = actual.percentage;

    // Calculate pace
    const pace = calculatePace(task);
    task.progress.pace.expected = pace.expected;
    task.progress.pace.actual = pace.actual;

    // Calculate status
    const status = calculatePaceStatus(task);
    task.progress.pace.status = status.status;
    task.health.daysAhead = status.daysAhead;

    // Calculate health
    const health = calculateHealthStatus(task);
    task.health.status = health.status;
    task.health.bufferDays = health.bufferDays;
    task.health.debtCount = health.debtCount;
    task.health.creditCount = health.creditCount;

    // Calculate recovery suggestion
    const recovery = suggestRecoveryPace(task);
    if (recovery) {
        task.recovery.suggestedPace = recovery.suggestedPace;
        task.recovery.tasksToRecover = recovery.extraTasksNeeded;
    }

    return task;
}

module.exports = {
    getDaysElapsed,
    calculateExpectedProgress,
    calculateActualProgress,
    calculatePaceStatus,
    calculatePace,
    suggestRecoveryPace,
    calculateForecast,
    calculateHealthStatus,
    updateTaskProgress
};
