
const ENV = process.env;
const { validationResult } = require('express-validator');
const { deleteFromUserPool } = require('./user_pool');

const deleteFromCompany = async (pool, user_data, db_table) => {
    const { company_id, id } = user_data;
    try {
        if (!company_id || !id) throw new Error('> Undefined user or company id.');
        await pool.query(`UPDATE company SET ${db_table} = array_remove(${db_table}, $1) WHERE id = $2 RETURNING *`, [id, company_id])
    } catch (err) {
        console.log(err.message);
    }
};

module.exports = async function (req, res) {
    const is_dev = ENV.USER != 'ubuntu' ? false : true;
    let status = 400;
    let success = false;
    let messages = [];
    const err_msg = validationResult(req)['errors'];
    if (err_msg.length > 0) {
        err_msg.forEach(err => {
            messages = messages.concat(err.msg);
        });
        return { status, success: false, msg: messages };
    } else {
        let user_action = 'Delete';
        const { id, user_type } = req.body;
        const db_table = user_type === 'admin' ? 'admin_users' : 'mobile_users';
        const initDb = require('../../../helpers/db_ops/init_db');
        const db_pool = initDb(db_table, null, is_dev);

        let username = null;
        let phone = null;
        if (user_type === 'admin') {
            results = await db_pool.query('SELECT email FROM admin_users WHERE id = $1', [id]);
            if (results.rowCount === 1) {
                username = results.rows[0].email;
                phone = results.rows[0].phone;
            }
        } else {
            username = await db_pool.query('SELECT phone FROM mobile_users WHERE id = $1', [id]);
            if (results.rowCount === 1) username = results.rows[0].email;
        }

        if (!username) return { status, success, msg: 'User deletion failed. (User not found)' };
        // Cognito User Pool
        const cognito_user = await deleteFromUserPool(username, user_type, phone);
        if (!cognito_user.success) return { status, success: false, msg: cognito_user.msg };
        let user_data = null;
        let msg = [];

        try {
            const user_results = await db_pool.query(`DELETE FROM ${db_table} WHERE id = ${id} RETURNING *`);
            if (user_results.rowCount == 1) {
                user_data = user_results.rows[0];
                status = 200;
                success = true;
                msg = `User (${db_table}) successfully deleted.`;
            } else {
                console.log(`ERR. (${user_action}) Record does not exists.`);
                msg = 'Record does not exists.';
            }
        } catch (err) {
            console.log(err.message);
            msg = err.message;
        };
        // delete user from the company:
        if (status == 200 && user_data) await deleteFromCompany(db_pool, user_data);
        db_pool.end(() => console.log(`> Delete user closed.`))
        return { status, success, msg, user_data };
    }
};