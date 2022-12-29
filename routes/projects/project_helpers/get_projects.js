
const ENV = process.env;
const initDb = require('../../../helpers/db_ops/init_db');

module.exports = async function (req, res) {
    const is_dev = ENV.USER != 'ubuntu' ? false : true;
    console.log('> User: ' + ENV.USER);
    // const is_dev = req.headers.host == 'localhost:8080' ? false : true;
    var status = 400;
    var success = false;
    var tract_dat = {};
    const user_id = req.query.user_id ? req.query.user_id : null;
    const is_mobile = req.query.mobile ? req.query.mobile : false;
    if (user_id) {
        const Tracts = initDb('tract', { user_id, is_mobile }, is_dev);
        var { status, success, msg, tract_dat } = await Tracts.get();
    }
    return { status, success, msg, tracts: Object.keys(tract_dat).length > 0 ? tract_dat : {} };
};