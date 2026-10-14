const mongoose = require('mongoose');

let lastError = null;

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tuyen_shop';
        console.log('Connecting to:', mongoURI ? mongoURI.replace(/:([^@]+)@/, ':****@') : 'NONE');
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000
        });
        lastError = null;
        console.log('MongoDB connected successfully');
    } catch (error) {
        lastError = error.message;
        console.error('MongoDB connection error:', error.message);
        throw error;
    }
};

const getLastError = () => lastError;

module.exports = { connectDB, getLastError };
