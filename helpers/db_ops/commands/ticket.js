
const initDb = require('./../init_db');

const updateLoadStatus = async (load_key, db_pool) => {
    try {
        const load_results = await db_pool.query(`UPDATE load SET status = 'applied' WHERE id = ${load_key} RETURNING *`);
        if (load_results.rowCount == 1) {
            console.log(`> Load ${load_key} is now CLOSED.`);
        } else {
            console.log(`ERR. Unable to update load ${load_key}`);
        }
    } catch (err) {
        console.log(err.message);
    }
};

const updateLoadDate = async (load_key, closed_date, db_pool) => {
    try {
        const load_results = await db_pool.query(`UPDATE load SET closed_date = '${closed_date}' WHERE id = ${load_key} RETURNING *`);
        if (load_results.rowCount == 1) {
            console.log(`> Load ${load_key} has now a CLOSED date.`);
        } else {
            console.log(`ERR. Unable to update load ${load_key}`);
        }
    } catch (err) {
        console.log(err.message);
    }
};

const updateLoadImageURL = async (load_key, image_url, db_pool) => {
    try {
        const load_results = await db_pool.query(`UPDATE load SET image_url = '${image_url}' WHERE id = ${load_key} RETURNING *`);
        if (load_results.rowCount == 1) {
            console.log(`> Load ${load_key} has now the image data.`);
        } else {
            console.log(`ERR. Unable to update load ${load_key}`);
        }
    } catch (err) {
        console.log(err.message);
    }
};

const updateLoadTicket = async (load_key, ticket_key, db_pool) => {
    try {
        const load_results = await db_pool.query(`UPDATE load SET ticket_key = ${ticket_key} WHERE id = ${load_key} RETURNING *`);
        if (load_results.rowCount == 1) {
            console.log(`> Load ${load_key} has now the tonnage data.`);
        } else {
            console.log(`ERR. Unable to update load ${load_key}`);
        }
    } catch (err) {
        console.log(err.message);
    }
};

const updateLoadTonnage = async (load_key, tonnage, db_pool) => {
    try {
        const load_results = await db_pool.query(`UPDATE load SET tonnage = ${tonnage} WHERE id = ${load_key} RETURNING *`);
        if (load_results.rowCount == 1) {
            console.log(`> Load ${load_key} has now an attached ticket.`);
        } else {
            console.log(`ERR. Unable to update load ${load_key}`);
        }
    } catch (err) {
        console.log(err.message);
    }
    db_pool.end(() => { console.log('> Load (from ticket) ticket pool closed') });
};

const updateTractOpenLoads = data_update => {
    const { tract_key } = data_update;
    return `open_loads = ((SELECT open_loads FROM tract WHERE id = ${tract_key}) - 1) WHERE id = ${tract_key} RETURNING *`;
};

const updateTractTotalTonnage = data_update => {
    const { tonnage, tract_key } = data_update;
    return `total = (SELECT total FROM tract WHERE id = ${tract_key}) + ${tonnage} WHERE id = ${tract_key} RETURNING *`;
};

const pushTractUpdates = (data_update, is_dev) => {
    const updates = [];
    updates.push(updateTractOpenLoads(data_update), updateTractTotalTonnage(data_update));
    const ExistingTract = initDb('tract', updates, is_dev);
    ExistingTract.update(data_update.tract_key);
}

async function pushTicket(ticket_data = null, is_dev = false) {
    let status = 400;
    let ticket_key, msg, success = false;

    if (ticket_data) {
        const db_pool = initDb('ticket', ticket_data, is_dev);
        const ticket_fields = Object.keys(ticket_data);
        delete ticket_fields['closed_date']
        let ticket_values = '';
        ticket_fields.forEach((field, i) => {
            if (i < ticket_fields.length - 1) {
                ticket_values = ticket_values.concat("'", ticket_data[field], "', ");
            } else {
                ticket_values = ticket_values.concat("'", ticket_data[field], "'");
            }
        });
        try {
            const ticket_results = await db_pool.query(`INSERT INTO ticket (${ticket_fields.join()}) VALUES(${ticket_values}) ON CONFLICT DO NOTHING RETURNING *`);
            if (ticket_results.rowCount == 1) {
                const dat = ticket_results.rows[0];
                ticket_key = ticket_results.rows[0].id;
                const load_pool = initDb('load', null, is_dev);

                pushTractUpdates(ticket_data, is_dev);

                updateLoadStatus(dat.load_key, load_pool);
                updateLoadDate(dat.load_key, ticket_data.date, load_pool);
                updateLoadTicket(dat.load_key, ticket_key, load_pool);
                updateLoadTonnage(dat.load_key, ticket_data.tonnage, load_pool);
                // image URL: 24 June 2022
                if (ticket_data.file_name) {
                    const s3_bucket = 'https://spruce-tickets.s3.us-west-2.amazonaws.com/';
                    const image_url = s3_bucket + ticket_data.file_name;
                    db_pool.query('UPDATE ticket SET image_url = $1 WHERE id = $2', [image_url, ticket_key]);
                    updateLoadImageURL(dat.load_key, image_url, load_pool);
                }
                status = 200;
                success = true;
                msg = `Ticket successfully created - Load: ${dat.load_key}, Number: ${dat.number}, Tonnage: ${dat.tonnage}`;
                (function waitLoadPool(pool) {
                    if (pool.totalCount > 0) { setTimeout(() => waitLoadPool(pool), 100) }
                    pool.end(() => { console.log('> Load (from ticket) status pool closed') });
                })(load_pool);
            } else {
                console.log('ERR. (Ticket) Record already exists.');
                const ticket_results = await db_pool.query(`SELECT * FROM ticket WHERE load_key = '${ticket_data.load_key}'`);
                msg = 'Record already exists.';
                ticket_key = ticket_results.rows == 1 ? ticket_results.rows[0].id : null;
            }
        } catch (err) {
            console.log(err.message);
            msg = 'No matching load to apply ticket to.';
        }
        db_pool.end(() => { console.log('> Apply ticket pool closed') });
    }
    return { status, success, msg, ticket_key };
}

module.exports = {
    pushTicket
}