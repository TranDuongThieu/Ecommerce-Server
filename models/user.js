const mongoose = require("mongoose"); // Erase if already required
const crypto = require("crypto");
// Declare the Schema of the Mongo model
const bcrypt = require("bcrypt");
var userSchema = new mongoose.Schema(
    {
        firstname: {
            type: String,
            required: true,
        },
        lastname: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        mobile: {
            type: String,
            // unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: Number,
            enum: [4, 5],
            default: 4,
        },
        cart: [
            {
                product: {
                    type: mongoose.Types.ObjectId,
                    ref: "Product",
                },
                quantity: Number,
                variants: Object,
            },
        ],
        address: String,
        avatar: {
            type: Object,
        },
        wislist: [
            {
                type: mongoose.Types.ObjectId,
                ref: "Product",
            },
        ],
        isBlocked: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
        },
        passwordChangeAt: {
            type: String,
        },
        passwordResetToken: {
            type: String,
        },
        passwordResetExpires: {
            type: String,
        },
        registerToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        // const salt = bcrypt.genSaltSync(10);
        this.password = await bcrypt.hash(
            this.password,
            bcrypt.genSaltSync(10)
        );
    } else next();
});
userSchema.methods = {
    isCorrectPassword: function (password) {
        return bcrypt.compareSync(password, this.password);
    },
    createPasswordChangeToken: function () {
        const resetPasswordToken = crypto.randomBytes(32).toString("hex");
        this.passwordResetToken = crypto
            .createHash("sha256")
            .update(resetPasswordToken)
            .digest("hex");
        this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
        return resetPasswordToken;
    },
};
//Export the model
module.exports = mongoose.model("User", userSchema);
