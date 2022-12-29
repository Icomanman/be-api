
const express = require('express');
const cors = require('cors');

const { adminGetUser } = require('../../helpers/admin');
const createProject = require('./project_helpers/create_project');
const editProject = require('./project_helpers/edit_project');
const getProject = require('./project_helpers/get_projects');
const { endpoints } = require('./project_helpers/validations');

function projectsHandler() {
    // Instantiate the middleware to 'router'. Note that body-parser is already deprecated and is already built into express 4.xx
    const router = express.Router();
    router.use(cors());
    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    router.post('/edit', [adminGetUser], async (req, res) => {
        const edit_results = await editProject(req, res);
        res.status(edit_results.status).send({
            success: edit_results.success,
            msg: edit_results.msg,
        });
    });

    router.post('/new', [endpoints('create_project'), adminGetUser], async (req, res) => {
        const project_results = await createProject(req, res);
        res.status(project_results.status).send({
            success: project_results.success,
            msg: project_results.msg,
        });
    });

    router.get('/', adminGetUser, async (req, res) => {
        const project_results = await getProject(req, res);
        res.status(project_results.status).send({
            success: project_results.success,
            msg: project_results.msg,
            data: project_results.tracts,
        });
    });

    router.use('*', (req, res) => { res.status(400).end('Bad project request') });
    return router;
}

module.exports = projectsHandler;