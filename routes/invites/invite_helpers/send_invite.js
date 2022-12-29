
const ENV = process.env;
const key_gen = require("generate-password");
const {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminSetUserPasswordCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({
    credentials: {
        accessKeyId: ENV.AWS_ACCESS_KEY_ID2,
        secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY2,
    },
    region: ENV.AWS_DEFAULT_REGION2,
    maxAttempts: 25
});

async function sendSMSInvite(mob_user) {
    const app_link = ENV.SITE_ADDRESS;
    const { phone, name, sender } = mob_user;
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
        Message: `Hi ${name}, ${sender} invited you to join Spruce Mobile App (${app_link})`
    });

    try {
        const msg_response = await client.send(send_msg);
        if (msg_response.$metadata.httpStatusCode === 200) {
            console.log('SMS Invitation sent to ' + phone);
        }
    } catch (err) {
        console.log(err.message);
    }
}

module.exports = async function sendInvite(sender_data, user_data, invite_id = 'id') {
    const { email, given_name, family_name, phone, company, user_type, send_msg = true } = user_data;
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

    let msg = '';
    let success = false;

    const createUser = (meta) => {
        return new AdminCreateUserCommand({
            Username: user_type === 'admin' ? email : phone.replace('+', ''),
            UserPoolId: user_pool_id,
            ClientMetadata: meta,
            MessageAction: user_type === 'admin' ? null : 'SUPPRESS',
            UserAttributes: user_attr_arr,
            DesiredDeliveryMediums: ['EMAIL']
        });
    };

    let temp_password = key_gen.generate({
        length: 64,
        numbers: true
    });
    // temp_password = user_type.concat('-', temp_password);

    const force_change_password = new AdminSetUserPasswordCommand({
        Password: temp_password,
        Permanent: true,
        Username: username,
        UserPoolId: user_pool_id,
    });

    const remote_server = ENV.SITE_ADDRESS;
    const url = `${remote_server}/invite/${invite_id}/${email}/${temp_password}`;
    const create_user = createUser({
        admin_name: sender_data.name,
        invite_name: given_name,
        link: url
    });

    try {
        const cognito_results = await client.send(create_user);
        if (cognito_results.$metadata.httpStatusCode === 200) {
            msg = cognito_results.User.UserStatus;
            // const new_user_attr = cognito_results.User.Attributes;
            if (msg === 'FORCE_CHANGE_PASSWORD') {
                const password_results = await client.send(force_change_password);
                if (password_results.$metadata.httpStatusCode != 200) throw new Error('Force change password failed');
                msg = 'Password verified and set.';

                // SMS
                if (user_type === 'mobile' && send_msg) {
                    sendSMSInvite({ phone, name: given_name, sender: global.admin.name });
                }
            }
            success = true;
        }
    } catch (err) {
        console.log(err.message);
        msg = err.message;
        success = false;
    }
    return { success, msg };
}