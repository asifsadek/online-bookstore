const dotenv = require('dotenv');
const express = require('express');
const chalk = require('chalk');

const dotenvParsed = dotenv.config();
if(dotenvParsed.error) {
    throw dotenvParsed.error;
}
console.log('Environment variables:', chalk.bold(JSON.stringify(dotenvParsed.parsed, null, 4)));

const app = express();
const router = require('./routes/index');
router(app);

app.listen(process.env.PORT, () => {
    console.log(`App running on port ${process.env.PORT}.`);
});
