const express = require('express');
const cors = require('cors');

const ENV = process.env;
const { body, validationResult } = require('express-validator');
const { adminGetUser } = require('../../helpers/admin');
const { updateProductTractKey, updateTicketData, updateTractData } = require('./spillovers');

const validations = () => {
    return [
        body('load_key').trim().isNumeric().withMessage('Invalid load_key (id)'),
        body('tract_key').trim().isNumeric().withMessage('Invalid tract key'),
        body('ticket_no').trim().isNumeric().withMessage('Invalid ticket number'),
        body('product_id').trim().isNumeric().withMessage('Invalid product_id'),
        body('driver').trim().isLength({ min: 2, max: 30 }).isAscii().withMessage('Invalid driver name'),
        body('tonnage').trim().isNumeric().withMessage('Tonnage should be a valid number.'),
        body('status').trim().custom(val => {
            if (!val.match(/applied|open/)) throw new Error('Status can only be open or applied.');
            return true;
        })
    ];
};

const editAdminLoad = async (req, res) => {
    const is_dev = ENV.USER != 'ubuntu' ? false : true;
    let status = 400;
    let success = false;
    let msg = '';
    const err_msg = validationResult(req)['errors'];
    if (err_msg.length > 0) {
        let messages = [];
        err_msg.forEach(err => { messages = messages.concat(err.msg) });
        msg = messages;
    } else {
        const initDb = require('../../helpers/db_ops/init_db');
        const db_pool = initDb('load', null, is_dev);

        const data = req.body;
        const allowed_keys = ['product_id', 'driver', 'tonnage', 'status'];
        const filtered_data = {};
        let load_updates = '';
        allowed_keys.forEach((field, i) => {
            filtered_data[field] = data[field];
            if (i < allowed_keys.length - 1) {
                load_updates = load_updates.concat("'", filtered_data[field], "', ");
            } else {
                load_updates = load_updates.concat("'", filtered_data[field], "'");
            }
        });

        try {
            const prev_status = await db_pool.query('SELECT status FROM load WHERE id = $1', [data.load_key]);
            const update_results = await db_pool.query(`UPDATE load SET (${allowed_keys.join()}) = (${load_updates}) WHERE id = ${data.load_key} RETURNING *`);
            if (update_results.rowCount === 1) {
                msg = `Load ${data.load_key} successfully updated.`;
                console.log(msg);
                const data_update = update_results.rows[0];
                Object.assign(data_update, { ticket_no: data.ticket_no, prev_status: prev_status.rows[0].status });

                // Update Ticket - number and tonnage
                const ticket_success = await updateTicketData(data_update, db_pool);

                // Update Tract from load changes - open_loads and total tonnage: (caveat, no additional checks if fails)
                const tonnage_results = await db_pool.query(`SELECT SUM(tonnage) FROM ticket WHERE id IN (SELECT ticket_key FROM load WHERE tract_key = ${data.tract_key})`);
                const total_tonnage = tonnage_results.rowCount === 1 ? tonnage_results.rows[0].sum : null;
                Object.assign(data_update, { total_tonnage });
                const tract_success = await updateTractData(data_update, is_dev, db_pool);

                // Update Product - tract_key
                // const product_success = await updateProductTractKey(data_update, db_pool);
                const product_success = true;
                if (ticket_success && total_tonnage && tract_success && product_success) {
                    status = 200;
                    success = true;
                }
            }
        } catch (err) {
            console.log(err.message);
            msg = err.message;
        }
        db_pool.end(() => console.log('> Admin edit load closed.'));
    }
    return { status, success, msg };
};

module.exports = function adminLoadRouteHandler(req, res) {
    const router = express.Router();
    router.use(cors());
    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    router.post('/edit', [validations(), adminGetUser], async (req, res) => {
        const ticket_results = await editAdminLoad(req, res);
        res.status(ticket_results.status).send({
            success: ticket_results.success,
            msg: ticket_results.msg
        });
    });

    router.use('*', (req, res) => { res.status(400).end('Bad edit ticket request.') });
    return router;
};