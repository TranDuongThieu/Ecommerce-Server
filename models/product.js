const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
        },
        description: {
            type: Array,
            required: true,
        },
        brand: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        category: {
            type: mongoose.Types.ObjectId,
            ref: "ProductCategory",
        },
        quantity: {
            type: Number,
            default: 0,
        },
        sold: {
            type: Number,
            default: 0,
        },
        thumbnail: {
            type: Object,
            required: true,
        },
        image: {
            type: Array,
        },
        rating: [
            {
                star: { type: Number },
                postedBy: {
                    type: mongoose.Types.ObjectId,
                    ref: "User",
                },
                postedAt: Date,
                comment: { type: String },
            },
        ],
        extraInfo: {
            type: Array,
            default: [],
        },
        variants: Object,
        info: Object,
        totalRating: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

//Export the model
module.exports = mongoose.model("Product", productSchema);
