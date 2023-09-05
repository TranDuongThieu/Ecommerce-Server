const express = require("express");
require("dotenv").config();
const dbConnect = require("./config/dbconnect");
const initwebRoutes = require("./routes");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);
const port = process.env.PORT || 8888;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


dbConnect();
initwebRoutes(app);

app.listen(port, () => {
    console.log("Server running on the port: " + port);
});
