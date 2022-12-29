
const ENV = process.env;
const getTemplate = require('../../../helpers/db_ops/data_templates');
const { validationResult } = require('express-validator');
const { addToUserPool } = require('./user_pool');

const updateCompany = async (pool, user_data) => {
    const { company_id, user_key } = user_data;
    try {
        if (!company_id || !user_key) throw new Error('> Undefined user or company id.');
        await pool.query('UPDATE company SET admin_users =  array_append(admin_users, $1) WHERE id = $2 AND NOT $1 = ANY(SELECT UNNEST(admin_users)) RETURNING *', [user_key, company_id])
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
        const data = req.body;
        // Cognito User Pool
        const cognito_user = await addToUserPool(data);
        if (!cognito_user.success) return { status, success: false, msg: cognito_user.msg };

        const default_data = getTemplate('admin_users');
        const allowed_fields = Object.keys(default_data);
        allowed_fields.shift();
        let user_data = null;
        let msg = [];

        const allowed_data = {};
        allowed_fields.forEach(key => {
            allowed_data[key] = data[key];
        });

        const initDb = require('../../../helpers/db_ops/init_db');
        const db_pool = initDb('admin_users', null, is_dev);

        try {
            const company_data = await db_pool.query('INSERT INTO company (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING *', [allowed_data.company]);
            if (company_data.rowCount == 1) {
                const company_id = company_data.rows[0].id;
                allowed_data['company_id'] = company_id;
                let field_values = '';
                allowed_fields.forEach((field, i) => {
                    if (i < allowed_fields.length - 1) {
                        field_values = field_values.concat("'", allowed_data[field], "', ");
                    } else {
                        field_values = field_values.concat("'", allowed_data[field], "'");
                    }
                });
                const user_results = await db_pool.query(`INSERT INTO admin_users (${allowed_fields}) VALUES (${field_values}) ON CONFLICT DO NOTHING RETURNING *`);
                if (user_results.rowCount == 1) {
                    user_data = user_results.rows[0];
                    status = 200;
                    success = true;
                    msg = 'Company user successfully created';
                    Object.assign(user_data, { user_key: user_results.rows[0].id });
                }
            } else {
                console.log('ERR. (Create) Record already exists.');
                msg = 'Record already exists.';
            }
        } catch (err) {
            console.log(err.message);
            msg = err.message;
        }
        // add the admin user to the company:
        if (status == 200 && user_data) await updateCompany(db_pool, user_data);
        db_pool.end(() => console.log('> Company user closed.'));
        return { status, success, msg, user_data };
    }
};