const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var OTPSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        code: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);
//Export the model
module.exports = mongoose.model("OTP", OTPSchema);
