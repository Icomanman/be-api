
const ENV = process.env;
const getTemplate = require('../../../helpers/db_ops/data_templates');
const { validationResult } = require('express-validator');
const { addToUserPool } = require('./user_pool');

const addToCompany = async (pool, user_data, db_table) => {
    const { company_id, id } = user_data;
    try {
        if (!company_id || !id) throw new Error('> Undefined user or company id.');
        await pool.query(`UPDATE company SET ${db_table} =  array_append(${db_table}, $1) WHERE id = $2 AND NOT $1 = ANY(SELECT UNNEST(${db_table})) RETURNING *`, [id, company_id])
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
        let request = req.path === '/new' ? 'new' : 'modify';
        let user_action = 'Create';
        const data = req.body;
        const db_table = data.user_type === 'admin' ? 'admin_users' : 'mobile_users';

        // Cognito User Pool
        const cognito_user = await addToUserPool(data, request);
        if (!cognito_user.success) return { status, success: false, msg: cognito_user.msg };

        const default_data = getTemplate(db_table);
        if (request === 'new') delete default_data['id'];
        const allowed_fields = Object.keys(default_data);
        let user_data = null;
        let msg = [];

        const filtered_data = {};
        allowed_fields.forEach(key => {
            filtered_data[key] = data[key];
        });

        const initDb = require('../../../helpers/db_ops/init_db');
        const db_pool = initDb(db_table, null, is_dev);

        let field_values = '';
        allowed_fields.forEach((field, i) => {
            if (i < allowed_fields.length - 1) {
                field_values = field_values.concat("'", filtered_data[field], "', ");
            } else {
                field_values = field_values.concat("'", filtered_data[field], "'");
            }
        });

        const query = request === 'new' ?
            `INSERT INTO ${db_table} (${allowed_fields.join()}) VALUES(${field_values}) ON CONFLICT DO NOTHING RETURNING *`
            :
            `UPDATE ${db_table} SET (${allowed_fields.join()}) = (${field_values}) WHERE id = ${filtered_data.id} RETURNING *`;

        try {
            if (request === 'modify') {
                const check_db = await db_pool.query(`SELECT * FROM ${db_table} WHERE id = ${filtered_data.id}`);
                user_action = 'Update';
                if (check_db.rowCount != 1) throw new Error(`(${user_action}) User does not exist.`);
            }
            const user_results = await db_pool.query(query);
            if (user_results.rowCount == 1) {
                user_data = user_results.rows[0];
                status = 200;
                success = true;
                msg = `User (${db_table}) successfully ${request == 'new' ? 'created' : 'updated'}`;
            } else {
                console.log(`ERR. (${user_action}) Record already exists.`);
                msg = 'Record already exists.';
            }
        } catch (err) {
            console.log(err.message);
            msg = err.message;
        };
        // add the admin user to the company:
        if (status == 200 && user_data) await addToCompany(db_pool, user_data, db_table);
        db_pool.end(() => console.log(`> ${user_action} user closed.`))
        return { status, success, msg, user_data };
    }
};