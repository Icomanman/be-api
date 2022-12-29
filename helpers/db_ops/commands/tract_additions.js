
const path = require('path');
const { logToFile } = require('../../cognito');
const log_path = path.resolve(__dirname, '../logs');
const getTemplate = require('../data_templates');

// Supporting functions
/**
 * Adds consultant to the database
 * @param {Object} pool the postgres pool
 * @param {Object} consultant the consultant_name and consultant_type
 */
const addConsultant = async (pool, consultant_data) => {
    let consultant_id = 0;
    const allowed_keys = Object.keys(getTemplate('consultant'));
    let field_values = '';
    allowed_keys.forEach((field, i) => {
        if (i < allowed_keys.length - 1) {
            field_values = field_values.concat("'", consultant_data[field], "', ");
        } else {
            field_values = field_values.concat("'", consultant_data[field], "'");
        }
    });

    const dt = new Date();
    try {
        const consultant_results = await pool.query(`INSERT INTO consultant (${allowed_keys.join()}) VALUES (${field_values}) ON CONFLICT DO NOTHING RETURNING *`);
        if (consultant_results.rowCount == 1) {
            consultant_id = consultant_results.rows[0].id;
            console.log(`> SUCCESS. New Consultant added.`);
            logToFile('consultant.log', `\n> tract.js -> consultant: ${dt}\n(SUCCESS) ${consultant_data.consultant_name}\n`, log_path);
        }
    } catch (err) {
        const consultant_results = await pool.query(`SELECT * FROM consultant WHERE name = '${consultant_data.consultant_name}''`);
        if (consultant_results.rowCount == 1) {
            consultant_id = consultant_results.rows[0].id;
            console.log(`> WARNING. Consultant addition failed - already FOUND in database`);
        } else {
            console.log(`> ERR. Consultant addition failed - possible CONFLICT in database`);
            logToFile('consultant.log', `\n> tract.js -> consultant: ${dt}\n(FAILED - possible CONFLICT in database) ${consultant.consultant_type}: ${consultant.consultant_name}\n`, log_path);
        }
    }
    return consultant_id;
};

/**
 * Adds owner to the database
 * @param {Object} pool the postgres pool
 * @param {Object} owner the owner_name and owner_type
 */
const addOwner = async (pool, owner_data, owner_type) => {
    let owner_id = null;
    const owner_name = owner_type === 'business' ? owner_data.name : (owner_data.family_name).concat(', ', owner_data.given_name);
    const allowed_keys = owner_type === 'business' ?
        Object.keys(getTemplate('business_owner')) :
        Object.keys(getTemplate('individual_owner'));

    let field_values = '';
    allowed_keys.forEach((field, i) => {
        if (i < allowed_keys.length - 1) {
            field_values = field_values.concat("'", owner_data[field], "', ");
        } else {
            field_values = field_values.concat("'", owner_data[field], "'");
        }
    });
    const dt = new Date();
    try {
        const owner_results = await pool.query(`INSERT INTO ${owner_type}_owner (${allowed_keys.join()}) VALUES (${field_values}) ON CONFLICT DO NOTHING RETURNING *`);
        if (owner_results.rowCount == 1) {
            owner_id = owner_results.rows[0].id;
            console.log(`> SUCCESS. New ${owner_type} owner added.`);
            logToFile('owner.log', `\n> tract.js -> addOwner: ${dt}\n(SUCCESS) ${owner_type}: ${owner_name}\n`, log_path);
        }
    } catch (err) {
        const query_params = owner_type === 'business' ?
            `SELECT * FROM business_owner WHERE name = ${owner_name} AND email ${owner_data.email}` :
            `SELECT * FROM individual_owner WHERE given_name = ${owner_data.given_name} AND family_name = ${owner_data.family_name} AND email ${owner_data.email}`;
        const owner_results = await pool.query(query_params);
        if (owner_results.rowCount === 1) {
            owner_id = owner_results.rows[0].id;
            console.log(`> WARNING. Owner (${owner_type}) addition failed - already FOUND in database`);
        }
        else {
            console.log(`> ERR. Owner addition failed - possible CONFLICT in database`);
            logToFile('owner.log', `\n> tract.js -> addOwner: ${dt}\n(FAILED - possible CONFLICT in database) ${owner_type}: ${owner_name}\n`, log_path);
        }
    }
    return owner_id;
};

module.exports = { addConsultant, addOwner };