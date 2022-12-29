
const ENV = process.env;
const getFields = require('./report_fields');
const getTemplates = require('../../../helpers/db_ops/data_templates');
const initDb = require('../../../helpers/db_ops/init_db');
const is_dev = ENV.USER != 'ubuntu' ? false : true;

function mergeDataFields(data_fields, src_tables, params = { field_ids, field_keys, template_fields }) {
    const required_data = (data_fields.ticket).map(ticket => new Object());
    const { field_ids, field_keys, template_fields } = params;
    field_ids.forEach(id => {
        if (template_fields[id - 1] === 'Tract Name') {
            required_data.forEach(data_set => data_set['Tract Name'] = data_fields.tract_name);
        } else {
            const target_field = template_fields[id - 1];
            const target_table = src_tables[target_field];
            const target_key = field_keys[target_field];
            if (!target_table || !target_key) {
                required_data.forEach(data_set => data_set[target_field] = null);
            } else {
                const src_data_set = data_fields[target_table];
                if (target_table !== 'product') {
                    required_data.forEach((data_set, i) => data_set[target_field] = src_data_set[i][target_key]);
                } else {
                    required_data.forEach((data_set, i) => {
                        const product_id = data_fields['load'][i]['product_id'];
                        data_set[target_field] = src_data_set[product_id][target_key];
                    });
                }
            }
        }
    });
    return required_data;
}

async function pullFromDb(pool, params = { tract_key: 0, product_ids: [] }) {
    const data_fields = {};
    const tract_results = await pool.query(`SELECT name FROM tract WHERE id = ${params.tract_key}`);
    const product_results = await pool.query(`SELECT * FROM product WHERE id IN (${params.product_ids.join()}) ORDER BY id`);
    const load_results = await pool.query(`SELECT * FROM load WHERE tract_key = ${params.tract_key} AND product_id IN (${params.product_ids.join()}) ORDER BY id`);

    const load_keys = (load_results.rows).map(row => row.id);
    const ticket_results = await pool.query(`SELECT * FROM ticket WHERE tract_key = ${params.tract_key} AND load_key IN (${load_keys.join()}) ORDER BY date`);
    const tract = tract_results.rows[0];
    const arranged_products = {};
    (product_results.rows).forEach(row => arranged_products[row.id] = row);
    Object.assign(data_fields, { load: load_results.rows, product: arranged_products, ticket: ticket_results.rows, tract_name: tract.name });
    return data_fields;
}

function processFields(data, allowed_fields = []) {
    let field_values = '';
    if (allowed_fields && allowed_fields.length > 0) {
        allowed_fields.forEach((field, i) => {
            if (i < allowed_fields.length - 1) {
                if (Array.isArray(data[field])) {
                    const field_arr = (data[field]).map((entry) => entry);
                    field_values = field_values.concat("'{", field_arr.join(','), "}',");
                }
                else field_values = field_values.concat("'", data[field], "', ");

            } else {
                if (Array.isArray(data[field])) {
                    const field_arr = (data[field]).map((entry) => entry);
                    field_values = field_values.concat("'{", field_arr.join(','), "}'");
                }
                else field_values = field_values.concat("'", data[field], "'");
            }
        })
    }
    return field_values;
}

function processSummary(data) {

}

function processTickets(ticket_data) {
    const ticket_ids = [];
    const ticket_urls = [];
    if (Array.isArray(ticket_data) && ticket_data.length > 0) {
        ticket_data.forEach(ticket => {
            ticket_ids.push(ticket.id);
            ticket_urls.push(ticket.image_url);
        });
    }
    return { ticket_ids, ticket_urls };
}

// **********************************
// Export Functions:
// **********************************

const archiveReport = async data => {
    const report_results = { success: false, msg: '' };
    try {
        const db_pool = initDb('report', null, is_dev);
        const new_report = await db_pool.query(`UPDATE reports SET status = 'archived' WHERE id = ${data.report_id} RETURNING *`);
        if (new_report.rowCount === 1) {
            report_results['success'] = true;
            report_results['msg'] = 'Report successully archived.';
        } else {
            report_results['msg'] = 'No record(s) exist(s).';
        }
    } catch (err) {
        console.log(err.message);
        report_results['msg'] = err.message;
    }
    return report_results;
};

const createReport = async (data, type) => {
    // default
    const report_results = { success: false, msg: '' };
    const allowed_fields = Object.keys(getTemplates('report'));
    if (type === 'Land Owner Settlement') {
        data['field_ids'] = (Object.keys(getFields('land_owner').template_fields)).map(key => parseInt(key) + 1);
    }
    const field_values = processFields(data, allowed_fields);

    try {
        const db_pool = initDb('report', null, is_dev);
        const new_report = await db_pool.query(`INSERT INTO reports (${allowed_fields.join()}) VALUES (${field_values}) ON CONFLICT DO NOTHING RETURNING *`);
        if (new_report.rowCount === 1) {
            report_results['success'] = true;
            report_results['msg'] = 'New report successully added.';
        } else {
            report_results['msg'] = 'Record(s) already exist(s). Possible conflict in database.';
        }
    } catch (err) {
        console.log(err.message);
        report_results['msg'] = err.message;
    }
    return report_results;
};

const editReport = async (data, type) => {
    const report_results = { success: false, msg: '' };
    const allowed_fields = Object.keys(getTemplates('report'));

    const dt = new Date().toUTCString();
    allowed_fields.push('edit_date');
    Object.assign(data, { edit_date: dt, status: 'active' });

    const field_values = processFields(data, allowed_fields);
    const report_id = data.report_id;

    try {
        const db_pool = initDb('report', null, is_dev);
        const edit_report = await db_pool.query(`UPDATE reports SET (${allowed_fields.join()}) = (${field_values}) WHERE id = ${report_id} RETURNING *`);
        if (edit_report.rowCount === 1) {
            report_results['success'] = true;
            report_results['msg'] = 'Report successully updated.';
        } else {
            report_results['msg'] = 'No such record(s) exist(s).';
        }
    } catch (err) {
        console.log(err.message);
        report_results['msg'] = err.message;
    }
    return report_results;
};

const extractReport = async tract_key => {
    const report_results = { data: [], success: false, msg: '' };
    const db_pool = initDb('load', null, is_dev);
    const report_query = `SELECT * FROM reports WHERE tract_key = ${tract_key} AND status = 'active'`;

    try {
        const report_db_results = await db_pool.query(report_query);
        if (report_db_results.rowCount > 0) {
            for (let i = 0; i < (report_db_results.rows).length; i++) {
                const report_type = report_db_results.rows[i].type === 'Land Owner Settlement' ? 'land_owner' : 'all';
                const { field_keys, template_fields, src_tables } = getFields(report_type);
                const { field_ids, product_ids } = report_db_results.rows[i];

                const data_fields = await pullFromDb(db_pool, { tract_key, field_ids, product_ids });
                const required_data = mergeDataFields(data_fields, src_tables, { field_ids, field_keys, template_fields });

                const { ticket_ids, ticket_urls } = processTickets(data_fields.ticket);
                report_db_results.rows[i]['ticket_ids'] = ticket_ids;
                report_db_results.rows[i]['ticket_urls'] = ticket_urls;

                Object.assign(report_db_results.rows[i], { field_data: required_data });
                (report_results.data).push(report_db_results.rows[i]);
            }
            report_results.success = true;
        } else {
            report_results['msg'] = 'No existing record(s).';
        }
    } catch (err) {
        console.log(err.message);
        report_results['msg'] = err.message;
    }
    db_pool.end(() => console.log('Report pool closed.'));
    return report_results;
};

const extractReports = async company_id => {
    const report_results = { data: [], success: false, msg: '' };
    const db_pool = initDb('load', null, is_dev);

    const report_query = `SELECT * FROM reports WHERE company_id = ${company_id} AND status = 'active'`;
    try {
        const report_db_results = await db_pool.query(report_query);
        if (report_db_results.rowCount > 0) {
            for (let i = 0; i < (report_db_results.rows).length; i++) {
                (report_results.data).push(report_db_results.rows[i]);
            }
            report_results.success = true;
        } else {
            report_results['msg'] = 'No existing record(s).';
        }
    } catch (err) {
        console.log(err.message);
        report_results['msg'] = err.message;
    }
    db_pool.end(() => console.log('Report pool closed.'));
    return report_results;
};

module.exports = { archiveReport, createReport, editReport, extractReport, extractReports };