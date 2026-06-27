const fs = require('fs');
const path = require('path');

const emailTemplateService = {
    loadTemplate: (templateName) => {
        const filePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
        return fs.readFileSync(filePath, 'utf-8');
    },

    render: (template, data) => {
        let html = template;
        for (const [key, value] of Object.entries(data)) {
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return html;
    },

    getWelcomeEmail: (data) => {
        const template = emailTemplateService.loadTemplate('welcome');
        return emailTemplateService.render(template, data);
    }
};

module.exports = emailTemplateService;