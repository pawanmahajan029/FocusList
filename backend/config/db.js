const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tasktracker', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(' MongoDB Connected Successfully');
    } catch (error) {
        console.warn(' MongoDB Connection Failed:', error.message);
        console.warn(' Server will run with in-memory storage (data will not persist)');
    }
};

module.exports = connectDB;
