
const express = require('express');
const cors = require('cors');

const { adminGetUser } = require('../../helpers/admin');
const createProduct = require('./product_helpers/create_product');
const editProduct = require('./product_helpers/edit_product');
const getProducts = require('./product_helpers/get_products');
const { endpoints } = require('./product_helpers/validations');
const getMillsSpecies = require('./product_helpers/get_mills_species');

function productsHandler() {
    // Instantiate the middleware to 'router'. Note that body-parser is already deprecated and is already built into express 4.xx
    const router = express.Router();
    router.use(cors());
    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    router.post('/new', [endpoints('create_product'), adminGetUser], async (req, res) => {
        const project_results = await createProduct(req, res);
        res.status(project_results.status).send({
            success: project_results.success,
            msg: project_results.msg,
        });
    });

    router.post(/\/(edit|update)/, [endpoints('edit_product'), adminGetUser], async (req, res) => {
        const product_results = await editProduct(req, res);
        res.status(product_results.status).send({
            success: product_results.success,
            msg: product_results.msg,
        });
    });

    router.get('/', adminGetUser, async (req, res) => {
        const project_results = await getProducts(req, res);
        res.status(project_results.status).send({
            success: project_results.success,
            msg: project_results.msg,
            data: project_results.products,
        });
    });

    router.get(/\/(mills|species)/, adminGetUser, async (req, res) => {
        const mill_results = await getMillsSpecies(req, res);
        res.status(mill_results.status).send({
            success: mill_results.success,
            msg: mill_results.msg,
            data: mill_results.data
        });
    });

    router.get('/species', adminGetUser, async (req, res) => {
        const species_results = await getSpecies(req, res);
        res.status(species_results.status).send({
            success: species_results.success,
            msg: species_results.msg,
            data: species_results.mills
        });
    });

    router.use('*', (req, res) => { res.status(400).end('Bad product request') });
    return router;
}

module.exports = productsHandler;