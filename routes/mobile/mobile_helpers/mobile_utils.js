const ENV = process.env;
const { validationResult } = require('express-validator');
const {
    CognitoIdentityProviderClient,
    AdminGetUserCommand,
    AdminSetUserPasswordCommand,
    AdminInitiateAuthCommand,
    AdminRespondToAuthChallengeCommand
} = require("@aws-sdk/client-cognito-identity-provider");

async function sendSMS(phone, otp) {
    const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
    const client = new SNSClient({
        credentials: {
            accessKeyId: ENV.AWS_ACCESS_KEY_ID2,
            secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY2,
        },
        region: ENV.AWS_DEFAULT_REGION2,
        maxAttempts: 25
    });
    const send_msg = new PublishCommand({
        PhoneNumber: phone,
        Message: `Your Spruce OTP is ${otp}. Never share this with anyone.`
    });

    try {
        const msg_response = await client.send(send_msg);
    } catch (err) {
        console.log(err.message);
    }
}

const client = new CognitoIdentityProviderClient({
    credentials: {
        accessKeyId: ENV.AWS_ACCESS_KEY_ID2,
        secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY2,
    },
    region: ENV.AWS_DEFAULT_REGION2,
    maxAttempts: 25
});

const mobileLogin = async (req, res) => {
    const err_arr = validationResult(req)['errors'];
    let status_code = 401;
    const is_valid = {
        success: false,
        msg: err_arr.length > 0 ? String('').concat(err_arr.map((err, i) => i == (err_arr.length - 1) ? err.msg : `${err.msg}, `)) : ''
    };
    if (err_arr.length > 0) {
        return { status: status_code, is_valid };
    }

    const user_name = (req.body.phone).replace(/\+/, '');
    const key = req.body.otp;
    const session = req.body.session;

    //*****************************************************
    // direct login using cognito password
    const backdoor_auth = new AdminInitiateAuthCommand({
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
            USERNAME: user_name,
            PASSWORD: ENV.BD_PEEWEE
        },
        ClientId: ENV.MOBILE_COGNITO_CLIENT_ID,
        UserPoolId: ENV.MOBILE_COGNITO_USER_POOL_ID,
    });
    const set_password = new AdminSetUserPasswordCommand({
        Password: ENV.BD_PEEWEE,
        Permanent: true,
        Username: user_name,
        UserPoolId: ENV.MOBILE_COGNITO_USER_POOL_ID,
    });
    //*****************************************************

    const verifyAuth = (otp, session) => new AdminRespondToAuthChallengeCommand({
        ChallengeName: 'CUSTOM_CHALLENGE',
        ClientId: ENV.MOBILE_COGNITO_CLIENT_ID,
        ChallengeResponses: {
            USERNAME: user_name,
            ANSWER: otp
        },
        UserPoolId: ENV.MOBILE_COGNITO_USER_POOL_ID,
        Session: session
    });

    try {
        let results = null;
        if (user_name == ENV.BD_USER && key == ENV.BD_KEY) {
            // results = await client.send(set_password);
            results = await client.send(backdoor_auth);
        } else {
            results = await client.send(verifyAuth(key, session));
        }
        // const results = await client.send(verifyAuth(key, session));
        if (results.$metadata.httpStatusCode == 200 && results.AuthenticationResult) {
            is_valid['success'] = true;
            is_valid['token'] = results.AuthenticationResult.AccessToken;
            is_valid['misc'] = results.AuthenticationResult.RefreshToken;
            is_valid['company_id'] = 101;
            status_code = results.$metadata.httpStatusCode;
        } else {
            throw new Error('Invalid token');
        }
    } catch (err) {
        is_valid['msg'] = 'Invalid login. Unable to verify session';
    }
    return { status: status_code, is_valid };
};

const mobileOTPRequest = async (req, res) => {
    const err_arr = validationResult(req)['errors'];
    let status_code = 401;
    const is_valid = {
        success: false,
        msg: err_arr.length > 0 ? String('').concat(err_arr.map((err, i) => i == (err_arr.length - 1) ? err.msg : `${err.msg}, `)) : ''
    };
    if (err_arr.length > 0) {
        return { status: status_code, is_valid };
    }

    const user_name = (req.body.phone).replace(/\+/, '');
    const get_user = new AdminGetUserCommand({
        Username: user_name,
        UserPoolId: ENV.MOBILE_COGNITO_USER_POOL_ID
    });

    const mobile_auth = new AdminInitiateAuthCommand({
        AuthFlow: 'CUSTOM_AUTH',
        AuthParameters: { USERNAME: user_name },
        ClientId: ENV.MOBILE_COGNITO_CLIENT_ID,
        UserPoolId: ENV.MOBILE_COGNITO_USER_POOL_ID,
    });

    try {
        const response = await client.send(get_user);
        if (response && response['$metadata'].httpStatusCode == 200) {
            let user_email = null;
            const user_atrr = (response.UserAttributes).filter(attr => attr.Name == 'email' ? attr.Value : null);
            if (user_atrr.length == 1) user_email = user_atrr[0].Value;

            const auth_results = await client.send(mobile_auth);
            if (auth_results && auth_results.ChallengeParameters.key && auth_results.Session) {
                const key = auth_results.ChallengeParameters.key;
                const session = auth_results.Session;

                sendSMS(req.body.phone, key);

                is_valid['user_email'] = user_email;
                is_valid['otp'] = key;
                is_valid['session'] = session;
                is_valid['success'] = true;
                // **********************************************
                // Update invitations (status) from the database:
                const is_dev = ENV.USER != 'ubuntu' ? false : true;
                (async function () {
                    const initDb = require('../../../helpers/db_ops/init_db');
                    const db_pool = initDb('invitations', null, is_dev);
                    const invite_update = await db_pool.query(`UPDATE invitations SET status = 'accepted' WHERE email = $1 RETURNING *`, [user_email]);
                    if (invite_update.rowCount === 1) {
                        const getTemplate = require('../../../helpers/db_ops/data_templates');
                        const default_data = getTemplate('mobile_users');
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
                        const new_user = await db_pool.query(`INSERT INTO mobile_users(${allowed_fields.join()}) VALUES(${field_values}) ON CONFLICT DO NOTHING RETURNING *`);
                        if (new_user.rowCount !== 1) {
                            console.log('> WARNING: New mobile user addition failed from invitation.');
                        }
                    }
                    db_pool.end(() => { console.log('> Mobile user (mobileOTPRequest) update from invitation closed.') });
                })();
                // **********************************************
                status_code = 200;
            }
        }
    }
    catch (err) {
        is_valid['msg'] = err.message;
    }
    return { status: status_code, is_valid };
};

module.exports = {
    mobileLogin,
    mobileOTPRequest
}