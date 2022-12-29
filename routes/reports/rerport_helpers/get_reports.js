
const { validationResult } = require('express-validator');
const { extractReport, extractReports } = require('./report_builder');

module.exports = async function getReports(req, res) {
    let status = 400;
    let msg, success = false, data = [];
    const err_msg = validationResult(req)['errors'];
    if (err_msg.length > 0) {
        let messages = [];
        err_msg.forEach(err => {
            messages = messages.concat(err.msg);
        });
        msg = messages;
    } else {
        const company_id = req.query.company_id ? req.query.company_id : null;
        const tract_key = req.query.tract_key ? req.query.tract_key : null;
        if (!company_id && !tract_key) {
            msg = 'Invalid query. Must have company_id OR tract_key';
        } else if (tract_key) {
            const report_results = await extractReport(tract_key);
            msg = report_results.msg;
            if (report_results.success) {
                status = 200;
                success = true;
                msg = report_results.msg;
                data = report_results.data;
            } else {
                status = 500;
                msg = 'No existing record(s)';
            }
        } else if (company_id) {
            const report_results = await extractReports(company_id);
            msg = report_results.msg;
            if (report_results.success) {
                status = 200;
                success = true;
                msg = report_results.msg;
                data = report_results.data;
            } else {
                status = 500;
                msg = 'No existing record(s)';
            }
        }
        return { status, success, msg, data };
    }
}