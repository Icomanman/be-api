
const ENV = process.env;
const getTemplate = require('../../../helpers/db_ops/data_templates');
const { getLoads, pushLoad, updateLoad } = require('../../../helpers/db_ops/commands/load');
const { validationResult } = require('express-validator');

const createModifyLoad = async (req, res) => {
    const err_arr = validationResult(req)['errors'];
    let status_code = 401;
    const is_valid = {
        success: false,
        msg: err_arr.map(err => err['msg'])
    };
    if (err_arr.length > 0) {
        return { status: status_code, is_valid };
    } else if (req.url == '/modify-load' && !req.body.load_key) {
        is_valid['msg'] = 'Invalid load key.';
        return { status: status_code, is_valid };
    } else {
        const is_dev = ENV.USER != 'ubuntu' ? false : true;
        // const is_dev = req.headers.host == 'localhost:8080' ? false : true;
        const data = req.body;
        const load_tmp = getTemplate('loads');
        const allowed_keys = Object.keys(load_tmp);
        const new_data = {};
        allowed_keys.forEach(key => {
            if (req.url == '/create-load' && key == 'load_key') return;
            new_data[key] = data[key];
        });

        if (req.url == '/create-load') {
            var { status, success, msg, load_key } = await pushLoad(new_data, is_dev);
        } else {
            // /modify-load
            delete new_data.date; // until date is not required to be updated. 11 June 2022
            var { status, success, msg, load_key } = await updateLoad(new_data, is_dev);
        }
        status_code = status;
        is_valid['msg'] = msg;
        is_valid['success'] = success;
        is_valid['load_key'] = load_key;
        return { status: status_code, is_valid }
    }
};

const listLoads = async (req, res) => {
    let status_code = 401;
    const is_valid = {
        success: false,
        msg: ['Invalid request.'],
        loads: []
    };
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    // const id = req.query.tract_key ? req.query.tract_key : null;
    const tract_key = req.query.tract_key ? req.query.tract_key : null;
    const product_id = req.query.product_id ? req.query.product_id : null;

    if (token && (tract_key || product_id)) {
        const is_dev = ENV.USER != 'ubuntu' ? false : true;
        // const is_dev = req.headers.host == 'localhost:8080' ? false : true;
        const list_results = await getLoads({ tract_key, product_id }, is_dev);
        status_code = list_results.status;
        is_valid['msg'] = list_results.msg;
        is_valid['success'] = list_results.success;
        is_valid['loads'] = list_results.list;
    }
    return { status: status_code, is_valid }
};

module.exports = {
    createModifyLoad,
    listLoads
};