
const ENV = process.env;
const { validationResult } = require('express-validator');
const getTemplate = require('../../../helpers/db_ops/data_templates');
const sendInvite = require('./send_invite');

module.exports = async function (req, res) {
    const is_dev = ENV.USER != 'ubuntu' ? false : true;
    let status = 400;
    let success = false;
    let msg = '';
    const user_data = {};
    const err_msg = validationResult(req)['errors'];

    if (err_msg.length > 0) {
        let messages = [];
        err_msg.forEach(err => {
            messages = messages.concat(err.msg);
        });
        return { status, success: false, msg: messages };
    } else {
        const data = req.body;
        const default_data = getTemplate('invites');
        const allowed_fields = Object.keys(default_data);

        const filtered_data = {};
        let field_values = '';

        allowed_fields.forEach((key, i) => {
            filtered_data[key] = data[key];
            if (i < allowed_fields.length - 1) {
                field_values = field_values.concat("'", filtered_data[key], "', ");
            } else {
                field_values = field_values.concat("'", filtered_data[key], "'");
            }
        });

        const initDb = require('../../../helpers/db_ops/init_db');
        const db_pool = initDb('invitations', null, is_dev);

        try {
            const invite_results = await db_pool.query(`INSERT INTO invitations (${allowed_fields.join()}) VALUES(${field_values}) ON CONFLICT DO NOTHING RETURNING *`);
            if (invite_results.rowCount === 1) {
                Object.assign(user_data, invite_results.rows[0]);
                msg = 'User successfully added to the (pending) invites.';
                // send invite:
                const invite_id = invite_results.rows[0].id;
                const new_invite = await sendInvite(global.admin, filtered_data, invite_id);
                if (!new_invite.success) {
                    db_pool.query('DELETE FROM invitations WHERE email = $1', [user_data.email]);
                    throw new Error('User invitation failed: ' + user_data.email + ' (already exists)');
                }

                // Signup to Mobile too
                if (filtered_data.user_type === 'admin') {
                    const admin_mob_user = {};
                    Object.assign(admin_mob_user, filtered_data);
                    admin_mob_user['user_type'] = 'mobile';
                    admin_mob_user['send_msg'] = false;
                    const admin_mob_invite = await sendInvite(global.admin, admin_mob_user);
                    if (!admin_mob_invite.success) {
                        throw new Error('User (admin-mobile) invitation failed: ' + user_data.email + ' (already exists)');
                    }
                }
                status = 200;
                success = true;
            } else {
                msg = 'User invitation already exists.';
            }
        } catch (err) {
            console.log(err.message);
            msg = err.message;
        }

        db_pool.end(() => { console.log('> Invitation pool closed.') });
        return { status, success, msg }
    }
};