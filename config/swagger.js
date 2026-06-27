const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'LAMS API Documentation',
            version: '1.0.0',
            description: 'Local Administration Management System - Complete API Reference'
        },
        servers: [
            { url: 'http://localhost:5000', description: 'Development Server' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsDoc(options);

const setupSwagger = (app) => {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'LAMS API Documentation'
    }));

    // Serve swagger JSON
    app.get('/api/docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
};

module.exports = setupSwagger;