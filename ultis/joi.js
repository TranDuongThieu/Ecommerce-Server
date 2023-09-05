const joi = require("joi");
const email = joi.string().pattern(new RegExp("@gmail.com$")).required();
const password = joi.string().min(6).required();
const name = joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
const mobile = joi.string().length(10).pattern(/^[0-9]+$/);
module.exports = { email, password, name, mobile }