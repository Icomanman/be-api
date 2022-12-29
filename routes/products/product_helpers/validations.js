
const { body, checkSchema } = require("express-validator");

/**
 * Validates the schema of a data object
 * @param {Object} data_obj the data object to be validated
 * @param {*} schema the schema to validate against
 */
const check_params = (data_obj, schema) => {
    const sent_keys = Object.keys(data_obj);
    if (schema == "owner") {
        if (data_obj.hasOwnProperty("given_name")) {
            is_individual_owner = true;
            if (sent_keys.length < 4)
                throw new Error("Invalid individual owner data");
        } else {
            if (sent_keys.length != 8) throw new Error("Invalid business owner data");
        }
    } else if (schema == "consultant") {
        if (sent_keys.length != 8) throw new Error("Invalid consultant data");
    } else if (schema == "company") {
        if (sent_keys.length < 8) throw new Error("Invalid company data");
    }
    // for product creation:
    else if (schema == "product") {
        // TODO: confirm specific requirements
    } else if (schema == "species") {
        // TODO: confirm specific requirements
        if (sent_keys.length != 2) throw new Error("Invalid species data");
    }

    let valid = true;
    sent_keys.forEach((key) => {
        if (!data_obj[key]) valid = false;
    });
    return valid;
};

//****** Middleware Validations ******

/**
 * Standard request object validator
 * @param {String} endpoint
 * @returns Validation middleware (array of express validators)
 */
const endpoints = (endpoint) => {
    const create_product = [];
    const edit_product = [];
    const checks = { create_product, edit_product };
    return checks[endpoint];
};

module.exports = { endpoints, check_params };