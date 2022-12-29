
require('dotenv').config({ path: `${process.cwd()}/db.env` });
const ENV = process.env;

module.exports = function getConfig() {
    return {
        db: ENV.PG_DB,
        host: global.SERVER_NAME === 'dev' ? ENV.PG_HOST : ENV.PROD_HOST,
        pass: global.SERVER_NAME === 'dev' ? ENV.PG_PASS : ENV.PROD_PASS,
        port: ENV.PG_PORT,
        user: ENV.PG_USER,
        local_pass: ENV.LOC_PASS,
        local_user: ENV.LOC_USER
    }
};

