// 'Semantic (module) Buffer'; just another layer of abstraction

const getConfig = require('./config');
const { Pool } = require('pg');

const { createTract, editTract, getTract, updateTract } = require('./commands/tract');
const { createProduct, updateProduct, getProduct } = require('./commands/product');

const initPool = (remote = true) => {
    const config = getConfig();
    const host = remote ? config.host : 'localhost';
    const user = remote ? config.user : config.local_user;
    const password = remote ? config.pass : config.local_pass;

    console.log('Server: ' + global.SERVER_NAME);
    console.log('DB Host: ' + host);

    return new Pool({
        database: config.db,
        port: config.port,
        application_name: 'spruce-api',
        host,
        user,
        password,
    });
};

function initProduct(dat = null, is_remote = true) {
    this.dat = dat;
    this.pool = initPool(is_remote);

    this.create = createProduct;
    this.get = getProduct;
    this.update = updateProduct;
    this.close = () => {
        (function waitPool(pool) {
            if (pool.totalCount < 1) {
                pool.end().then(() => console.log(`> Product closed.`));
            } else {
                setTimeout(() => {
                    waitPool(pool);
                }, 100);
            }
        })(this.pool);
    };
}

/**
 * Initializes a Tract instances via the new keyword
 * @param {Object} pool the postgres pool
 * @param {Object} dat the data passed from the front end
 */
function initTract(dat = null, is_remote = true) {
    this.dat = dat;
    this.pool = initPool(is_remote);

    this.create = createTract;
    this.get = getTract;
    this.update = updateTract;
    this.updateFromEdit = editTract;
    this.close = () => {
        (function waitPool(pool) {
            if (pool.totalCount < 1) {
                pool.end().then(() => console.log(`> Tract closed.`));
            } else {
                setTimeout(() => {
                    waitPool(pool);
                }, 250);
            }
        })(this.pool);
    };
}

module.exports = (db_table = 'tract', dat = null, is_remote = true) => {
    if (db_table == 'tract') return new initTract(dat, is_remote);
    else if (db_table == 'product') return new initProduct(dat, is_remote);
    else return initPool(is_remote);
};
