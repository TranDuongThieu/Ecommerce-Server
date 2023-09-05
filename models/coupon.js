const mongoose = require("mongoose");
var couponSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            required: true,
        },
        discount: {
            type: Number,
            required: true,
        },
        expiry: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

//Export the model
module.exports = mongoose.model("Coupon", couponSchema);
