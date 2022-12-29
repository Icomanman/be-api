
const ENV = process.env;
const { validationResult } = require('express-validator');
const cognitoExpress = require('cognito-express');
// const { cognitoConfirmPassword, cognitoConfirmUser, cognitoLogin, cognitoRequestConfirmCode, cognitoResetPassword, cognitoSignUp, cognitoForgotPassword, getCognitoUser } = require('./cognito');
const { cognitoLogin, getCognitoUser } = require('./cognito');
const { cognitoConfirmUser, cognitoRequestConfirmCode, cognitoSignUp } = require('./cognito');
const { cognitoConfirmPassword, cognitoResetPassword, cognitoForgotPassword } = require('./cognito');

// export functions:

/**
 * authenticates the user via token from Cognito
 * @param {Object} req the request object
 * @param {Object} res the response object
 * @returns {Object} the response object with the user data in body
 */
const authenticateUser = async (req, res) => {
    let status_code = 401;
    let success = false;
    let msg = 'No token provided.';
    let user_data = {};
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

    if (!token) {
        res.status(status_code).send({ success, msg });
        return;
    }

    const cognitoAuth = new cognitoExpress({
        region: ENV.AWS_DEFAULT_REGION2,
        cognitoUserPoolId: ENV.COGNITO_USER_POOL_ID2,
        tokenUse: "access",
        tokenExpiration: 3600000
    });

    await new Promise(resolve => {
        cognitoAuth.validate(token, async err => {
            if (err) msg = 'Invalid';
            else {
                status_code = 200;
                success = true;
                msg = [];
                const cognito_user = await getCognitoUser(token);
                if (cognito_user.user_err) msg = cognito_user.user_err.message;
                else {
                    (cognito_user.user_dat.UserAttributes).forEach(attr => {
                        if ((attr['Name']).match(/sub|verified/)) return;
                        user_data[attr.Name] = attr.Value;
                    });
                }
            }
            return resolve();
        });
    });
    res.status(status_code).send({ success, msg, user_data });
};

const confirmPassword = async (req, res) => {
    const err_arr = validationResult(req)['errors'];
    let status_code = 401;
    const is_valid = {
        success: false,
        msg: err_arr.map(err => err['msg'])
    };
    if (err_arr.length > 0) {
        res.status(status_code).send(is_valid);
        return;
    }

    const { err } = await cognitoConfirmPassword(req.body);
    is_valid['msg'] = err;
    if (!err) {
        status_code = 200;
        is_valid['success'] = true
        is_valid['msg'] = 'password successfully reset.';
    }
    res.status(status_code).send(is_valid);
};

const forgotPassword = async (req, res) => {
    const err_arr = validationResult(req)['errors'];
    let status_code = 401;
    const is_valid = {
        success: false,
        msg: err_arr.map(err => err['msg'])
    };
    if (err_arr.length > 0) {
        res.status(status_code).send(is_valid);
        return;
    }

    const { err, msg } = await cognitoForgotPassword(req.body.email);
    is_valid['msg'] = err;
    if (!err) {
        status_code = 200;
        is_valid['success'] = true
        is_valid['msg'] = msg;
    }
    res.status(status_code).send(is_valid);
};

/**
 * validates if the user exists in the database records
 * @param {Object} req the request object
 * @param {Object} res the response object
 */
const loginUser = async (req, res) => {
    const err_arr = validationResult(req)['errors'];
    const is_valid = {
        success: false,
        msg: err_arr.map(err => err['msg'])
    };

    let status_code = 401;
    if (err_arr.length > 0) {
        res.status(status_code).send(is_valid);
        return;
    }

    const { body, headers } = req;
    // Returning user validated via token:
    if (headers.authorization && (headers.authorization).split(' ')[0] === 'Bearer') {
        const token = (headers.authorization).split(' ')[1];
        const { status, msg } = authenticateUser(token);
        status_code = status;
        is_valid['success'] = false;
        is_valid['msg'] = 'already logged in.';
    }
    // First-time login, logged out or expired/invalid token: 
    else {
        if (body.hasOwnProperty('email') && body.hasOwnProperty('password')) {
            const { token, id_token, msg, misc } = await cognitoLogin({ email: body['email'], password: body['password'] });
            // if user is valid:
            if (token) {
                is_valid['success'] = true;
                req.headers['authorization'] = token;
                is_valid['token'] = token;
                is_valid['misc'] = misc;
                status_code = 200;
            } else {
                is_valid['msg'] = msg;
                if (msg == 'New password required') {
                    status_code = 401;
                }
            }
        }
    }
    res.status(status_code).send(is_valid);
};

const registerUser = async (req, res) => {
    const err_arr = validationResult(req)['errors'];
    const is_valid = {
        success: false,
        msg: err_arr.map(err => err['msg'])
    };

    let status_code = 401;
    if (err_arr.length > 0) {
        res.status(status_code).send(is_valid);
        return;
    }
    const { msg } = await cognitoSignUp(req.body);
    if (msg == 'success') {
        status_code = 200;
        is_valid['success'] = true;
        is_valid['msg'] = `${req.body.email} added to users`;
    } else {
        is_valid['msg'] = msg;
    }
    res.status(status_code).send(is_valid);
};

const resendCode = async (req, res) => {
    const err_arr = validationResult(req)['errors'];
    const is_valid = {
        success: false,
        msg: err_arr.map(err => err['msg'])
    };
    let status_code = 401;
    if (err_arr.length > 0) {
        res.status(status_code).send(is_valid);
        return;
    }
    const { msg } = await cognitoRequestConfirmCode(req.body);
    if (msg == 'success') {
        status_code = 200;
        is_valid['success'] = true;
        is_valid['msg'] = `A confirmation code was sent to ${req.body.email}`;
    } else {
        is_valid['msg'] = msg;
    }
    res.status(status_code).send(is_valid);
};

const resetPassword = async (req, res) => {
    const err_arr = validationResult(req)['errors'];
    const is_valid = {
        success: false,
        msg: err_arr.map(err => err['msg'])
    };
    const { body } = req;
    if (err_arr.length > 0) {
        res.status(401).send(is_valid);
        return;
    }

    if (body.hasOwnProperty('email') && body.hasOwnProperty('old_password') && body.hasOwnProperty('new_password')) {
        const { token, id_token, msg, misc } = await cognitoResetPassword(body);
        is_valid['msg'] = msg;
        if (token && msg.match('success')) {
            is_valid['success'] = true;
            is_valid['token'] = token;
            is_valid['misc'] = misc;
            // **********************************************
            // Update invitations (status) from the database:
            const is_dev = ENV.USER != 'ubuntu' ? false : true;
            (async function () {
                const initDb = require('./db_ops/init_db');
                const db_pool = initDb('invitations', null, is_dev);
                const invite_update = await db_pool.query(`UPDATE invitations SET status = 'accepted' WHERE email = $1 RETURNING *`, [body.email]);
                if (invite_update.rowCount === 1) {
                    const getTemplate = require('./db_ops/data_templates');
                    const default_data = getTemplate('admin_users');
                    delete default_data['id'];
                    const allowed_fields = Object.keys(default_data);
                    const data = invite_update.rows[0];

                    const filtered_data = {};
                    let field_values = '';

                    allowed_fields.forEach((key, i) => {
                        filtered_data[key] = data[key];
                        if (i < allowed_fields.length - 1) {
                            field_values = field_values.concat("'", filtered_data[key], "', ");
                        } else {
                            field_values = field_values.concat("'", filtered_data[key], "'");
                        }
                    });
                    // Insert user to the database:
                    const new_user = await db_pool.query(`INSERT INTO admin_users (${allowed_fields.join()}) VALUES(${field_values}) ON CONFLICT DO NOTHING RETURNING *`);
                    if (new_user.rowCount !== 1) {
                        console.log('> WARNING: New admin user addition failed from invitation.');
                    }
                }
                db_pool.end(() => { console.log('> Admin user (resetPassword) update from invitation closed.') });
            })();
            // **********************************************
            res.status(200).send(is_valid);
        } else {
            res.status(401).send(is_valid);
        }
    }
};

const sendCode = async (req, res) => {
    const err_arr = validationResult(req)['errors'];
    const is_valid = {
        success: false,
        msg: err_arr.map(err => err['msg'])
    };
    let status_code = 401;
    if (err_arr.length > 0) {
        res.status(status_code).send(is_valid);
        return;
    }
    const { msg } = await cognitoConfirmUser(req.body);
    if (msg == 'success') {
        status_code = 200;
        is_valid['success'] = true;
        is_valid['msg'] = `${req.body.email} is now a confirmed user`;
    } else {
        is_valid['msg'] = msg;
    }
    res.status(status_code).send(is_valid);
};

module.exports = { authenticateUser, confirmPassword, forgotPassword, loginUser, registerUser, resendCode, resetPassword, sendCode };