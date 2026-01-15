const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// In-memory storage for when MongoDB is unavailable
let inMemoryTasks = [];
let nextId = 1;

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

// Conditional require - only use Task model if MongoDB is connected
let Task;
try {
    Task = require('../models/Task');
} catch (error) {
    console.warn('Task model not loaded - using in-memory storage');
}

// Helper to create task object for in-memory storage
const createInMemoryTask = (data) => {
    const now = new Date();
    return {
        _id: String(nextId++),
        name: data.name,
        priority: data.priority || 'medium',
        category: data.category || 'PERSONAL',
        tags: data.tags || [],
        notes: data.notes || '',
        timeline: data.timeline || null,
        progress: { completed: 0, percentage: 0 },
        weeklyProgress: [],
        createdAt: now,
        updatedAt: now
    };
};

// GET all tasks
router.get('/', async (req, res) => {
    try {
        if (isMongoConnected() && Task) {
            const tasks = await Task.find().sort({ createdAt: -1 });
            res.json(tasks);
        } else {
            res.json(inMemoryTasks);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create new task
router.post('/', async (req, res) => {
    try {
        if (isMongoConnected() && Task) {
            // Use MongoDB
            const { updateTaskProgress } = require('../utils/deadlineCalculator');

            const taskData = {
                name: req.body.name,
                priority: req.body.priority || 'medium',
                category: req.body.category || 'PERSONAL',
                tags: req.body.tags || [],
                notes: req.body.notes || '',
                goalType: req.body.goalType || 'daily',
                goalTarget: req.body.goalTarget || 7,
                weeklyProgress: []
            };

            if (req.body.timeline) {
                taskData.timeline = {
                    startDate: req.body.timeline.startDate || new Date(),
                    targetDate: req.body.timeline.targetDate,
                    totalDuration: req.body.timeline.totalDuration,
                    totalTaskCount: req.body.timeline.totalTaskCount,
                    completionType: req.body.timeline.completionType || 'daily'
                };
            }

            const task = new Task(taskData);

            if (task.timeline && task.timeline.targetDate) {
                updateTaskProgress(task);
            }

            const newTask = await task.save();
            res.status(201).json(newTask);
        } else {
            // Use in-memory storage
            const newTask = createInMemoryTask(req.body);
            inMemoryTasks.push(newTask);
            res.status(201).json(newTask);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update task progress
router.put('/:id/progress', async (req, res) => {
    try {
        if (isMongoConnected() && Task) {
            // MongoDB implementation
            const { updateTaskProgress } = require('../utils/deadlineCalculator');
            const { syncMissedTasks } = require('../utils/backlogManager');
            const { updateSchedulingMetrics } = require('../utils/scheduler');

            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json({ message: 'Task not found' });
            }

            const { week, year, month, day, checked } = req.body;

            let weekEntry = task.weeklyProgress.find(
                w => w.week === week && w.year === year
            );

            if (!weekEntry) {
                weekEntry = {
                    week,
                    year,
                    month,
                    days: {},
                    skipped: {},
                    completedAt: {}
                };
                task.weeklyProgress.push(weekEntry);
            }

            const wasCompleted = weekEntry.days[day];
            weekEntry.days[day] = checked;

            if (checked && !wasCompleted) {
                weekEntry.completedAt[day] = new Date();
                task.progress.completed = (task.progress.completed || 0) + 1;
            } else if (!checked) {
                weekEntry.completedAt[day] = null;
                // Decrement if it was completed on this day OR if count is positive (handle data mismatch)
                if (wasCompleted || task.progress.completed > 0) {
                    task.progress.completed = Math.max(0, (task.progress.completed || 0) - 1);
                }
            }

            if (task.timeline && task.timeline.targetDate) {
                updateTaskProgress(task);
                updateSchedulingMetrics(task);
                syncMissedTasks(task);
            }

            await task.save();
            res.json(task);
        } else {
            // In-memory implementation
            const task = inMemoryTasks.find(t => t._id === req.params.id);
            if (!task) {
                return res.status(404).json({ message: 'Task not found' });
            }

            const { checked } = req.body;
            if (checked) {
                task.progress.completed = (task.progress.completed || 0) + 1;
            } else {
                task.progress.completed = Math.max(0, (task.progress.completed || 0) - 1);
            }

            task.updatedAt = new Date();
            res.json(task);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE task
router.delete('/:id', async (req, res) => {
    try {
        if (isMongoConnected() && Task) {
            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json({ message: 'Task not found' });
            }
            await task.deleteOne();
            res.json({ message: 'Task deleted successfully' });
        } else {
            const index = inMemoryTasks.findIndex(t => t._id === req.params.id);
            if (index === -1) {
                return res.status(404).json({ message: 'Task not found' });
            }
            inMemoryTasks.splice(index, 1);
            res.json({ message: 'Task deleted successfully' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
