
const { body } = require('express-validator');

const checkImageFile = (val, { req }) => {
    if (req.file && (req.file.mimetype).match(/png|jpeg|jpg/)) {
        return true;
    } else {
        throw new Error('Invalid file uploaded');
    }
};

/**
 * Standard request object validator
 * @param {String} endpoint 
 * @returns Validation middleware (array of express validators)
 */
module.exports = endpoint => {
    const loads = [
        body('tract_key').trim().isNumeric().withMessage('Invalid tract_key (id)'),
        body('species_id').trim().isNumeric().withMessage('Invalid timber species'),
        body('product_id').trim().isNumeric().withMessage('Invalid product key (id)'),
        body('trucking_co').trim().isLength({ min: 2, max: 30 }).isAscii().withMessage('Invalid trucking company name'),
        body('driver').trim().isLength({ min: 2, max: 30 }).isAscii().withMessage('Invalid driver name'),
        body('open_date').trim().notEmpty().withMessage('Invalid date')
    ];
    const login = [
        body('phone').trim().isLength({ min: 11 }).isMobilePhone(['en-US', 'en-PH']).withMessage('Invalid phone number'),
        body('otp').trim().isLength({ min: 4, max: 4 }).isNumeric().withMessage('Invalid OTP'),
    ];
    const modify_load = [
        body('tract_key').trim().isNumeric().withMessage('Invalid tract_key (id)'),
        body('species_id').trim().isNumeric().withMessage('Invalid timber species'),
        body('product_id').trim().isNumeric().withMessage('Invalid product key (id)'),
        body('trucking_co').trim().isLength({ min: 2, max: 30 }).isAscii().withMessage('Invalid trucking company name'),
        body('driver').trim().isLength({ min: 2, max: 30 }).isAscii().withMessage('Invalid driver name'),
    ];
    const otp = [
        body('phone').trim().isLength({ min: 11 }).isMobilePhone(['en-US', 'en-PH']).withMessage('Invalid phone number'),
    ];
    const tickets = [
        body('number').trim().isNumeric({ no_symbols: true }).withMessage('Invalid ticket number'),
        body('tonnage').trim().isNumeric().withMessage('Invalid tonnage'),
        body('load_key').trim().isNumeric({ no_symbols: true }).withMessage('Invalid load_key'),
        body('tract_key').trim().isNumeric({ no_symbols: true }).withMessage('Invalid tract_key'),
        body('date').trim().notEmpty().withMessage('Invalid date')
    ];
    const uploads = [
        body('file').custom(checkImageFile)
    ];
    const checks = { loads, login, modify_load, otp, tickets, uploads };
    return checks[endpoint];
};