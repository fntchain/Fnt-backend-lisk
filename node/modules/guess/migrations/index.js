const path = require('path');
const fs = require('fs');

const updatesPath = path.join(__dirname, './sql');
const migrations = fs
    .readdirSync(updatesPath)
    .map(file => path.join(updatesPath, file));

module.exports = migrations