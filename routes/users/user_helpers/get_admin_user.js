
const ENV = process.env;

module.exports = async function (req, res) {
    const is_dev = ENV.USER != 'ubuntu' ? false : true;
    let status = 404;
    let success = false;
    let msg = 'User not found';
    let user_data = null;
    const id = req.query.user_id ? req.query.user_id : null;
    const initDb = require('../../../helpers/db_ops/init_db');
    const db_pool = initDb('admin_users', null, is_dev);
    if (id) {
        const admin_user = await db_pool.query('SELECT * FROM admin_users WHERE id = $1', [id]);
        if (admin_user.rowCount == 1) {
            user_data = admin_user.rows[0];
            status = 200;
            success = true;
            msg = 'User found'
        }
    } else {
        const email = global.admin.username;
        const admin_user = await db_pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
        if (admin_user.rowCount == 1) {
            user_data = admin_user.rows[0];
            status = 200;
            success = true;
            msg = 'User found'
        }
    }
    db_pool.end(() => console.log('> Get Admin closed.'));
    return { status, success, msg, user_data };
};