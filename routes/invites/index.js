
const express = require('express');
const cors = require('cors');

const validations = require('./invite_helpers/validations');
const { adminGetUser } = require('../../helpers/admin');
const inviteAdminUser = require('./invite_helpers/invite_user');
const getInvitations = require('./invite_helpers/get_invites');
const deactivateUser = require('./invite_helpers/deactivate_user');

module.exports = function inviteRouteHandler() {

    const router = express.Router();
    router.use(cors());
    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    router.post('/admin', [adminGetUser, validations('admin')], async (req, res) => {
        const results = await inviteAdminUser(req, res);
        res.status(results.status).send({
            success: results.success,
            msg: results.msg,
            invited_user: results.user_data
        });
    });

    router.get('/', adminGetUser, async (req, res) => {
        const results = await getInvitations(req, res);
        res.status(results.status).send({
            success: results.success,
            msg: results.msg,
            invites: results.invites
        });
    });

    router.get(/deactivate|activate/, adminGetUser, async (req, res) => {
        const results = await deactivateUser(req, res);
        res.status(results.status).send({
            success: results.success,
            msg: results.msg,
            invites: results.invites
        });
    });

    router.use('*', (req, res) => { res.status(400).end('Bad invite request') });
    return router;
};