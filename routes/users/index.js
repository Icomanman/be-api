const express = require('express');
const cors = require('cors');

const { adminGetUser } = require('../../helpers/admin');
const validations = require('./user_helpers/validations');
const getAdminUser = require('./user_helpers/get_admin_user');
const createUser = require('./user_helpers/create_user');
const createCompanyUser = require('./user_helpers/create_company_user');
const deleteUser = require('./user_helpers/delete_user');
const getCognitoUser = require('./user_helpers/get_cognito_user');

function usersHandler() {
    // Instantiate the middleware to 'router'. Note that body-parser is already deprecated and is already built into express 4.xx
    const router = express.Router();
    router.use(cors());
    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    router.post('/company', [validations('company_user'), adminGetUser], async (req, res) => {
        const user_results = await createCompanyUser(req, res);
        res.status(user_results.status).send({
            success: user_results.success,
            msg: user_results.msg,
            user_data: user_results.user_data
        });
    });

    router.post('/modify', [validations('mod_admin'), adminGetUser], async (req, res) => {
        const user_results = await createUser(req, res);
        res.status(user_results.status).send({
            success: user_results.success,
            msg: user_results.msg,
            user_data: user_results.user_data
        });
    });

    router.post('/verify', [validations('get_user')], async (req, res) => {
        const user_results = await getCognitoUser(req, res);
        res.status(user_results.status).send({
            success: user_results.success,
            msg: user_results.msg,
            user_data: user_results.user_data
        });
    });

    router.post('/new', [validations('new_admin'), adminGetUser], async (req, res) => {
        const user_results = await createUser(req, res);
        res.status(user_results.status).send({
            success: user_results.success,
            msg: user_results.msg,
            user_data: user_results.user_data
        });
    });

    router.get('/', adminGetUser, async (req, res) => {
        const user_results = await getAdminUser(req, res);
        res.status(user_results.status).send({
            success: user_results.success,
            msg: user_results.msg,
            user_data: user_results.user_data
        });
    });

    router.delete('/delete', [validations('delete_user'), adminGetUser], async (req, res) => {
        const user_results = await deleteUser(req, res);
        res.status(user_results.status).send({
            success: user_results.success,
            msg: user_results.msg,
            user_data: user_results.user_data
        });
    });

    router.use('*', (req, res) => { res.status(400).end('Bad user request') });
    return router;
}

module.exports = usersHandler;