const ENV = process.env;
const initDb = require('../../../helpers/db_ops/init_db');

module.exports = async function (req, res) {
    const is_dev = ENV.USER != 'ubuntu' ? false : true;
    // const is_dev = req.headers.host == 'localhost:8080' ? false : true;
    var status = 401;
    var success = false;
    var prod_dat = {};
    // const id = req.query.user_id ? req.query.user_id : null;
    const tract_key = req.query.tract_key ? req.query.tract_key : null;
    const product_id = req.query.product_id ? req.query.product_id : null;
    if (tract_key || product_id) {
        const Products = initDb('product', { tract_key, product_id }, is_dev);
        var { status, success, msg, prod_dat } = await Products.get();
    }
    return {
        status, success, msg,
        products: Object.keys(prod_dat).length > 0 ? prod_dat : {},
    };
};
