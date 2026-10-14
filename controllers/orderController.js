const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { connectDB, getLastError } = require('../config/db');

// 1. Hiển thị danh sách đơn hàng
exports.getAllOrders = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }
        const orders = await Order.find().sort({ orderDate: -1 }).lean();
        res.render('order', {
            orders,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (err) {
        const dbStatus = mongoose.connection.readyState;
        const uriPreview = process.env.MONGODB_URI 
            ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@') 
            : 'CHƯA CẤU HÌNH (undefined)';
        const lastErr = getLastError();
        res.status(500).send(`
            <div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; max-width: 800px; margin: 30px auto; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #d9534f; margin-top: 0;">⚠️ Lỗi kết nối cơ sở dữ liệu MongoDB</h2>
                <p><b>Thông báo lỗi:</b> <code>${err.message}</code></p>
                ${lastErr ? `<p><b>Nguyên nhân từ MongoDB Driver:</b> <b style="color: red;">${lastErr}</b></p>` : ''}
                <p><b>Trạng thái kết nối (readyState):</b> ${dbStatus} (0=Mất kết nối, 1=Đã kết nối, 2=Đang kết nối)</p>
                <p><b>Biến MONGODB_URI Render nhận được:</b> <code style="background: #f4f4f4; padding: 3px 6px; border-radius: 4px;">${uriPreview}</code></p>
                <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
                <h4 style="margin-bottom: 8px;">Hướng dẫn khắc phục:</h4>
                <ol style="padding-left: 20px;">
                    <li><b>Nếu MONGODB_URI là "CHƯA CẤU HÌNH":</b> Vào Render &gt; Web service &gt; tab <b>Environment</b> &gt; Thêm Key là <code>MONGODB_URI</code> và Value là chuỗi kết nối MongoDB Atlas &gt; Bấm <b>Save Changes</b>.</li>
                    <li><b>Nếu bị lỗi "bad auth" hoặc "Authentication failed":</b> Mật khẩu hoặc username trong chuỗi kết nối bị sai.</li>
                    <li><b>Nếu bị lỗi "timed out":</b> Vào MongoDB Atlas &gt; <b>Network Access</b> &gt; Thêm IP <code>0.0.0.0/0</code> (Allow Access from Anywhere).</li>
                </ol>
            </div>
        `);
    }
};

// 2. Giao diện thêm đơn hàng
exports.getCreatePage = async (req, res) => {
    try {
        const products = await Product.find().lean();
        res.render('createOrder', { products, error: null, formData: {} });
    } catch {
        res.render('createOrder', { products: [], error: null, formData: {} });
    }
};

// 3. Xử lý thêm đơn hàng mới
exports.createOrder = async (req, res) => {
    const { customerName, productName, quantity, orderDate } = req.body;
    const products = await Product.find().lean();

    // 1. Validate bắt buộc
    if (!customerName || !customerName.trim()) {
        return res.render('createOrder', { products, error: 'Vui lòng nhập tên khách hàng!', formData: req.body });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
        return res.render('createOrder', { products, error: 'Số lượng đặt mua phải là số nguyên lớn hơn 0!', formData: req.body });
    }

    if (!orderDate || isNaN(new Date(orderDate).getTime())) {
        return res.render('createOrder', { products, error: 'Vui lòng chọn ngày đặt hàng hợp lệ!', formData: req.body });
    }

    // 2. Validate ngày không ở quá khứ
    const orderDay = new Date(orderDate).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    if (orderDay < today) {
        return res.render('createOrder', { products, error: 'Ngày đặt hàng không được ở trong quá khứ!', formData: req.body });
    }

    // 3. Validate sản phẩm tồn tại & kho hàng (Ràng buộc đề bài)
    const product = await Product.findOne({
        productName: { $regex: new RegExp(`^${productName.trim()}$`, 'i') }
    });

    if (!product) {
        return res.render('createOrder', { products, error: `Sản phẩm "${productName}" không tồn tại trong hệ thống!`, formData: req.body });
    }

    if (product.stockStatus !== 'in_stock') {
        return res.render('createOrder', { products, error: `Sản phẩm "${product.productName}" hiện đã hết hàng hoặc ngừng kinh doanh!`, formData: req.body });
    }

    // 4. Tự động tính Total Price và lưu
    try {
        await Order.create({
            customerName: customerName.trim(),
            productName: product.productName,
            quantity: qty,
            orderDate: new Date(orderDate),
            totalPrice: product.unitPrice * qty
        });
        res.redirect('/orders?success=' + encodeURIComponent('Đặt đơn hàng mới thành công!'));
    } catch (err) {
        res.render('createOrder', { products, error: 'Lỗi khi lưu đơn: ' + err.message, formData: req.body });
    }
};

// 4. Giao diện cập nhật đơn hàng
exports.getUpdatePage = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean();
        if (!order) return res.redirect('/orders?error=' + encodeURIComponent('Không tìm thấy đơn hàng!'));
        const products = await Product.find().lean();
        res.render('updateOrder', { order, products, error: null });
    } catch {
        res.redirect('/orders');
    }
};

// 5. Xử lý cập nhật đơn hàng
exports.updateOrder = async (req, res) => {
    const { customerName, productName, quantity, orderDate } = req.body;
    const products = await Product.find().lean();
    const orderData = { ...req.body, _id: req.params.id };

    if (!customerName || !customerName.trim()) {
        return res.render('updateOrder', { order: orderData, products, error: 'Vui lòng nhập tên khách hàng!' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
        return res.render('updateOrder', { order: orderData, products, error: 'Số lượng mua phải là số nguyên lớn hơn 0!' });
    }

    if (!orderDate || isNaN(new Date(orderDate).getTime())) {
        return res.render('updateOrder', { order: orderData, products, error: 'Vui lòng chọn ngày đặt hàng hợp lệ!' });
    }

    const product = await Product.findOne({
        productName: { $regex: new RegExp(`^${productName.trim()}$`, 'i') }
    });

    if (!product) {
        return res.render('updateOrder', { order: orderData, products, error: `Sản phẩm "${productName}" không tồn tại trong hệ thống!` });
    }

    try {
        await Order.findByIdAndUpdate(req.params.id, {
            customerName: customerName.trim(),
            productName: product.productName,
            quantity: qty,
            orderDate: new Date(orderDate),
            totalPrice: product.unitPrice * qty
        });
        res.redirect('/orders?success=' + encodeURIComponent('Cập nhật đơn hàng thành công!'));
    } catch (err) {
        res.render('updateOrder', { order: orderData, products, error: 'Lỗi khi cập nhật: ' + err.message });
    }
};

// 6. Xóa đơn hàng theo orderId
exports.deleteOrder = async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.redirect('/orders?success=' + encodeURIComponent('Đã xóa đơn hàng thành công!'));
    } catch (err) {
        res.redirect('/orders?error=' + encodeURIComponent('Lỗi khi xóa: ' + err.message));
    }
};
