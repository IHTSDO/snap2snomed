/*
 * Copyright © 2022 SNOMED International
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
