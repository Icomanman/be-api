
const getTemplate = require('../data_templates');

const updateConsultant = async (data, pool) => {
    let success = false;
    const { consultant, consultant_id } = data;

    const update_fields = Object.keys(getTemplate('consultant'));
    let update_values = '';
    update_fields.forEach((field, i) => {
        const trail = (i < update_fields.length - 1) ? "', " : "'";
        update_values = update_values.concat("'", consultant[field], trail);
    });

    try {
        const consultant_updates = await pool.query(`UPDATE consultant SET (${update_fields.join()}) = (${update_values}) WHERE id = ${consultant_id} RETURNING *`);
        if (consultant_updates.rowCount === 1) success = true;
    } catch (err) {
        console.log(err.message);
    }
    return success;
};

const updateOwner = async (data, pool) => {
    let success = false;
    const { owner, owner_id, owner_type } = data;
    const db_table = owner_type === 'business' ? 'business_owner' : 'individual_owner';

    const update_fields = Object.keys(getTemplate('individual_owner'));
    let update_values = '';
    update_fields.forEach((field, i) => {
        const trail = (i < update_fields.length - 1) ? "', " : "'";
        update_values = update_values.concat("'", owner[field], trail);
    });

    try {
        const owner_updates = await pool.query(`UPDATE ${db_table} SET (${update_fields.join()}) = (${update_values}) WHERE id = ${owner_id} RETURNING *`);
        if (owner_updates.rowCount === 1) success = true;
    } catch (err) {
        console.log(err.message);
    }
    return success;
};

module.exports = { updateConsultant, updateOwner };