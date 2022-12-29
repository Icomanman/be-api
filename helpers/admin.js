
const ENV = process.env;
const { validationResult } = require("express-validator");
const {
    CognitoIdentityProviderClient,
    AdminInitiateAuthCommand,
    AdminGetUserCommand,
    AdminSetUserPasswordCommand,
    ForgotPasswordCommand,
    GetUserCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({
    credentials: {
        accessKeyId: ENV.AWS_ACCESS_KEY_ID2,
        secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY2,
    },
    region: ENV.AWS_DEFAULT_REGION2,
    maxAttempts: 25
});

/**
 * Authentication Middleware
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
const adminGetUser = async (req, res, next) => {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    try {
        const user = await client.send(new GetUserCommand({ AccessToken: token }));
        console.log(`> Cognito user fetched: ${user.Username}`);
        const required_attr = (user.UserAttributes).filter(attr => attr.Name === 'given_name' || attr.Name === 'family_name');
        global.admin = {};
        global.admin.username = user.Username;
        global.admin.name = required_attr.map(attr => attr.Value).join(' ');
        next();
    } catch (err) {
        console.log(err.message);
        res.status(401).send({ success: false, msg: ['Invalid token'] });
    }
};

/**
 * Handler Function - processes Cognito Access Token request via Refresh Token
 * @param {Object} req 
 * @param {Object} res 
 */
const refreshToken = async (req, res) => {
    const err_arr = validationResult(req)["errors"];
    let status_code = 401;
    const is_valid = {
        success: false,
        msg: err_arr.length > 0 ? String('').concat(err_arr.map((err, i) => i == (err_arr.length - 1) ? err.msg : `${err.msg}, `)) : ''
    };
    if (err_arr.length == 0) {
        const is_mobile = req.body.mobile ? req.body.mobile : false;
        const refresh_token = req.body.refresh_token;
        const re_auth = new AdminInitiateAuthCommand({
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            AuthParameters: { REFRESH_TOKEN: refresh_token },
            ClientId: is_mobile ? ENV.MOBILE_COGNITO_CLIENT_ID : ENV.COGNITO_CLIENT_ID2,
            UserPoolId: is_mobile ? ENV.MOBILE_COGNITO_USER_POOL_ID : ENV.COGNITO_USER_POOL_ID2,
        });
        try {
            const response = await client.send(re_auth);
            status_code = response.$metadata.httpStatusCode;
            is_valid['success'] = true;
            is_valid['msg'] = 'Refresh Auth';
            is_valid['token'] = response.AuthenticationResult.AccessToken;
        } catch (err) {
            const message = is_mobile ? `${err.message} (Mobile)` : err.message;
            console.log(message);
            is_valid["msg"] = message;
        }
    }
    res.status(status_code).send(is_valid);
};

/**
 * Handler Function - Sends custom email for password reset
 * @param {Object} req 
 * @param {Object} res 
 */
const resetPassword = async (req, res) => {
    const err_arr = validationResult(req)["errors"];
    let status_code = 401;
    const is_valid = {
        success: false,
        msg: err_arr.length > 0 ? String('').concat(err_arr.map((err, i) => i == (err_arr.length - 1) ? err.msg : `${err.msg}, `)) : ''
    };
    if (err_arr.length > 0) {
        res.status(status_code).send(is_valid);
        return;
    }

    const key_gen = require("generate-password");
    const temp_password = key_gen.generate({
        length: 64,
        numbers: true,
    });
    const set_password = new AdminSetUserPasswordCommand({
        Password: temp_password,
        Permanent: true,
        Username: req.body.email,
        UserPoolId: ENV.COGNITO_USER_POOL_ID2,
    });

    const initiateForgotPassword = (meta) => {
        return new ForgotPasswordCommand({
            Username: req.body.email,
            ClientId: ENV.COGNITO_CLIENT_ID2,
            ClientMetadata: meta,
        });
    };

    const get_user = new AdminGetUserCommand({
        Username: req.body.email,
        UserPoolId: ENV.COGNITO_USER_POOL_ID2,
    });

    // reset the password as admin to invalidate the existing one:
    // TODO: add error logging to file
    let response = null;
    try {
        response = await client.send(set_password);
    } catch (err) {
        console.log(err);
        is_valid["msg"] = err.message;
    }
    if (
        response &&
        response["$metadata"].httpStatusCode == 200 &&
        response["$metadata"].attempts <= 5
    ) {
        // get users name:
        const { UserAttributes } = await client.send(get_user);
        let given_name = null;
        let family_name = null;
        UserAttributes.forEach((val) => {
            if (val.Name == "given_name") given_name = val.Value;
            if (val.Name == "family_name") family_name = val.Value;
        });

        const remote_server = ENV.SITE_ADDRESS;
        const url = `${remote_server}/forgot/${req.body.email}/${temp_password}`;
        // pass the link to lambda (sendCutomEmail):
        try {
            const response = await client.send(
                initiateForgotPassword({
                    token: temp_password,
                    link: url,
                    name: (given_name && family_name) ? given_name.concat(" ", family_name) : req.body.email,
                })
            );
            if (response && response["$metadata"].httpStatusCode == 200) {
                status_code = 200;
                is_valid["success"] = true;
                is_valid["msg"] = `Password reset link was sent to ${req.body.email}`;
            }
        } catch (err) {
            console.log(err);
            is_valid["msg"] = err.message;
        }

    }
    res.status(status_code).send(is_valid);
};

module.exports = {
    adminGetUser,
    refreshToken,
    adminResetPassword: resetPassword
}
