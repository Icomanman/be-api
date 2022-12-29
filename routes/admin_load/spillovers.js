
const initDb = require('../../helpers/db_ops/init_db');

async function updateTractOpenLoads(data_update, pool) {
    const { tract_key, status } = data_update;
    let success = false;
    if (status !== 'open') {
        try {
            const load_results = await pool.query('SELECT open_loads FROM tract WHERE id = $1', [tract_key]);
            if (load_results.rowCount === 1) {
                const open_loads = load_results.rows[0].open_loads;
                console.log('> Tract open loads: ' + open_loads);
                let update_results = { rowCount: 0 };
                if (open_loads > 0) {
                    update_results = await pool.query('UPDATE tract SET open_loads = open_loads - 1 WHERE id = $1', [tract_key]);
                }
                if (update_results.rowCount === 1) success = true;
            }
        }
        catch (err) {
            console.log(err.message);
        }
    }
    return success;
}

const updateProductTractKey = async (data_update, pool) => {
    const { product_id, tract_key } = data_update;
    let success = false;
    try {
        const product_results = await pool.query(`UPDATE product SET tract_key = ${tract_key} WHERE id = ${product_id} RETURNING *`);
        if (product_results.rowCount == 1) {
            console.log(`> Product (${product_id}) tract_key (${tract_key}) updated from the edited load.`);
            success = true;
        } else {
            console.log(`ERR. Unable to update product ${product_id}`);
        }
    } catch (err) {
        console.log(err.message);
    }
    return success;
};

const updateTicketData = async (data_update, pool) => {
    const { ticket_key, ticket_no, tonnage } = data_update;
    let success = false;
    try {
        const ticket_results = await pool.query(`UPDATE ticket SET (number, tonnage) = (${ticket_no}, ${tonnage}) WHERE id = ${ticket_key} RETURNING *`);
        if (ticket_results.rowCount == 1) {
            console.log(`> Ticket ${ticket_key} updated from edited load.`);
            success = true;
        } else {
            console.log(`ERR. Unable to update ticket ${ticket_key}`);
        }
    } catch (err) {
        console.log(err.message);
    }
    return success;
};

const updateTractData = async (data_update, is_dev, pool) => {
    const { id, prev_status, status, tract_key, total_tonnage } = data_update;
    const updates = [`total = ${total_tonnage} WHERE id = ${tract_key} RETURNING *`];
    let success = false;
    const current_status_results = await pool.query('SELECT status FROM load WHERE id = $1', [id]);
    if (current_status_results.rowCount === 1 && current_status_results.rows[0].status !== prev_status) {
        if (status === 'open') updates.push(`open_loads = ((SELECT open_loads FROM tract WHERE id = ${tract_key}) + 1) WHERE id = ${tract_key} RETURNING *`);
        if (await updateTractOpenLoads(data_update, pool)) {
            console.log('Updated open loads from Tract ' + tract_key);
            success = true;
        }
    }
    const ExistingTract = initDb('tract', updates, is_dev);
    ExistingTract.update(tract_key);
    return success;
};

module.exports = { updateProductTractKey, updateTicketData, updateTractData };