
const express = require('express');
const routes = require('./routes');
const mobile_routes = require('./routes/mobile');
const project_routes = require('./routes/projects');
const product_routes = require('./routes/products');
const user_routes = require('./routes/users');
const invite_routes = require('./routes/invites');
const admin_load_routes = require('./routes/admin_load');
const report_routes = require('./routes/reports');
const env = require('dotenv');

const getHost = (req, res, next) => {
    global.SERVER_NAME = req.get('host').split('.')[0];
    next();
};

(function main() {
    env.config({ path: './.env' });
    const app = express();
    const PORT = 8080 || process.env.PORT;
    const url = `http://localhost:${PORT}`;

    global.SERVER = app.listen(PORT, () => {
        console.log(`> Dev server on ${url}`);
    });

    app.all('/', (req, res) => {
        res.status(301).redirect('/api');
    });
    app.use('/+api', getHost, routes()); // routes would handle the /api.
    app.use('/invite', getHost, invite_routes());
    app.use('/mobile', getHost, mobile_routes());
    app.use('/projects', getHost, project_routes());
    app.use('/products', getHost, product_routes());
    app.use('/users', getHost, user_routes());
    app.use('/loads', getHost, admin_load_routes());
    app.use('/reports', getHost, report_routes());

    app.use('*', (req, res) => { res.status(400).end('Bad server request.') });
}());