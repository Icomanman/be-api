
const { body } = require('express-validator');

module.exports = endpoint => {
    const checks = {
        admin: [
            body('company_id').trim().escape().isNumeric().withMessage('Invalid company name'),
            body('given_name').trim().escape().isLength({ min: 2 }).isAlpha().withMessage('Invalid first name'),
            body('family_name').trim().escape().isLength({ min: 2 }).isAlpha().withMessage('Invalid last name'),
            body('email').trim().isEmail().withMessage('Invalid email address'),
            body('phone').trim().isMobilePhone(['en-US', 'en-PH']).withMessage('Invalid phone number'),
            body('user_type').trim().escape().isLength({ min: 3 }).withMessage('Invalid user type')
        ],
        mobile: [
            body('company_id').trim().escape().isNumeric().withMessage('Invalid company name'),
            body('given_name').trim().escape().isLength({ min: 2 }).isAlpha().withMessage('Invalid first name'),
            body('family_name').trim().escape().isLength({ min: 2 }).isAlpha().withMessage('Invalid last name'),
            body('email').trim().isEmail().withMessage('Invalid email address'),
            body('phone').trim().escape().isLength({ min: 12 }).isNumeric().withMessage('Should be a valid phone number'),
            body('user_type').trim().escape().isLength({ min: 3 }).withMessage('Invalid user type')
        ]
    };
    return checks[endpoint];
}