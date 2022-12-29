
const ENV = process.env;
const initDb = require('../../../helpers/db_ops/init_db');

module.exports = async function (req, res) {
    const is_dev = ENV.USER != 'ubuntu' ? false : true;
    // const is_dev = req.headers.host == 'localhost:8080' ? false : true;
    const db_table = req.originalUrl.match(/mills/) ? 'mills' : 'species';
    let status = 500;
    let msg = '';
    let success = false;
    let data = [];
    const db_pool = initDb(db_table, null, is_dev);
    const query = req.query.company_id ? `SELECT * FROM ${db_table} WHERE company_id = ${req.query.company_id}` : `SELECT * FROM ${db_table}`;
    const results = await db_pool.query(query);
    if (results.rowCount > 0) {
        data = data.concat(results.rows);
        status = 200;
        success = true;
    } else {
        msg = 'No record(s) found.';
    }
    db_pool.end(() => console.log(`${db_table} request closed.`));
    return { status, success, msg, data };
};
