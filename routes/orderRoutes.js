const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Danh sách đơn hàng
router.get('/', orderController.getAllOrders);

// Thêm đơn hàng
router.get('/create', orderController.getCreatePage);
router.post('/create', orderController.createOrder);

// Cập nhật đơn hàng
router.get('/update/:id', orderController.getUpdatePage);
router.post('/update/:id', orderController.updateOrder);

// Xóa đơn hàng (hỗ trợ cả GET và POST để bấm link hay form đều chạy)
router.get('/delete/:id', orderController.deleteOrder);
router.post('/delete/:id', orderController.deleteOrder);

module.exports = router;
