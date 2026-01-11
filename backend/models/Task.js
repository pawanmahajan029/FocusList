const mongoose = require('mongoose');

const weeklyProgressSchema = new mongoose.Schema({
    week: { type: Number, required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    days: {
        monday: { type: Boolean, default: false },
        tuesday: { type: Boolean, default: false },
        wednesday: { type: Boolean, default: false },
        thursday: { type: Boolean, default: false },
        friday: { type: Boolean, default: false },
        saturday: { type: Boolean, default: false },
        sunday: { type: Boolean, default: false }
    },
    skipped: {
        monday: { skipped: { type: Boolean, default: false }, reason: String },
        tuesday: { skipped: { type: Boolean, default: false }, reason: String },
        wednesday: { skipped: { type: Boolean, default: false }, reason: String },
        thursday: { skipped: { type: Boolean, default: false }, reason: String },
        friday: { skipped: { type: Boolean, default: false }, reason: String },
        saturday: { skipped: { type: Boolean, default: false }, reason: String },
        sunday: { skipped: { type: Boolean, default: false }, reason: String }
    },
    completedAt: {
        monday: Date,
        tuesday: Date,
        wednesday: Date,
        thursday: Date,
        friday: Date,
        saturday: Date,
        sunday: Date
    }
});

const missedTaskSchema = new mongoose.Schema({
    originalDate: Date,
    weekNumber: Number,
    yearNumber: Number,
    dayName: String,
    status: {
        type: String,
        enum: ['pending', 'completed-late', 'skipped', 'replaced'],
        default: 'pending'
    },
    completedDate: Date,
    reason: String,
    alternateTask: String
});

const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Priority & Organization
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    category: {
        type: String,
        default: 'personal'
    },
    tags: [String],
    notes: String,

    // Timeline & Deadline
    timeline: {
        startDate: { type: Date, default: Date.now },
        targetDate: Date,
        totalDuration: Number,  // in days
        totalTaskCount: Number,
        completionType: {
            type: String,
            enum: ['count', 'daily', 'weekly'],
            default: 'daily'
        }
    },

    // Progress Tracking
    progress: {
        completed: { type: Number, default: 0 },
        expected: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        daysElapsed: { type: Number, default: 0 },
        daysRemaining: Number,
        pace: {
            expected: { type: Number, default: 0 },
            actual: { type: Number, default: 0 },
            status: {
                type: String,
                enum: ['ahead', 'on-track', 'behind', 'critical'],
                default: 'on-track'
            }
        }
    },

    // Missed Tasks & Backlog
    missedTasks: [missedTaskSchema],
    backlog: {
        count: { type: Number, default: 0 },
        oldestMissedDate: Date,
        totalMissedFromPreviousWeeks: { type: Number, default: 0 }
    },

    // Health Indicators
    health: {
        status: {
            type: String,
            enum: ['healthy', 'at-risk', 'behind', 'critical'],
            default: 'healthy'
        },
        daysAhead: { type: Number, default: 0 },
        bufferDays: { type: Number, default: 0 },
        debtCount: { type: Number, default: 0 },
        creditCount: { type: Number, default: 0 }
    },

    // Velocity & Trends
    velocity: {
        lastWeek: { type: Number, default: 0 },
        thisWeek: { type: Number, default: 0 },
        average: { type: Number, default: 0 },
        trend: {
            type: String,
            enum: ['improving', 'declining', 'stable'],
            default: 'stable'
        }
    },

    // Recovery Tracking
    recovery: {
        isRecovering: { type: Boolean, default: false },
        consecutiveCatchupDays: { type: Number, default: 0 },
        tasksToRecover: { type: Number, default: 0 },
        suggestedPace: Number
    },

    // Goal Settings
    goalType: {
        type: String,
        enum: ['daily', 'weekly', 'custom'],
        default: 'daily'
    },
    goalTarget: { type: Number, default: 7 },
    recurringPattern: {
        type: {
            type: String,
            enum: ['daily', 'weekdays', 'custom'],
            default: 'daily'
        },
        customDays: [String]
    },

    // Streak Tracking
    streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastCompletedDate: Date
    },

    // Completion History
    completionHistory: [{
        date: Date,
        completedCount: Number,
        totalExpected: Number,
        percentage: Number
    }],

    // Existing Fields
    weeklyProgress: [weeklyProgressSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
taskSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Task', taskSchema);

