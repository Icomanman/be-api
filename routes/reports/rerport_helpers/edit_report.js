
const { validationResult } = require('express-validator');
const { editReport } = require('./report_builder');

module.exports = async function updateReport(req, res) {
    let status = 400;
    let msg, success = false;
    const err_msg = validationResult(req)['errors'];
    if (err_msg.length > 0) {
        let messages = [];
        err_msg.forEach(err => {
            messages = messages.concat(err.msg);
        });
        msg = messages;
    } else {
        const data = req.body;
        const type = req.body.type ? req.body.type : null;

        const report_results = await editReport(data, type);
        msg = report_results.msg;
        if (report_results.success) {
            status = 200;
            success = true;
        }
    }
    return { status, success, msg };
}