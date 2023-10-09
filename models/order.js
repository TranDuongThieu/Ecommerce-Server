const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema(
    {
        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                },
                variants: Object,
                quantity: Number,
            },
        ],
        status: {
            type: String,
            default: "Processing",
            enum: ["Processing", "Shipping", "Successed", "Cancelled"],
        },
        total: Number,
        paymentMethod: {
            type: String,
            enum: ["COD", "PayPal"],
        },
        orderedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        tempUser: Object,
    },
    { timestamps: true }
);

//Export the model
module.exports = mongoose.model("Order", orderSchema);
