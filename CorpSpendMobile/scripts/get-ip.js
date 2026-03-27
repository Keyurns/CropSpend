const os = require('os');
const fs = require('fs');
const path = require('path');

// Find the local IPv4 address
const interfaces = os.networkInterfaces();
let localIp = 'localhost';

for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
            localIp = iface.address;
            break;
        }
    }
}

// Create the config file content
const content = `export const API_URL = 'http://${localIp}:5000/api';\n`;

// Write to a constants file your app can use
const outputPath = path.join(__dirname, '../constants/Config.js');
fs.writeFileSync(outputPath, content);

console.log(`🚀 API Config updated! Mobile pointing to: http://${localIp}:5000/api`);