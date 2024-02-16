import { Application } from 'express';

const path = require('path');

const express = require('express');
// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
const cors = require('cors');

export const expressInit = (app: Application) => {
    if (typeof app.use !== 'function'
        || typeof app.set !== 'function') {
        throw new Error('Invalid app');
    }

    app.use(bodyParser.urlencoded({
        extended: true,
    }));

    app.use(bodyParser.json());

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:8100');
        res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
        res.header('Access-Control-Allow-Origin', 'http://localhost:8100/');
        res.header('Access-Control-Allow-Origin', 'capacitor://localhost');
        res.header('Access-Control-Allow-Origin', 'ionic://localhost');
        res.header('Access-Control-Allow-Origin', 'http://localhost');
        res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
        res.header('Access-Control-Allow-Origin', 'http://localhost:8080/');
        res.header('Access-Control-Allow-Methods', 'DELETE, POST, GET, OPTIONS');
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', '*');

        next();
    });

    app.use(cors());
    app.use('/static', express.static(path.join(__dirname, '../../public')));
};