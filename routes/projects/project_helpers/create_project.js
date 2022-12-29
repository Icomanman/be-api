
const ENV = process.env;
const getTemplate = require('../../../helpers/db_ops/data_templates');
const { validationResult } = require('express-validator');

module.exports = async function (req, res) {
    const is_dev = ENV.USER != 'ubuntu' ? false : true;
    // const is_dev = req.headers.host == 'localhost:8080' ? false : true;
    let status = 400;
    let messages = [];
    const err_msg = validationResult(req)['errors'];
    if (err_msg.length > 0) {
        err_msg.forEach(err => {
            messages = messages.concat(err.msg);
        });
        return { status, success: false, msg: messages };
    } else {
        const data = req.body;
        const default_data = getTemplate('tract_default');
        const allowed_keys = Object.keys(default_data);

        const new_data = {};
        allowed_keys.forEach(key => {
            new_data[key] = data[key];
        });

        const initDb = require('../../../helpers/db_ops/init_db');
        const NewTract = initDb('tract', new_data, is_dev);
        const { status, success, msg } = await NewTract.create();
        return { status, success, msg };
    }
};