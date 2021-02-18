require('dotenv').config();
const aws = require('aws-sdk');
aws.config.update({ region: 'eu-west-1' });
const fs = require('fs');
const path = require('path');

const ses = new aws.SES({ apiVersion: '2010-12-01' });

const templatePromise = ses.listTemplates().promise();
templatePromise.then(function (data) {
  const templates = data.TemplatesMetadata.map((x) => x.Name);
  fs.readdirSync(path.join(__dirname, 'templates')).forEach(
    async (template) => {
      let indexFile;
      try {
        indexFile = require(path.join(
          __dirname,
          'templates',
          template,
          'index.js'
        ));
        if (typeof indexFile !== 'object') return;
      } catch (err) {
        return; // This isn't ready/complete
      }

      console.log();
      let params = {
        Template: {
          TemplateName: indexFile.name,
          SubjectPart: indexFile.subject,
          HtmlPart: await fs
            .readFileSync(
              path.join(__dirname, 'templates', template, 'index.html'),
              'utf-8'
            )
            .toString(),
          TextPart: await fs
            .readFileSync(
              path.join(__dirname, 'templates', template, 'index.txt'),
              'utf-8'
            )
            .toString(),
        },
      };

      if (templates.includes(template)) {
        await updateTemplate(params);
      } else {
        await createTemplate(params);
      }
    }
  );
});

let updateTemplate = async (t) => {
  ses
    .updateTemplate(t)
    .promise()
    .then(function (data) {
      console.log(`Updated template ${t.Template.TemplateName}`);
    })
    .catch((e) => console.error(e));
};

let createTemplate = async (t) => {
  ses
    .createTemplate(t)
    .promise()
    .then(function (data) {
      console.log(`Created template ${t.Template.TemplateName}`);
    })
    .catch((e) => console.error(e));
};
