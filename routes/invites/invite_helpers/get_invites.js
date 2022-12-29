
const ENV = process.env;
const { validationResult } = require('express-validator');

module.exports = async function (req, res) {
    const is_dev = ENV.USER != 'ubuntu' ? false : true;
    let status = 400;
    let success = false;
    let msg = '';
    let invites = [];
    const id = req.query.company_id ? req.query.company_id : null;
    const user_id = req.query.user_id ? req.query.user_id : null;
    const err_msg = validationResult(req)['errors'];

    if (err_msg.length > 0) {
        let messages = [];
        err_msg.forEach(err => { messages = messages.concat(err.msg) });
        msg = messages;
    } else if (id || user_id) {
        const initDb = require('../../../helpers/db_ops/init_db');
        const db_pool = initDb('invitations', null, is_dev);
        const query_filters = id ? ['company_id', id] : ['id', user_id];
        try {
            const invite_results = await db_pool.query(`SELECT * FROM invitations WHERE ${query_filters[0]} = ${query_filters[1]}`);
            if (invite_results.rowCount > 0) {
                invites = invites.concat(invite_results.rows);
                msg = 'Invitation(s) succesfully extracted.';
                status = 200;
                success = true;
            } else {
                msg = 'Admin user does not have invited user(s) yet.';
            }
        } catch (err) {
            console.log(err.message);
            msg = err.message;
        }
        db_pool.end(() => { console.log('> Invitation pool closed.') });
    }

    return { status, success, msg, invites }
};