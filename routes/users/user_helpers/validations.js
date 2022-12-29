
const { body } = require("express-validator");

/**
 * Express validator middleware arrays
 * @param {String} endpoint 
 * @returns middleware checks
 */
module.exports = (endpoint) => {
    const checks = {
        company_user: [
            body('given_name').trim().escape().isLength({ min: 2 }).isAlpha().withMessage('Invalid first name'),
            body('family_name').trim().escape().isLength({ min: 2 }).isAlpha().withMessage('Invalid last name'),
            body('email').trim().isEmail().withMessage('Invalid email address'),
            body('phone').trim().escape().isLength({ min: 12 }).isNumeric().withMessage('Should be a valid phone number'),
            body('password').trim().isLength({ min: 8 }).escape().withMessage('Password should be at least 8 characters'),
            body('company').trim().isLength({ min: 2 }).escape().withMessage('Invalid company name'),
            body('user_type').trim().isLength({ min: 4 }).escape().withMessage('Invalid user type')
        ],
        delete_user: [
            body('id').trim().isLength({ min: 1 }).isNumeric().withMessage('User id must be an integer'),
            body('user_type').trim().isLength({ min: 4 }).escape().withMessage('Invalid user type')
        ],
        get_user: [
            body('user_type').trim().isLength({ min: 3 }).isAlpha().withMessage('User type must be mobile or admin'),
        ],
        mod_admin: [
            body('id').trim().isLength({ min: 1 }).isNumeric().withMessage('Admin id must be an integer'),
            body('given_name').trim().escape().isLength({ min: 2 }).isAlpha().withMessage('Invalid first name'),
            body('family_name').trim().escape().isLength({ min: 2 }).isAlpha().withMessage('Invalid last name'),
            body('email').trim().isEmail().withMessage('Invalid email address'),
            body('phone').trim().escape().isLength({ min: 12 }).isNumeric().withMessage('Should be a valid phone number'),
            body('password').trim().isLength({ min: 8 }).escape().withMessage('Password should be at least 8 characters'),
            body('company').trim().isLength({ min: 2 }).escape().withMessage('Invalid company name'),
            body('company_id').trim().isLength({ min: 1 }).isNumeric().withMessage('Invalid company id')
        ],
        new_admin: [
            body('given_name').trim().escape().isLength({ min: 2 }).isAlpha().withMessage('Invalid first name'),
            body('family_name').trim().escape().isLength({ min: 2 }).isAlpha().withMessage('Invalid last name'),
            body('email').trim().isEmail().withMessage('Invalid email address'),
            body('phone').trim().escape().isLength({ min: 12 }).isNumeric().withMessage('Should be a valid phone number'),
            body('password').trim().isLength({ min: 8 }).escape().withMessage('Password should be at least 8 characters'),
            body('company').trim().isLength({ min: 2 }).escape().withMessage('Invalid company name'),
            body('company_id').trim().isLength({ min: 1 }).isNumeric().withMessage('Invalid company id')
        ]
    };
    return checks[endpoint];
};