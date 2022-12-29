const path = require('path');
const { logToFile } = require('../../cognito');
const log_path = path.resolve(__dirname, '../logs');
const getTemplate = require('../data_templates');
const { addOwner, addConsultant } = require('./tract_additions');
const { updateOwner, updateConsultant } = require('./tract_edit_updates');

/*********************************************************
 ************ Tract-Product Support Functions ************
 *********************************************************/

/**
* @param {Object} pool the database pool
* @returns {Object} the consultant data object
*/
const getConsultants = async pool => {
    let consultants = [];
    try {
        const results = await pool.query('SELECT * FROM consultant ORDER BY id');
        (results.rows).forEach(row => consultants[row.id] = row);
    } catch (err) {
        console.log(err.message);
    }
    return consultants;
};

/**
 * @param {String} type the owner type: business or individual
 * @param {Object} pool the database pool
 * @returns {Object} the owner data object
 */
const getOwners = async (type, pool) => {
    const owners = {};
    const query = type === 'business' ?
        'SELECT * FROM business_owner ORDER BY id' :
        'SELECT * FROM individual_owner ORDER BY id';
    try {
        const results = await pool.query(query);
        (results.rows).forEach(row => owners[row.id] = row);
    } catch (err) {
        console.log(err.message);
    }
    return owners;
};

/**
 * Extracts the products from the database to be combined with the extracted tract data
 * @param {Object} pool the database pool
 * @param {Array} company_id the company_id that owns the products
 */
const getProducts = async (pool, company_id) => {
    let products = [];
    try {
        const results = await pool.query(
            `SELECT * FROM product WHERE id IN (SELECT UNNEST(product_ids) FROM company WHERE id = ${parseInt(
                company_id
            )})`
        );
        products = products.concat(results.rows);
    } catch (err) {
        console.log('invalid product ids\n' + err.message);
    }
    return products;
};

/**
 * Processes the GET tract response to include the products that belong to respective tracts
 * @param {Array} tracts
 * @param {Array} consultants
 * @returns {Array} processed tracts; could be an empty array
 */
const mergeConsultantsToTracts = (tracts, consultants) => {
    let processed_tracts = [];
    tracts.forEach((tract) => {
        const tract_consultant = consultants[tract.consultant_id];
        tract['consultant'] = tract_consultant;
        processed_tracts.push(tract);
    });
    return processed_tracts;
};

/**
 * Processes the GET tract response to include the products that belong to respective tracts
 * @param {Array} tracts
 * @param {Array} products
 * @returns {Array} processed tracts; could be an empty array
 */
const mergeProductsToTracts = (tracts, products) => {
    let processed_tracts = [];
    tracts.forEach((tract) => {
        tract['products'] = [];
        if (tract.product_ids && tract.product_ids.length > 0) {
            products.forEach((product) => {
                if (tract.product_ids.indexOf(product.id) >= 0)
                    tract['products'].push(product);
            });
        }
        processed_tracts.push(tract);
    });
    return processed_tracts;
};

/**
 * Processes the GET tract response to include the products that belong to respective tracts
 * @param {Array} tracts
 * @param {Array} business_owners
 * @param {Array} individual_owners
 * @returns {Array} processed tracts; could be an empty array
 */
const mergeOwnersToTracts = (tracts, business_owners, individual_owners) => {
    let processed_tracts = [];
    tracts.forEach((tract) => {
        const tract_owner = tract.owner_type === 'business' ? business_owners[tract.owner_id] : individual_owners[tract.owner_id];
        tract['owner'] = tract_owner;
        processed_tracts.push(tract);
    });
    return processed_tracts;
};
// *******************************************************

// export functions to be used as Tract Methods
/**
 * A method to be attached to a Tract instance
 * @returns {Object} { status, success, msg }
 */
async function createTract() {
    const TRACT = this.dat;
    if (!TRACT) return { status: 400, success: false, msg: `Invalid tract input` };

    // *****************************************************************************************
    // Add the owner
    const owner_id = await addOwner(this.pool, TRACT.owner, TRACT.owner_type);
    if (!owner_id) return { status: 400, success: false, msg: `Owner already exists.` };
    // Add the consultant, if any
    let consultant_id = 0;
    if (TRACT.with_consultant === true || TRACT.with_consultant === 'true') {
        consultant_id = await addConsultant(this.pool, TRACT.consultant);
        if (!consultant_id) return { status: 400, success: false, msg: `Consultant already exists.` };
    }
    // *****************************************************************************************
    const tract_template = getTemplate('tract_default');
    delete tract_template.owner;
    delete tract_template.consultant;
    delete tract_template.id;
    const filtered_data = {};
    const tract_fields = Object.keys(tract_template);
    tract_fields.push('tract_id');
    Object.assign(TRACT, { owner_id, consultant_id, tract_id: TRACT.id })

    let field_values = '';
    tract_fields.forEach((field, i) => {
        filtered_data[field] = TRACT[field];
        if (Array.isArray(filtered_data[field])) {
            const field_arr = (filtered_data[field]).map((entry) => entry);
            field_values = field_values.concat("'{", field_arr.join(','), "}',");
        } else {
            if (i < tract_fields.length - 1) {
                field_values = field_values.concat("'", filtered_data[field], "', ");
            } else {
                field_values = field_values.concat("'", filtered_data[field], "'");
            }
        }
    });

    return await new Promise((resolve) => {
        this.pool.query(`INSERT INTO tract(${tract_fields.join()}) VALUES(${field_values}) ON CONFLICT DO NOTHING`,
            (err, results) => {
                const dt = new Date();
                if (err) {
                    console.log(`> ERR.${err} `);
                    this.pool.end(() => console.log('> New tract closed.'));
                    logToFile('contact.log', `\n > tract.js -> createTract: ${dt} \n(Tract addition FAILED) ${TRACT.name}: ${TRACT.id} \n${err.code} > ${err} \n`, log_path);
                    return resolve({
                        status: 400,
                        success: false,
                        msg: `Invalid tract.${err.code} `,
                    });
                } else if (results.rowCount == 1) {
                    console.log('> SUCCESS: Project Tract added.');
                    this.pool.end(() => console.log('> New tract closed.'));
                    logToFile('contact.log', `\n > tract.js -> createTract: ${dt} \n(SUCCESS) ${TRACT.name}: ${TRACT.id} \n`, log_path);
                    return resolve({
                        status: 200,
                        success: true,
                        msg: 'Project successfully added.',
                    });
                } else {
                    console.log('ERR. Tract addition failed - possible CONFLICT in database');
                    this.pool.end(() => console.log('> New tract closed.'));
                    logToFile('contact.log', `\n > tract.js -> createTract: ${dt} \n(FAILED - possible CONFLICT in database) ${TRACT.name}: ${TRACT.id} \n`, log_path);
                    return resolve({
                        status: 500,
                        success: false,
                        msg: 'Record already exists',
                    });
                }
            }
        );
    });
}

async function getTract() {
    const { user_id, is_mobile } = this.dat;
    // const compound_query = `SELECT tract.*, array_agg(product.*) AS products FROM tract RIGHT OUTER JOIN product ON product.id = ANY('{1,3}') WHERE tract.id = ${user_id} GROUP BY tract.id;`
    let command_query = user_id ?
        `SELECT * FROM tract WHERE ${user_id} = ANY(company_ids) ORDER BY id;`
        : 'SELECT * FROM tract ORDER BY id;';

    let join_query = user_id ?
        `SELECT *, * FROM tract RIGHT OUTER JOIN consultant ON tract.consultant_id = consultant.id WHERE ${user_id} = ANY(company_ids) ORDER BY tract.id;`
        : 'SELECT *, * FROM tract RIGHT OUTER JOIN consultant ON tract.consultant_id = consultant.id ORDER BY tract.id;';

    if (is_mobile) command_query = `SELECT * FROM tract WHERE ${user_id} = ANY(company_ids) AND NOT status = 'draft'`;

    // Pull the owners:
    const business_owners = await getOwners('business', this.pool);
    const individual_owners = await getOwners('individual', this.pool);
    // Pull the consultant, if any
    const consultants = await getConsultants(this.pool);
    // Pull the products, if any
    const products = await getProducts(this.pool, user_id);

    return await new Promise((resolve) => {
        this.pool.query(command_query, (err, results) => {
            if (err) {
                console.log(`> ERR.${err} `);
                this.pool.end(() => console.log('> Tract closed.'));
                return resolve({ status: 400, success: false, msg: `Invalid tract.${err.code}`, tract_dat: {} });
            } else if (results.rowCount > 0) {
                let processed_tracts = mergeProductsToTracts(results.rows, products);
                processed_tracts = mergeOwnersToTracts(processed_tracts, business_owners, individual_owners);
                processed_tracts = mergeConsultantsToTracts(processed_tracts, consultants);
                console.log('> SUCCESS: Tract successfully extracted.');
                this.pool.end(() => console.log('> Tract closed.'));
                return resolve({ status: 200, success: true, msg: 'Tract successfully extracted.', tract_dat: processed_tracts });
            } else {
                console.log('ERR. Tract extraction failed - possible empty database');
                this.pool.end(() => console.log('> Tract closed.'));
                return resolve({ status: 500, success: false, msg: 'Record(s) not found', tract_dat: {} });
            }
        });
    });
}

async function updateTract(tract_key = null) {
    const updates = this.dat;
    if (!updates) return updates;
    try {
        if (Array.isArray(updates)) {
            let update_results = { rowCount: 0 };
            updates.forEach((update) => {
                update_results = this.pool.query(`UPDATE tract SET ${update}`);
            });
            if (update_results.rowCount > 0)
                console.log(`> Tract successfully updated (${tract_key})`);
        } else {
            const update_results = await this.pool.query(
                `UPDATE tract SET ${updates}`
            );
            if (update_results.rowCount == 1)
                console.log(`> Tract successfully updated (${tract_key})`);
        }
        this.pool.end(() => {
            console.log('> Update tract pool closed.');
        });
    } catch (err) {
        console.log(`> ${err.message}`);
    }
}

async function editTract(tract_key = null) {
    const updates = this.dat;
    let success = false;
    let status = 400;
    let msg = 'Edit tract failed.';
    if (!updates || !tract_key) return { status, success, msg };

    if (!updates.with_consultant) {
        updates.with_consultant = false;
        var with_consultant = false;
    }
    const update_fields = Object.keys(updates);
    const filtered_fields = update_fields.filter(field => field !== 'owner' && field !== 'consultant' && field !== 'id' && field !== undefined);

    if (Object.hasOwnProperty('id')) filtered_fields.push('tract_id');
    Object.assign(updates, { tract_id: updates.id })
    let update_values = '';
    filtered_fields.forEach((field, i) => {
        const trail = (i < filtered_fields.length - 1) ? "', " : "'";
        // Array Types
        if (Array.isArray(updates[field])) {
            const field_arr = (updates[field]).map((entry) => entry);
            update_values = update_values.concat("'{", field_arr.join(), "}',");
        }
        // String (value) Types:
        else update_values = update_values.concat("'", updates[field], trail);
    });

    const update_query = filtered_fields.length > 1 ?
        `UPDATE tract SET (${filtered_fields.join()}) = (${update_values}) WHERE id = ${tract_key} RETURNING *` :
        `UPDATE tract SET ${filtered_fields.join()} = ${update_values} WHERE id = ${tract_key} RETURNING *`

    try {
        const update_results = await this.pool.query(update_query);
        let trailing_msg = '';
        if (update_results.rowCount == 1) {
            // Update secondary tables, if needed:
            // Owner
            if (updates.hasOwnProperty('owner') && updates.hasOwnProperty('owner_id') && updates.hasOwnProperty('owner_type')) {
                const { owner, owner_id, owner_type } = updates;
                const update_success = await updateOwner({ owner, owner_id, owner_type }, this.pool);
                if (!update_success) throw new Error('> ERR. Unable to update owner data.');
            }
            // Consultant
            if (updates.hasOwnProperty('consultant') && updates.hasOwnProperty('with_consultant') && (updates.with_consultant === true || updates.with_consultant === 'true')) {
                if (updates.hasOwnProperty('consultant_id')) {
                    const { with_consultant, consultant, consultant_id } = updates;
                    const update_success = await updateConsultant({ with_consultant, consultant, consultant_id }, this.pool);
                    if (!update_success) throw new Error('> ERR. Unable to update consultant data.');
                } else {
                    // Add consultant via edit:
                    var addition_from_edit = true;
                    var consultant_id = await addConsultant(this.pool, updates.consultant);
                }
            } else if (updates.consultant_id && (with_consultant === false || with_consultant === 'false')) {
                // Remove consultant
                const fired_consultant = await this.pool.query('SELECT consultant_id FROM tract WHERE id = $1', [tract_key]);
                if (fired_consultant.rowCount === 1 && fired_consultant.rows[0].id) {
                    await this.pool.query('DELETE FROM consultant WHERE id = $1', [fired_consultant.rows[0].id]);
                    await this.pool.query('UPDATE tract SET consultant_id = NULL WHERE id = $1 RETURNING consultant_id', [tract_key])
                    trailing_msg = ` (WARNING: consultant (${fired_consultant.rows[0].id}) has been removed.)`;
                }
                else trailing_msg = ' (WARNING: unable to update owner or consultant; has incomplete data.)';
            }
            msg = 'Tract successfully updated: ' + tract_key + trailing_msg;
            success = true;
            status = 200;
            console.log(msg);
        }
    } catch (err) {
        msg = err.message
        console.log(msg);
    }

    if (consultant_id && addition_from_edit) {
        // update tract: from line 315
        const results = await this.pool.query('UPDATE tract SET consultant_id = $1 WHERE id = $2', [consultant_id, tract_key]);
        if (results.rowCount !== 1) console.log(`> ERR. Unable to add consultant data: ${consultant_id} (${addition_from_edit})`);
    }

    this.pool.end(() => { console.log('> Update tract pool closed.') });
    return { status, success, msg };
}

module.exports = { createTract, editTract, getTract, updateTract };
