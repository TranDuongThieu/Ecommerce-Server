const mongoose = require("mongoose"); // Erase if already required
const { extraInfo } = require("../ultis/constant")
// Declare the Schema of the Mongo model
var auctionProductSchema = new mongoose.Schema(
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
        expire: {
            type: Date,
            required: true,
        },
        auctionHistory: [
            {
                price: { type: Number },
                bidedBy: {
                    type: mongoose.Types.ObjectId,
                    ref: "User",
                },
                bideddAt: Date,
            }
        ],
        reservePrice: {
            type: Number,
            required: true,
        },
        maxPrice: {
            type: Number,
            default: function () {
                return this.reservePrice;
            },
        },
        highestBidder: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
        stepPrice: {
            type: Number,
            required: true,
        },
        description: {
            type: Array,
            required: true,
        },
        brand: {
            type: String,
            required: true,
        },

        category: {
            type: mongoose.Types.ObjectId,
            ref: "ProductCategory",
        },
        thumbnail: {
            type: Object,
            required: true,
        },
        image: {
            type: Array,
        },
        extraInfo: {
            type: Array,
            default: extraInfo,
        },
    },
    { timestamps: true }
);

//Export the model
module.exports = mongoose.model("AuctionProduct", auctionProductSchema);
