
const ENV = process.env;
const getTemplate = require('../../../helpers/db_ops/data_templates');
const { pushTicket } = require('./../../../helpers/db_ops/commands/ticket');
const { validationResult } = require('express-validator');

const encodeData = raw_file => {
    let img_data = null;
    const fs = require('fs');
    const path = require('path');
    fs.readFile(path.resolve(process.cwd(), 'tmp/product-card.png'), (err, data) => {
        if (err) console.log(err);
        else {
            img_data = Buffer.from(raw_file).toString('base64');
            fs.writeFileSync(`${__dirname}/base-64.png`, img_data, 'base64');
        }
    });
    return img_data;
};

const initS3 = async (data_obj, name_key = 'ticket-0000') => {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
    const client = new S3Client({
        bucketEndpoint: true,
        forcePathStyle: true,
        credentials: {
            accessKeyId: ENV.AWS_ACCESS_KEY_ID2,
            secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY2,
        },
        region: ENV.AWS_DEFAULT_REGION2,
        maxAttempts: 5
    });

    const put_command = new PutObjectCommand({
        Body: data_obj,
        Bucket: `spruce-tickets.s3.${ENV.AWS_DEFAULT_REGION2}.amazonaws.com`,
        Key: name_key
    })
    return await client.send(put_command);
};

async function applyTicket(req, res) {
    const err_arr = validationResult(req)['errors'];
    let status_code = 400;
    const is_valid = {
        success: false,
        msg: err_arr.length > 0 ? String('').concat(err_arr.map((err, i) => i == (err_arr.length - 1) ? err.msg : `${err.msg}, `)) : ''
    };
    if (err_arr.length > 0) {
        console.log(`> (ERR: tickets.js line 50) ${is_valid['msg']}.`);
    } else {
        const data = req.body;
        const allowed_keys = Object.keys(getTemplate('ticket'));
        const is_dev = ENV.USER != 'ubuntu' ? false : true;
        const ticket_data = {};
        allowed_keys.forEach(key => {
            ticket_data[key] = data[key];
        });
        const new_ticket = await pushTicket(ticket_data, is_dev);
        status_code = new_ticket.status;
        is_valid['msg'] = new_ticket.msg;
        is_valid['success'] = new_ticket.success;
        is_valid['ticket_key'] = new_ticket.ticket_key;
    }
    return { status: status_code, is_valid }
}

async function uploadTicketPhoto(req, res) {
    const err_arr = validationResult(req)['errors'];
    let status_code = 400;
    const is_valid = {
        success: false,
        msg: err_arr.length > 0 ? String('').concat(err_arr.map((err, i) => i == (err_arr.length - 1) ? err.msg : `${err.msg}, `)) : ''
    };
    if (err_arr.length > 0) {
        console.log(`> (ERR: tickets.js line 76) ${is_valid['msg']}.`);
    } else {
        try {
            const { tract_key, load_key } = req.body;
            const timestamp = parseInt(new Date() / 1000);
            const file = req.file.buffer;
            const file_type = (req.file.mimetype).split('/')[1];
            const file_name = `${tract_key}_${load_key}_${timestamp}.${file_type}`;

            const upload_results = await initS3(file, file_name);

            status_code = upload_results.$metadata.httpStatusCode;
            is_valid['tag'] = (upload_results.ETag).replace(/"/g, '');
            is_valid['version'] = upload_results.VersionId;
            is_valid['file_name'] = file_name;
            is_valid['success'] = true;
            is_valid['msg'] = 'Ticket upload successful';
        } catch (err) {
            is_valid['msg'] = err.message;
            console.log(err.message);
        }
    }
    return { status: status_code, is_valid };
}

module.exports = {
    applyTicket,
    uploadTicketPhoto
}