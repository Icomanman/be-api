
const { body, checkSchema } = require('express-validator');

module.exports = endpoint => {
    const checks = {
        archive_report: [
            body('report_id').trim().isNumeric().withMessage('Invalid report_id.'),
        ],
        build_report: [
            body('company_id').trim().isNumeric().withMessage('Invalid company_id.'),
            body('tract_key').trim().isNumeric().withMessage('Invalid tract_key.'),
            checkSchema({
                type: {
                    in: ['body'],
                    errorMessage: 'invalid report type',
                    custom: {
                        options: function (val) {
                            if (!val || !val.match(/Land\sOwner\sSettlement|Trucker\sSettlement|Load\sReport|ustom/)) return false;
                            else return true;
                        },
                    },
                },
                field_ids: {
                    in: ['body'],
                    errorMessage: 'Invalid report fields',
                    custom: {
                        options: function (val) {
                            if (Array.isArray(val)) return true;
                            else return false;
                        }
                    }
                },
                mills: {
                    in: ['body'],
                    errorMessage: 'Invalid mils',
                    custom: {
                        options: function (val) {
                            if (Array.isArray(val)) return true;
                            else return false;
                        }
                    }
                }
            }),
            body('with_image').trim().isBoolean().withMessage('\'with_image\' must be specified whether true or false.')
        ],
        get_report: [
            body('report_key').trim().isNumeric().withMessage('Invalid report_key (id)'),
        ],
        update_report: [
            body('report_id').trim().isNumeric().withMessage('Invalid report_id.'),
            body('company_id').trim().isNumeric().withMessage('Invalid company_id.'),
            body('tract_key').trim().isNumeric().withMessage('Invalid tract_key.'),
            checkSchema({
                type: {
                    in: ['body'],
                    errorMessage: 'invalid report type',
                    custom: {
                        options: function (val) {
                            if (!val || !val.match(/Land\sOwner\sSettlement|Trucker\sSettlement|Load\sReport|ustom/)) return false;
                            else return true;
                        },
                    },
                },
                field_ids: {
                    in: ['body'],
                    errorMessage: 'Invalid report fields',
                    custom: {
                        options: function (val) {
                            if (Array.isArray(val)) return true;
                            else return false;
                        }
                    }
                },
                mills: {
                    in: ['body'],
                    errorMessage: 'Invalid mils',
                    custom: {
                        options: function (val) {
                            if (Array.isArray(val)) return true;
                            else return false;
                        }
                    }
                }
            }),
            body('with_image').trim().isBoolean().withMessage('\'with_image\' must be specified whether true or false.')
        ]
    }
    return checks[endpoint];
};