
const initDb = require('../init_db');
// const { logToFile } = require('../../../helpers/cognito');
// const log_path = '../logs';

const updateTractLoads = (data_update, is_dev) => {
    const { id, tract_key } = data_update;
    let updates = [
        `load_ids = array_append(load_ids, ${id}) WHERE id = ${tract_key} AND NOT ${id} = ANY(SELECT UNNEST(load_ids)) RETURNING *`,
        `open_loads = ((SELECT open_loads FROM tract WHERE id = ${tract_key}) + 1) WHERE id = ${tract_key} RETURNING *`
    ];
    const ExistingTract = initDb('tract', updates, is_dev);
    ExistingTract.update(tract_key);
};

const updateTractStatus = async (tract_key, is_dev) => {
    const update = `status = 'active' WHERE id = ${tract_key} AND status = 'draft' RETURNING *`;
    const ExistingTract = initDb('tract', update, is_dev);
    ExistingTract.update(tract_key);
};

async function getLoads(load_params, is_dev) {
    const { tract_key, product_id } = load_params;
    let status = 400;
    let list, msg, success = false;
    const db_pool = initDb('load', tract_key, is_dev);
    const tract_query = `SELECT * FROM load WHERE tract_key = ${tract_key} ORDER BY open_date`;
    const product_query = `SELECT * FROM load WHERE product_id = ${product_id} ORDER BY open_date`;
    let command_query = tract_query;
    if (product_id && !tract_key) command_query = product_query;

    try {
        const loads = await db_pool.query(command_query);
        if (loads.rowCount > 0) {
            const dt = new Date;
            list = loads.rows;
            status = 200;
            success = true;
            msg = `Load(s) successfully extracted from tract ${tract_key}`;
        } else throw new Error('> Possible empty load database.');
    } catch (err) {
        console.log(err.message);
        list = [];
        msg = 'Load extration failed. Possible empty load database.';
    };
    db_pool.end(() => { console.log('> List load pool closed') });
    return { status, success, msg, list };
};

async function pushLoad(data = null, is_dev = false) {
    let status = 400;
    let load_key, msg, success = false;
    if (data) {
        const db_pool = initDb('load', data, is_dev);

        delete data['closed_date'];
        delete data['ticket_key'];

        const required_fields = Object.keys(data);
        let field_values = '';
        required_fields.forEach((field, i) => {
            if (i < required_fields.length - 1) {
                field_values = field_values.concat("'", data[field], "', ");
            } else {
                field_values = field_values.concat("'", data[field], "'");
            }
        });

        try {
            const load_results = await db_pool.query(`INSERT INTO load (${required_fields.join()}) VALUES(${field_values}) ON CONFLICT DO NOTHING RETURNING *`);
            if (load_results.rowCount == 1) {
                const dat = load_results.rows[0];
                status = 200;
                success = true;
                msg = `Load successfully created - Tract: ${dat.tract_key}, Species: ${dat.species_id}, Truck: ${dat.trucking_co}, Driver: ${dat.driver}`;
                load_key = load_results.rows[0].id;
                updateTractLoads(dat, is_dev);
                updateTractStatus(dat.tract_key, is_dev);
            } else {
                console.log('ERR. (Create) Record already exists.');
                const load_results = await db_pool.query(`SELECT * FROM load WHERE tract_key = '${data.tract_key}' AND species_id = '${data.species_id}' AND driver = '${data.driver}' AND trucking_co = '${data.trucking_co}'`);
                msg = 'Record already exists.';
                load_key = load_results.rows[0].id;
            }
        } catch (err) {
            console.log(err.message);
            msg = 'No matching tract or species';
        }
        db_pool.end(() => { console.log('> Create load pool closed') });
    }
    return { status, success, msg, load_key };
};

async function updateLoad(data = null, is_dev = false) {
    let status = 400;
    let load_key, msg, success = false;
    if (data) {
        const db_pool = initDb('load', data, is_dev);

        delete data['closed_date'];
        delete data['open_date'];
        delete data['ticket_key'];

        const columns = Object.keys(data);
        let col_values = '';
        columns.forEach((col, i) => {
            if (i < columns.length - 1 && col != 'load_key') {
                col_values = col_values.concat(col, " = '", data[col], "', ");
            } else if (col != 'load_key') {
                col_values = col_values.concat(col, " = '", data[col], "'");
            }
        });
        try {
            const load_results = await db_pool.query(`UPDATE load SET ${col_values} WHERE tract_key = ${data.tract_key} AND id = ${data.load_key} RETURNING *`);
            if (load_results.rowCount == 1) {
                const dat = load_results.rows[0];
                status = 200;
                success = true;
                msg = `Load successfully updated - Tract: ${dat.tract_key}, Species: ${dat.species_id}, Truck: ${dat.trucking_co}, Driver: ${dat.driver}`;
                load_key = load_results.rows[0].id;
            } else {
                msg = 'Record does not exists.'
            }
        } catch (err) {
            // console.log(err.message);
            if (err.code == 23505) {
                console.log('ERR. (Update) Record already exists.');
                const load_results = await db_pool.query(`SELECT * FROM load WHERE tract_key = '${data.tract_key}' AND species_id = '${data.species_id}' AND driver = '${data.driver}' AND trucking_co = '${data.trucking_co}'`);
                load_key = load_results.rows[0].id;
                msg = 'Record already exists.';
            } else msg = 'No matching tract or species';
        }
        db_pool.end(() => { console.log('> Modify load pool closed') });
    }
    return { status, success, msg, load_key };
};

module.exports = { getLoads, pushLoad, updateLoad };
