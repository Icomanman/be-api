
const path = require('path');
const env_vars = require('dotenv')
const { AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool } = require('amazon-cognito-identity-js-node');
const ENV = process.env;
env_vars.config({ path: path.resolve(`${__dirname}/../.env`) });

/**
 * Sends the authentication request to get JWT Token from Cognito
 * @param {Object} auth_details Cognito Identity Authentication Details instance (see npm amazon-cognito-identity-js-node)
 * @param {Object} cognito_user Cognito Identity User instance (see npm amazon-cognito-identity-js-node)
 * @returns A Promise (use await; until 'resolve' status) resolves to token, id_token and success message, otherwise, just a message
 */
function authRequest(auth_details, cognito_user) {
    return new Promise(resolve => {
        cognito_user.authenticateUser(
            auth_details,
            {
                onSuccess: result => {
                    const token = result.getAccessToken().getJwtToken();
                    const id_token = result.getIdToken().getJwtToken();
                    const refresh_token = result.getRefreshToken().getToken();
                    console.log(`authRequest success. Token created for ${auth_details.username}`);
                    return resolve({ token, id_token, msg: 'login successful', misc: refresh_token });
                },
                onFailure: err => {
                    const err_msg = `Status: ${err.statusCode}, ${err.code}`;
                    const dt = new Date;
                    console.log(err_msg);
                    // TODO: write a more detailed error - password or username
                    const log = `\n> authRequest: ${dt}\n${err_msg}\n${cognito_user.username}, ${cognito_user.pool.userPoolId}\n`;
                    logToFile('error.log', log);
                    return resolve({ token: null, id_token: null, msg: err.code, misc: null });
                },
                newPasswordRequired: (user_attr, required_attr) => {
                    const msg = 'New password required';
                    const dt = new Date;
                    delete user_attr.email_verified;
                    console.log(msg);
                    const log = `\n> authRequest: ${dt}\n${msg}\n${cognito_user.username}, ${cognito_user.pool.userPoolId}\n`;
                    logToFile('password.log', log);
                    return resolve({ token: null, id_token: null, msg, user_attr, required_attr });
                }
            }
        )
    });
}

/**
 * Get a Cognito user from a Userpool using an issued access token
 * @param {String} token Access Token 
 * @returns {Object} the error object and the user data
 */
function getCognitoUser(token) {
    if (!token) return { msg: 'Invalid token' };
    return new Promise(resolve => {
        const client = getCognitoUserPool().client;
        client.makeUnauthenticatedRequest('getUser', { AccessToken: token }, (err, user_dat) => {
            if (err) return resolve({ user_err: err.message, user_dat: null });
            else return resolve({ user_err: null, user_dat });
        });
    })
}

function getCognitoUserPool() {
    const pool_data = {
        UserPoolId: ENV.COGNITO_USER_POOL_ID2,
        ClientId: ENV.COGNITO_CLIENT_ID2
    };
    return new CognitoUserPool(pool_data);
};

function initCognitoUser(creds) {
    const { email, password } = creds;
    if (!email || !password) {
        console.log('> ERR. Missing credentials for cognito user');
        return null;
    } else {
        const user_dat = { Username: creds['email'], Pool: getCognitoUserPool() };
        // creates a cognito user from the user_dat
        return new CognitoUser(user_dat);
    }
}

function logToFile(file_name, data, abs_path = null) {
    const fs = require('fs');
    const path_to_log = abs_path ? abs_path : '../logs';
    try {
        fs.writeFile(path.resolve(__dirname, `${path_to_log}/${file_name}`), data,
            { encoding: 'utf-8', flag: 'a' },
            () => { console.log(`> See ${file_name} (${__dirname}/logs/${file_name})`) }
        );
    } catch (err) {
        console.log(err.message);
    }
}

const cognitoConfirmPassword = creds => {
    let { email, pin_code = null, new_password = null } = creds;
    if (!email || !pin_code || !new_password) return { msg: 'Invalid request' };
    const { client, clientId } = getCognitoUserPool();
    return new Promise(resolve => {
        // library bug: 'ConfirmForgotPassword' command is actually 'confirmForgotPassword'
        client.makeUnauthenticatedRequest('confirmForgotPassword', {
            ClientId: clientId,
            Username: email,
            ConfirmationCode: pin_code,
            Password: new_password
        }, (err, dat) => {
            const dt = new Date;
            if (err) {
                const log = `\n> cognitoConfirmPassword: ${dt}\n(User confirmation via pin) ${err.message}\n${creds['email']}\n`;
                logToFile('error.log', log);
                return resolve({ err: err.message, msg: null });
            } else {
                const log = `\n> cognitoConfirmPassword: ${dt}\n(User confirmation via pin) password changed successfully.\n${creds['email']}\n`;
                logToFile('password.log', log);
                return resolve({ err: null, msg: [] });
            }
        });
    });

};

const cognitoConfirmUser = async creds => {
    // creates a cognito user
    const cognito_user = initCognitoUser({ email: creds['email'], password: creds['password'] });
    if (!cognito_user) return { msg: 'invalid' };
    return new Promise(resolve => {
        cognito_user.confirmRegistration(creds.pin_code, false, result => {
            if (!result) var msg = 'success';
            else var msg = result.message;
            return resolve({ msg });
        });
    });
};

const cognitoForgotPassword = email => {
    if (!email) return { msg: 'Invalid request' };
    const { client, clientId } = getCognitoUserPool();
    return new Promise(resolve => {
        client.makeUnauthenticatedRequest('forgotPassword', {
            ClientId: clientId,
            Username: email,
        }, (err, dat) => {
            if (err) {
                const dt = new Date;
                const log = `\n> cognitoForgotPassword: ${dt}\n(User initiated) ${err.message}\n${email}\n`;
                logToFile('error.log', log);
                return resolve({ err: err.message, msg: null });
            }
            else {
                const dt = new Date;
                const log = `\n> cognitoForgotPassword: ${dt}\n(User initiated) medium: ${dat.CodeDeliveryDetails.AttributeName}\n${email}\n`;
                logToFile('password.log', log);
                return resolve({ err: null, msg: `A password reset code is sent to ${email}` });
            }
        });
    });
};

/**
 * Logs a user in via Cognito
 * @param {Object} creds User credentials: email and password 
 * @returns token and id_token when successful, otherwise, an error message
 */
const cognitoLogin = creds => {
    const auth_details = new AuthenticationDetails({
        Username: creds['email'],
        Password: creds['password']
    });
    // creates a cognito user from the user_dat
    const cognito_user = initCognitoUser(creds);
    if (!cognito_user) return { msg: 'invalid' };
    return authRequest(auth_details, cognito_user);
};

const cognitoRequestConfirmCode = creds => {
    // creates a cognito user
    const cognito_user = initCognitoUser({ email: creds['email'], password: creds['password'] });
    if (!cognito_user) return { msg: 'invalid' };
    return new Promise(resolve => {
        cognito_user.resendConfirmationCode(result => {
            if (!result) var msg = 'success';
            else var msg = result.message;
            return resolve({ msg });
        });
    });
};

const cognitoResetPassword = async creds => {
    const auth_details = new AuthenticationDetails({
        Username: creds['email'],
        Password: creds['old_password'],
        ValidationData: [creds['new_password']]
    });
    // creates a cognito user from the user_dat
    const cognito_user = initCognitoUser({ email: creds['email'], password: creds['old_password'] });
    if (!cognito_user) return { msg: 'invalid' };
    // authenticate user
    const { user_attr, required_attr, msg, token, misc } = await authRequest(auth_details, cognito_user);
    const passed_attr = {};

    if (msg == 'New password required' && (user_attr || required_attr)) {
        // password reset requirement for newly-signed admin-created users
        // admin-created users lack the other required attributes - given_name and family_name:
        if (!(creds['given_name'] || !(creds['family_name']))) {
            const dt = new Date;
            const log = `\n> cognitoResetPassword: ${dt}\n(Cognito initiated) Missing given_name or family_name\n${creds['email']}\n`;
            logToFile('error.log', log);
            return { token: null, id_token: null, msg: 'new password change failed' };
        } else {
            // update the respective attributes passed with the new password request
            required_attr.forEach(attr => { passed_attr[attr] = creds[attr] });
        }
        return new Promise(resolve => {
            cognito_user.completeNewPasswordChallenge(
                creds.new_password,
                passed_attr,
                {
                    onSuccess: result => {
                        const token = result.getAccessToken().getJwtToken();
                        const id_token = result.getIdToken().getJwtToken();
                        console.log(`Forced password change success. Token created for ${creds['email']}`);
                        return resolve({ token, id_token, msg: 'new password change success' });
                    },
                    onFailure: err => {
                        console.log(`> Cognito: ${err.message}`);
                        const dt = new Date;
                        const log = `\n> cognitoResetPassword: ${dt}\n(Cognito initiated) ${err.message}\n${creds['email']}\n`;
                        logToFile('error.log', log);
                        return resolve({ token: null, id_token: null, msg: 'new password change failed' });
                    }
                });
        });
    } else if (msg == 'login successful') {
        // user-initiated password reset
        return new Promise(resolve => {
            cognito_user.changePassword(creds['old_password'], creds['new_password'], (err, result) => {
                const dt = new Date;
                if (!err) {
                    var msg = 'password change success';
                    var log_file = 'password.log';
                }
                else {
                    var msg = err.message;
                    var log_file = 'error.log';
                }
                const log = `\n> cognitoResetPassword: ${dt}\n(User initiated) ${msg}\n${creds['email']}\n`;
                logToFile(log_file, log);
                return resolve({ token, msg, misc });
            });
        });
    } else {
        return { token: null, id_token: null, msg: 'Failed (Invalid Credentials)' };
    }
};

const cognitoSignUp = creds => {
    const { email, password } = creds;
    const user_pool = getCognitoUserPool();
    const attr = [];
    delete creds.password;
    (Object.keys(creds)).forEach(key => {
        if (key == 'user_type') attr.push(new CognitoUserAttribute('custom:user_type', creds[key]));
        else attr.push(new CognitoUserAttribute(key, creds[key]));
    });
    return new Promise(resolve => {
        const dt = new Date;
        user_pool.signUp(email, password, attr, null, err => {
            if (err) {
                console.log(err.message);
                const log = `\n> cognitoSignUp: ${dt}\n${err.message}: ${email}\n${user_pool.userPoolId}\n`;
                logToFile('error.log', log);
                return resolve({ msg: err.code });
            } else {
                const log = `\n> cognitoSignUp: ${dt}\n${email} added to user pool:\n${user_pool.userPoolId}\n`;
                logToFile('signup.log', log);
                return resolve({ msg: 'success' });
            }
        });
    });
};

module.exports = {
    cognitoLogin, getCognitoUser,
    cognitoConfirmUser, cognitoRequestConfirmCode, cognitoSignUp,
    cognitoConfirmPassword, cognitoResetPassword, cognitoForgotPassword,
    logToFile
}
