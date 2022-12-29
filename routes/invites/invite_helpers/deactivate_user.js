
const ENV = process.env;
const { validationResult } = require('express-validator');
const {
    CognitoIdentityProviderClient,
    AdminDisableUserCommand,
    AdminEnableUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const updateFromUserPool = async (user_data, request_type) => {
    const client = new CognitoIdentityProviderClient({
        credentials: {
            accessKeyId: ENV.AWS_ACCESS_KEY_ID2,
            secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY2,
        },
        region: ENV.AWS_DEFAULT_REGION2,
        maxAttempts: 25
    });
    const { email, phone, user_type } = user_data;
    const user_pool_id = user_type === 'admin' ? ENV.COGNITO_USER_POOL_ID2 : ENV.MOBILE_COGNITO_USER_POOL_ID;
    const username = user_type === 'admin' ? email : phone.replace('+', '');
    let success = false;

    const disable_user = new AdminDisableUserCommand({
        Username: username,
        UserPoolId: user_pool_id
    });
    const enable_user = new AdminEnableUserCommand({
        Username: username,
        UserPoolId: user_pool_id
    });
    const send_command = request_type === 'deactivate' ? disable_user : enable_user;
    const pool_results = await client.send(send_command);
    if (pool_results.$metadata.httpStatusCode === 200) success = true;

    // mobile user pool (recursion):
    if (user_type === 'admin') {
        const mob_user = {};
        Object.assign(mob_user, user_data);
        mob_user['user_type'] = 'mobile';
        const user_status = await updateFromUserPool(mob_user, request_type);
        if (user_status) return { success: true };
    }
    return { success };
};

module.exports = async function (req, res) {
    const is_dev = ENV.USER != 'ubuntu' ? false : true;
    let status = 400;
    let success = false;
    let msg = '';
    const user_data = {};
    const request_type = (req.url).split('/')[1];
    const invite_status = request_type === 'deactivate' ? 'canceled' : 'accepted';
    const id = req.query.user_id ? req.query.user_id : null;
    const err_msg = validationResult(req)['errors'];

    if (err_msg.length > 0) {
        let messages = [];
        err_msg.forEach(err => { messages = messages.concat(err.msg) });
        msg = messages;
    } else if (id) {
        const initDb = require('../../../helpers/db_ops/init_db');
        const db_pool = initDb('invitations', null, is_dev);
        try {
            const invite_results = await db_pool.query('UPDATE invitations SET status = $1 WHERE id = $2 RETURNING *', [invite_status, id]);
            if (invite_results.rowCount === 1) {
                Object.assign(user_data, invite_results.rows[0]);

                const user_status = await updateFromUserPool(user_data, request_type);
                if (!user_status.success) throw new Error('Unable to update invite from the user pool.');

                msg = `Invited user successfully ${invite_status}.`;
                status = 200;
                success = true;
            } else {
                msg = 'User does not exists or already canceled.';
            }
        } catch (err) {
            console.log(err.message);
            msg = err.message;
        }
        db_pool.end(() => { console.log('> Invitation pool closed.') });
    }

    return { status, success, msg }
};