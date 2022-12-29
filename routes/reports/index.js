
const express = require('express');
const cors = require('cors');

const validations = require('./rerport_helpers/validations');
const { adminGetUser } = require('../../helpers/admin');
const buildReport = require('./rerport_helpers/build_report');
const getReports = require('./rerport_helpers/get_reports');
const getDates = require('./rerport_helpers/get_dates');
const getFields = require('./rerport_helpers/get_fields');
const updateReport = require('./rerport_helpers/edit_report');
const archiveReport = require('./rerport_helpers/archive_report');

module.exports = function reportsRouteHandler(req, res) {
    const router = express.Router();
    router.use(cors());
    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    router.get('/', [adminGetUser], async (req, res) => {
        const report_results = await getReports(req, res);
        res.status(report_results.status).send({
            success: report_results.success,
            msg: report_results.msg,
            data: report_results.data
        });
    });

    router.get('/dates', [adminGetUser], async (req, res) => {
        const dates_results = await getDates(req, res);
        res.status(dates_results.status).send({
            success: dates_results.success,
            msg: dates_results.msg,
            data: dates_results.data
        });
    });

    router.get('/fields', [adminGetUser], async (req, res) => {
        const fields_results = await getFields(req, res);
        res.status(fields_results.status).send({
            success: fields_results.success,
            msg: fields_results.msg,
            data: fields_results.data
        });
    });

    router.post('/new', [validations('build_report'), adminGetUser], async (req, res) => {
        const report_results = await buildReport(req, res);
        res.status(report_results.status).send({
            success: report_results.success,
            msg: report_results.msg
        });
    });

    router.post(/edit|update/, [validations('update_report'), adminGetUser], async (req, res) => {
        const report_results = await updateReport(req, res);
        res.status(report_results.status).send({
            success: report_results.success,
            msg: report_results.msg
        });
    });

    router.post('/archive', [validations('archive_report'), adminGetUser], async (req, res) => {
        const report_results = await archiveReport(req, res);
        res.status(report_results.status).send({
            success: report_results.success,
            msg: report_results.msg
        });
    });

    router.use('*', (req, res) => { res.status(400).end('Bad report request.') });
    return router;
};