
const ENV = process.env;
const { CognitoIdentityProviderClient,
    AdminConfirmSignUpCommand,
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AdminSetUserPasswordCommand,
    AdminUpdateUserAttributesCommand
} = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({
    credentials: {
        accessKeyId: ENV.AWS_ACCESS_KEY_ID2,
        secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY2,
    },
    region: ENV.AWS_DEFAULT_REGION2,
    maxAttempts: 25
});

async function addToUserPool(user_data, action = 'new') {
    const { email, given_name, family_name, phone, company, user_type, password } = user_data;
    let success = false;
    let new_user = {};
    let msg = null;
    const user_pool_id = user_type === 'admin' ? ENV.COGNITO_USER_POOL_ID2 : ENV.MOBILE_COGNITO_USER_POOL_ID;
    const username = user_type === 'admin' ? email : phone.replace('+', '');
    const user_attr_arr = [
        { Name: 'given_name', Value: given_name },
        { Name: 'family_name', Value: family_name },
        { Name: 'email', Value: email },
        { Name: 'phone_number', Value: phone },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'phone_number_verified', Value: 'true' },
        { Name: 'custom:user_type', Value: user_type },
        // { Name: 'custom:company_name', Value: company }
    ];

    const confirm_user = new AdminConfirmSignUpCommand({
        Username: email,
        UserPoolId: user_pool_id,
    });

    const force_change_password = new AdminSetUserPasswordCommand({
        Password: password,
        Permanent: true,
        Username: username,
        UserPoolId: user_pool_id,
    });

    const signup_user = new AdminCreateUserCommand({
        Username: username,
        UserPoolId: user_pool_id,
        MessageAction: 'SUPPRESS',
        UserAttributes: user_attr_arr
    });

    const update_user = new AdminUpdateUserAttributesCommand({
        Username: username,
        UserPoolId: user_pool_id,
        UserAttributes: user_attr_arr
    });

    const send_command = action === 'modify' ? update_user : signup_user;
    try {
        const cognito_results = await client.send(send_command);
        if (cognito_results.$metadata.httpStatusCode === 200) {
            if (action === 'modify') {
                msg = '> Cognito user successfully updated';
                console.log('> Cognito user successfully updated');
            } else {
                msg = cognito_results.User.UserStatus;
                new_user_attr = cognito_results.User.Attributes;
                new_user_attr.forEach(attr => {
                    new_user[attr.Name] = attr.Value;
                });
                if (msg === 'FORCE_CHANGE_PASSWORD') {
                    const password_results = await client.send(force_change_password);
                    if (password_results.$metadata.httpStatusCode != 200) throw new Error('Force change password failed');
                    msg = 'Password verified and set.';
                }
            }

            // for Admin-Mobile user addition (recursion):
            if (user_type === 'admin') {
                const mob_user = new Object(user_data);
                mob_user['user_type'] = 'mobile';
                const { success, msg } = await addToUserPool(mob_user, action);
                if (!success && msg != 'Password verified and set.') {
                    console.log('> with message: ' + msg);
                    throw new Error(`> ERR. Admin-Mobile user addition failed (${email}).`);
                }
            }
            success = true;
        }
    } catch (err) {
        console.log(err.message);
        msg = err.message;
        success = false;
    }
    return { success, msg, new_user };
}

async function deleteFromUserPool(username, user_type, phone = null) {
    let success = false;
    let new_user = {};
    let msg = null;
    const user_pool_id = user_type === 'admin' ? ENV.COGNITO_USER_POOL_ID2 : ENV.MOBILE_COGNITO_USER_POOL_ID;

    const delete_user = new AdminDeleteUserCommand({
        Username: username,
        UserPoolId: user_pool_id
    });

    try {
        const cognito_results = await client.send(delete_user);
        if (cognito_results.$metadata.httpStatusCode === 200) {
            // for Admin-Mobile user addition (recursion):
            if (user_type === 'admin' && phone) {
                const mob_user = phone.replace('+', '');
                mob_user['user_type'] = 'mobile';
                const mob_user_results = await client.send(
                    new AdminDeleteUserCommand({
                        Username: mob_user,
                        UserPoolId: ENV.MOBILE_COGNITO_USER_POOL_ID
                    })
                );
                if (mob_user_results.rowCount === 1) console.log('> Cognito (mobile) user successfully deleted');
            }
            success = true;
            msg = '> Cognito user successfully deleted';
        }
    } catch (err) {
        console.log(err.message);
        msg = err.message;
    }
    return { success, msg, new_user };
}

module.exports = { addToUserPool, deleteFromUserPool };