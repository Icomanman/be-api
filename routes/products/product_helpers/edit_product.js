
const ENV = process.env;
const getTemplate = require('../../../helpers/db_ops/data_templates');
const { validationResult } = require("express-validator");

module.exports = async function (req, res) {
    const is_dev = ENV.USER != "ubuntu" ? false : true;
    // const is_dev = req.headers.host == 'localhost:8080' ? false : true;
    let status = 400, success = false, msg = '';
    let messages = [];
    const err_msg = validationResult(req)["errors"];
    if (err_msg.length > 0) {
        err_msg.forEach((err) => messages = messages.concat(err.msg));
        msg = messages;
    } else {
        const data = req.body;
        const default_data = getTemplate("product");
        const allowed_keys = Object.keys(default_data);

        const new_data = {};
        allowed_keys.forEach((key) => {
            new_data[key] = data[key];
        });

        const initDb = require('../../../helpers/db_ops/init_db');
        const ExistingProduct = initDb("product", { new_data, product_id: data.product_id }, is_dev);
        const product_updates = await ExistingProduct.update();
        status = product_updates.status;
        success = product_updates.success;
        msg = product_updates.msg;
        // Closing of pool after all the ops
        ExistingProduct.close();
    }
    return { status, success, msg };
};