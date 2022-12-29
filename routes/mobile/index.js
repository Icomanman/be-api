
const express = require('express');
const cors = require('cors');

const validations = require('./mobile_helpers/validations');
const { adminGetUser } = require('../../helpers/admin');
const { mobileLogin, mobileOTPRequest } = require('./mobile_helpers/mobile_utils');
const { createModifyLoad, listLoads } = require('./mobile_helpers/loads');
const { applyTicket, uploadTicketPhoto } = require('./mobile_helpers/tickets');

function mobileRoutesHandler() {
    // Instantiate the middleware to 'router'. Note that body-parser is already deprecated and is already built into express 4.xx
    const router = express.Router();
    router.use(cors());
    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    const multer = require('multer');
    const upload = multer();

    router.post('/login', validations('login'), async (req, res) => {
        const results = await mobileLogin(req, res);
        res.status(results.status).send(results.is_valid);
    });

    router.post('/otp', validations('otp'), async (req, res) => {
        const results = await mobileOTPRequest(req, res);
        res.status(results.status).send(results.is_valid);
    });

    router.post('/create-load', [validations('loads'), adminGetUser], async (req, res) => {
        const results = await createModifyLoad(req, res);
        res.status(results.status).send(results.is_valid);
    });

    router.post('/modify-load', [validations('modify_load'), adminGetUser], async (req, res) => {
        const results = await createModifyLoad(req, res);
        res.status(results.status).send(results.is_valid);
    });

    router.post('/apply-ticket', [validations('tickets'), adminGetUser], async (req, res) => {
        const results = await applyTicket(req, res);
        res.status(results.status).send(results.is_valid);
    });

    router.post('/upload-ticket', [adminGetUser, upload.single('ticket'), validations('uploads')], async (req, res) => {
        const results = await uploadTicketPhoto(req, res);
        res.status(results.status).send(results.is_valid);
    });

    router.get('/load-list', adminGetUser, async (req, res) => {
        const results = await listLoads(req, res);
        res.status(results.status).send(results.is_valid);
    });

    router.use('*', (req, res) => { res.status(400).end('Bad mobile request') });
    return router;
}

module.exports = mobileRoutesHandler;