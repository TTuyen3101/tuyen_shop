require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Kết nối cơ sở dữ liệu
connectDB();

// Cấu hình View Engine và Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Định tuyến
app.use('/orders', orderRoutes);
app.get('/', (req, res) => res.redirect('/orders'));

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
