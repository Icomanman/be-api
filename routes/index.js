
const express = require('express');
const cors = require('cors');

const { authenticateUser, confirmPassword, forgotPassword, loginUser, registerUser, resendCode, resetPassword, sendCode } = require('./../helpers/web_utils');
const { adminResetPassword, adminLogin, refreshToken } = require('./../helpers/admin');

const validations = require('./../helpers/validations');

function routeHandler() {
    // Instantiate the middleware to 'router'. Note that body-parser is already deprecated and is already built into express 4.xx
    const router = express.Router();
    router.use(cors());
    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    router.get('/auth', authenticateUser);
    router.get('/signout', (req, res) => { res.status(200).end("You've successfully signed out.") });

    router.post('/auth', authenticateUser);
    router.post('/confirm-password', validations('confirm_password'), confirmPassword)
    router.post('/forgot-password', validations('forgot_password'), forgotPassword)
    router.post('/login', validations('login'), loginUser);
    router.post('/register', validations('register'), registerUser);
    router.post('/code-confirmation', validations('code_confirmation'), sendCode);
    router.post('/resend-code', validations('resend_code'), resendCode);
    router.post('/reset-password', validations('reset_password'), resetPassword);

    router.post('/admin/forgot-password', validations('forgot_password'), adminResetPassword);
    router.post('/admin/refresh-token', validations('refresh_token'), refreshToken);

    router.use('*', (req, res) => { res.status(400).end('Bad request') });
    return router;
}

module.exports = routeHandler;
