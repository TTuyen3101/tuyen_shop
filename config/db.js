const mongoose = require('mongoose');

let lastError = null;

const connectDB = async () => {
    try {
        let mongoURI = process.env.MONGODB_URI || 'mongodb+srv://thanhtuyen4804_db_user:1NCMmPmNwwR3kfrU@cluster0.anqfmep.mongodb.net/tuyen_shop?retryWrites=true&w=majority';
        
        // Tự động thay thế placeholder <db_password> hoặc <password> bằng mật khẩu thật
        if (mongoURI.includes('<db_password>') || mongoURI.includes('<password>')) {
            mongoURI = mongoURI.replace(/<db_password>|<password>/g, '1NCMmPmNwwR3kfrU');
        }
        
        // Đảm bảo có tên database tuyen_shop
        if (!mongoURI.includes('/tuyen_shop') && mongoURI.includes('.mongodb.net/')) {
            mongoURI = mongoURI.replace('.mongodb.net/?', '.mongodb.net/tuyen_shop?');
        }

        console.log('Connecting to MongoDB...');
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
