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
            if (sent_keys.length < 4)
                throw new Error("Invalid individual owner data");
        } else {
            if (sent_keys.length != 8) throw new Error("Invalid business owner data");
        }
    } else if (schema == "consultant") {
        if (data_obj.hasOwnProperty("given_name")) {
            if (sent_keys.length < 4)
                throw new Error("Invalid individual owner data");
        }
        else {
            if (sent_keys.length != 9) throw new Error("Invalid consultant data");
        }
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
    const create_project = [
        body("name").trim().escape().isLength({ min: 2 }).withMessage("Invalid tract name"),
        body("id").trim().isLength({ min: 2 }).isAlphanumeric(),
        body("state").trim().isLength({ min: 2 }).isAlpha(),
        body("with_consultant").trim().isBoolean({ loose: true }),
        checkSchema({
            consultant: {
                in: ["body"],
                errorMessage: "Missing info in consultant input",
                custom: {
                    options: function (val) {
                        if (!val || Object.keys(val) == 0)
                            return true; // accepts empty consultant
                        else return check_params(val, "consultant");
                    },
                },
            },
            owner: {
                in: ["body"],
                errorMessage: "Missing info in owner input",
                custom: {
                    options: function (val) {
                        if (!val) return false;
                        const is_valid = check_params(val, "owner");
                        return is_valid;
                    },
                },
            },
            owner_type: {
                in: ["body"],
                errorMessage: "Owner type must be business or individual.",
                custom: {
                    options: function (val) {
                        return val == "business" || val == "individual" ? true : false;
                    },
                },
            },
        }),
    ];

    const edit_project = [
        body("name").trim().escape().isLength({ min: 2 }).withMessage("Invalid tract name"),
        body("id").trim().isLength({ min: 2 }).isAlphanumeric(),
        body("state").trim().isLength({ min: 2 }).isAlpha(),
        body("tract_key").trim().isNumeric(),
        body("owner_id").trim().isNumeric(),
        body("with_consultant").trim().isBoolean({ loose: true }),
        checkSchema({
            consultant: {
                in: ["body"],
                errorMessage: "Missing info in consultant input",
                custom: {
                    options: function (val) {
                        if (!val || Object.keys(val) == 0)
                            return true; // accepts empty consultant
                        else return check_params(val, "consultant");
                    },
                },
            },
            owner: {
                in: ["body"],
                errorMessage: "Missing info in owner input",
                custom: {
                    options: function (val) {
                        if (!val) return false;
                        const is_valid = check_params(val, "owner");
                        return is_valid;
                    },
                },
            },
            owner_type: {
                in: ["body"],
                errorMessage: "Owner type must be business or individual.",
                custom: {
                    options: function (val) {
                        return val == "business" || val == "individual" ? true : false;
                    },
                },
            },
        }),
    ];

    const get_project = [];

    const checks = {
        create_project,
        edit_project,
        get_project
    };
    return checks[endpoint];
};

module.exports = { endpoints, check_params };
