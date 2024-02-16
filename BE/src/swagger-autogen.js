const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'});

const doc = {
  info: {
    version: '',            // by default: '1.0.0'
    title: '',              // by default: 'REST API'
    description: ''         // by default: ''
  },
  servers: [
    {
      url: 'http://localhost:3000/',              // by default: 'http://localhost:3000'
      description: 'Local Server'       // by default: ''
    },
    // { ... }
  ],
  tags: [                   // by default: empty Array
    {
      name: 'CRUD operations',             // Tag name
      description: ''       // Tag description
    },
    // { ... }
  ],
  components: {}            // by default: empty object
};


const outputFile = './swagger-output.json';
const routes = ['./routes/*.ts'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);