const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    stockStatus: {
        type: String,
        enum: ['in_stock', 'out_of_stock', 'discontinued'],
        default: 'in_stock'
    },
    unitPrice: {
        type: Number,
        required: true
    },
    tags: [{
        type: String
    }]
});

module.exports = mongoose.model('Product', productSchema);
