
const ENV = process.env;
const {
    CognitoIdentityProviderClient,
    AdminGetUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({
    credentials: {
        accessKeyId: ENV.AWS_ACCESS_KEY_ID2,
        secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY2,
    },
    region: ENV.AWS_DEFAULT_REGION2,
    maxAttempts: 25
});

/**
 * for quick check of Cognito users from the user pool
 * @param {Object} req 
 * @param {Object} res 
 */
async function getCognitoUser(req, res) {
    let status_code = 401;
    let msg = 'Invalid Token';
    let success = false;
    const user_data = {};
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
    const { email, phone, user_type } = req.body;
    const user_pool = user_type === 'mobile' ? ENV.MOBILE_COGNITO_USER_POOL_ID : ENV.COGNITO_USER_POOL_ID2;
    if (token) {
        const username = user_type === 'mobile' ? phone.replace('+', '') : email;
        try {
            const user_results = await client.send(new AdminGetUserCommand(
                {
                    Username: username,
                    UserPoolId: user_pool
                }
            ));
            console.log(`> Cognito user fetched: ${user_results.Username}`);
            status_code = user_results.$metadata.httpStatusCode;
            success = true;
            msg = 'User found';
            Object.assign(user_data, { user_name: username });
        } catch (err) {
            console.log(err.message);
        }
    } else {
    }
    return { status: status_code, success, msg, user_data };
};

module.exports = getCognitoUser;