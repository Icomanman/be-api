
const ENV = process.env;
const initDb = require('../../../helpers/db_ops/init_db');
const is_dev = ENV.USER != 'ubuntu' ? false : true;

module.exports = async function () {
    let status = 400, success = false, msg = '';
    const db_pool = initDb('fields', null, is_dev);
    let fields = [];
    try {
        const fields_results = await db_pool.query('SELECT * from fields');
        if (fields_results.rowCount > 0) {
            fields = fields.concat(fields_results.rows);
            success = true;
            status = 200;
            msg = 'fields extraction successful.';
        } else {
            status = 500;
            msg = 'No existing record(s).';
        }
    } catch (err) {
        console.log(err.message);
        msg = err.message;
    }
    db_pool.end(() => console.log('> fields pool closed.'));
    return { status, success, msg, data: fields };
};