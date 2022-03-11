const { writeFile } = require('fs');
const { argv } = require('yargs');
// read environment variables from .env file
require('dotenv').config();
// read the command line arguments passed with yargs
const environment = argv.environment;
// Configure Angular `environment.ts` file path
const baseEnvFile = './src/assets/config.json';
// Load node modules
const colors = require('colors');

// `config.ts` file structure - this should match the Release pipeline variable name
const envConfigFile = `{
  "apiBaseUrl": "${process.env.API_BASE_URL}"
}`;

if (process.env.hasOwnProperty('API_BASE_URL')) {
  console.log(colors.magenta('The file config.json will be written with the following content: \n'));
  console.log(colors.grey(envConfigFile));
  writeFile(baseEnvFile, envConfigFile,  (err: string) => {
    if (err) {
      throw console.error(err);
    } else {
     console.log(colors.magenta(`Config file generated to ${baseEnvFile} \n`));
    }
  });
}
