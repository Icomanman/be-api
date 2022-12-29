const path = require("path");
const { logToFile } = require("../../cognito");
const log_path = path.resolve(__dirname, "../logs");

/**
 * Support Function for addToMills
 * @param {String} src_txt the mill name from the UI input
 */
const compareDbValues = async (db_pool, name) => {
    let is_equal = false;
    const query = 'SELECT UPPER(name) FROM mills';
    const results = await db_pool.query(query);
    if (results.rowCount > 0) {
        const db_names = results.rows;
        db_names.forEach(db_name => { if (name.toUpperCase() === db_name.upper) is_equal = true });
    }
    return is_equal;
};

const addToCompany = async (db_pool, product_id, company_id) => {
    try {
        const update_results = await db_pool.query(
            `UPDATE company SET product_ids = array_append(product_ids, ${product_id}) WHERE id = ${company_id} RETURNING *`
        );
        if (update_results.rowCount == 1)
            console.log(`> Company successfully updated (${company_id})`);
    } catch (err) {
        console.log(`> ${err.message}`);
    }
};

const addToMills = async (db_pool, name, company_id) => {
    if (compareDbValues(db_pool, name)) {
        try {
            const update_results = await db_pool.query('INSERT INTO mills (name, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [name, company_id]);
            if (update_results.rowCount == 1)
                console.log('> Mill location successfully added.');
        } catch (err) {
            console.log(`> ${err.message}`);
            console.log('Unable to add mill; already exists.');
        }
    } else {
        console.log('> WARNING: Unable to add mill; already exists.');
    }
};

const addToSpecies = async (db_pool, name, company_id) => {
    try {
        const species_results = await db_pool.query('INSERT INTO species (name, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [name, company_id]);
        if (species_results.rowCount == 1)
            console.log('> Species type successfully added.');
    } catch (err) {
        console.log(`> ${err.message}`);
        console.log('Unable to add species type; already exists.');
    }
};

const addToTract = async (db_pool, product_id, tract_id) => {
    try {
        const update_results = await db_pool.query(
            `UPDATE tract SET product_ids = array_append(product_ids, ${product_id}) WHERE id = ${tract_id} RETURNING *`
        );
        if (update_results.rowCount == 1)
            console.log(`> Tract successfully updated (${tract_id})`);
    } catch (err) {
        console.log(`> ${err.message}`);
    }
};

const updateTractStatus = async (db_pool, tract_key) => {
    const update_query = `UPDATE tract SET status = 'active' WHERE id = ${tract_key} AND status = 'draft' RETURNING *`;
    try {
        const update_results = await db_pool.query(update_query);
        if (update_results.rowCount == 1)
            console.log(`> Tract status set to 'active' (${tract_key})`);
    } catch (err) {
        console.log(`> ${err.message}`);
    }
};

const processDbFields = (data, allowed_fields) => {
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
};

const processName = (raw_name = '') => {
    const capitalize = word => (word.charAt(0).toUpperCase() + word.slice(1));
    if (raw_name.indexOf(' ') > 0) {
        const words = raw_name.split(' ');
        const new_words = words.map(word => capitalize(word));
        const processed_name = new_words.join(' ');
        return processed_name;
    } else {
        return capitalize(raw_name);
    }
};

async function createProduct() {
    const PRODUCT = this.dat;
    if (!PRODUCT) return { status: 400, success: false, msg: `Invalid product input` };

    const allowed_fields = Object.keys(PRODUCT);
    const field_values = processDbFields(PRODUCT, allowed_fields);

    return await new Promise((resolve) => {
        const query = `INSERT INTO product(${allowed_fields.join()}) VALUES(${field_values}) ON CONFLICT DO NOTHING RETURNING *`;
        this.pool.query(query, (err, results) => {
            const dt = new Date();
            if (err) {
                console.log(`> ERR.${err} `);
                // this.pool.end(() => console.log('> New product closed.'));
                logToFile("product.log", `\n > product.js -> Product: ${dt} \n(Product addition FAILED) ${PRODUCT.species_name}: ${PRODUCT.tract_key} \n${err.code} > ${err} \n`, log_path);
                return resolve({ status: 400, success: false, msg: `Invalid product.${err.code} ` });
            } else if (results.rowCount == 1) {
                console.log("> SUCCESS: Project Product added.");
                logToFile("product.log", `\n > product.js -> createProduct: ${dt} \n(SUCCESS) ${PRODUCT.species_name}: ${PRODUCT.tract_key} \n`, log_path);
                // Update Tract
                addToTract(this.pool, results.rows[0].id, PRODUCT.tract_key);
                // Update Company
                addToCompany(this.pool, results.rows[0].id, PRODUCT.company_id);
                // Update Tract Status
                updateTractStatus(this.pool, PRODUCT.tract_key);
                // Update Mill Location:
                addToMills(this.pool, PRODUCT.mill_location, PRODUCT.company_id);
                // Update Species (Timber) Type:
                const species_name = processName(PRODUCT.species_name);
                addToSpecies(this.pool, species_name, PRODUCT.company_id);
                return resolve({ status: 200, success: true, msg: "Product successfully added." });
            } else {
                console.log("ERR. Product addition failed - possible CONFLICT in database");
                // this.pool.end(() => console.log('> New product closed.'));
                logToFile("product.log", `\n > product.js -> createProduct: ${dt} \n(FAILED - possible CONFLICT in database) ${PRODUCT.species_name}: ${PRODUCT.tract_key} \n`, log_path);
                return resolve({ status: 500, success: false, msg: "Record already exists" });
            }
        });
    });
}

async function getProduct() {
    const { tract_key, product_id } = this.dat;
    // const command_query = `SELECT * FROM product WHERE id IN (SELECT UNNEST(product_ids) FROM tract WHERE ${user_id} = ANY(company_ids));`
    const tract_query = `SELECT * FROM product WHERE id IN (SELECT UNNEST(product_ids) FROM tract WHERE id = ${parseInt(tract_key)})`;
    const product_query = `SELECT * FROM product WHERE id = ${product_id}`;
    let command_query = tract_query;
    if (product_id && !tract_key) command_query = product_query;

    return await new Promise((resolve) => {
        this.pool.query(command_query, (err, results) => {
            const dt = new Date();
            if (err) {
                console.log(`> ERR.${err} `);
                this.pool.end(() => console.log("> Product closed."));
                // logToFile('product.log', `\n > tract.js -> createTract: ${ dt } \n(Tract addition FAILED) ${ TRACT.name }: ${ TRACT.id } \n${ err.code } > ${ err } \n`, log_path);
                return resolve({
                    status: 400,
                    success: false,
                    msg: `Invalid product.${err.code}`,
                    prod_dat: {},
                });
            } else if (results.rowCount > 0) {
                console.log("> SUCCESS: Product successfully extracted.");
                this.pool.end(() => console.log("> Product closed."));
                // logToFile('product.log', `\n > tract.js -> createTract: ${ dt } \n(SUCCESS) ${ TRACT.name }: ${ TRACT.id } \n`, log_path);
                const results_data = { products: results.rows };
                return resolve({
                    status: 200,
                    success: true,
                    msg: "Product successfully extracted.",
                    prod_dat: results_data,
                });
            } else {
                console.log("ERR. Product extraction failed - possible empty database");
                this.pool.end(() => console.log("> Product closed."));
                // logToFile('product.log', `\n > tract.js -> createTract: ${ dt } \n(FAILED - possible CONFLICT in database) ${ TRACT.name }: ${ TRACT.id } \n`, log_path);
                return resolve({
                    status: 500,
                    success: false,
                    msg: "Record(s) not found",
                    prod_dat: {},
                });
            }
        });
    });
}

async function updateProduct() {
    let status = 400, success = false, msg = '';
    const { new_data: PRODUCT, product_id } = this.dat;
    const allowed_fields = Object.keys(PRODUCT); // PRODUCT was already filtered
    if (!PRODUCT) return { status, success, msg: 'Invalid product input.' };
    const field_values = processDbFields(PRODUCT, allowed_fields);
    try {
        const product_updates = await this.pool.query(`UPDATE product SET (${allowed_fields.join()}) = (${field_values}) WHERE id = ${product_id} RETURNING *`);
        if (product_updates.rowCount === 1) {
            status = 200;
            success = true;
            msg = 'Product update successful.';
            // Update Mill Location:
            addToMills(this.pool, PRODUCT.mill_location, PRODUCT.company_id);
            // Update Species (Timber) Type:
            const species_name = processName(PRODUCT.species_name);
            addToSpecies(this.pool, species_name, PRODUCT.company_id);
        }
    } catch (err) {
        console.log(err.message);
        msg = err.message;
    }
    return { status, success, msg };
}

module.exports = { createProduct, getProduct, updateProduct };
