
const ENV = process.env;
const initDb = require('../../../helpers/db_ops/init_db');
const is_dev = ENV.USER != 'ubuntu' ? false : true;

module.exports = async function (req, res) {
    let status = 400, success = false, msg = '';
    const tract_key = req.query.tract_key ? req.query.tract_key : null;
    const dates = { start: '', end: '' };
    if (!tract_key) return { status, success, msg, data: dates }
    const db_pool = initDb('ticket', null, is_dev);

    try {
        const ticket_results = await db_pool.query('SELECT date from ticket WHERE tract_key = $1 ORDER BY date', [tract_key]);
        if (ticket_results.rowCount > 0) {
            dates['start'] = ticket_results.rows[0];
            dates['end'] = ticket_results.rows[(ticket_results.rows).length - 1];
            success = true;
            status = 200;
            msg = 'Ticket date extraction successful.';
        } else {
            status = 500;
            msg = 'No existing record(s).';
        }
    } catch (err) {
        console.log(err.message);
        msg = err.message;
    }
    db_pool.end(() => console.log('> Ticket dates pool closed.'));
    return { status, success, msg, data: dates };
};