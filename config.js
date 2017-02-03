const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// The QIX schema needed by enigma.js
const schema = require('./node_modules/enigma.js/schemas/qix/3.1/schema.json');

// Certificates.
const certificateDir = 'C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates';
const certificates = {
    ca: fs.readFileSync(path.resolve(certificateDir, 'root.pem')),
    key: fs.readFileSync(path.resolve(certificateDir, 'client_key.pem')),
    cert: fs.readFileSync(path.resolve(certificateDir, 'client.pem'))
}

// User that is being passed to QIX and QRS
const USERDIRECTORY = 'INTERNAL';
const USER = 'sa_repository';

// Hostname
const hostname = 'usrad-aklprobook';

const config = {
    enigma: {
        schema: schema,
        session: {
            host: hostname,
            port: 4747,
        },
        createSocket(url) {
            return new WebSocket(url, {
                ca: [certificates.ca],
                key: certificates.key,
                cert: certificates.cert,
                headers: {
                    'X-Qlik-User': `UserDirectory=${USERDIRECTORY};UserId=${USER}`,
                }
            });
        }
    },
    // Fetch application list from QRS.
    request: {
        url: `https://${hostname}:4242/qrs/app?xrfkey=abcdefghijklmnop`,
        ca: [certificates.ca],
        cert: certificates.cert,
        key: certificates.key,
        headers: {
            'X-Qlik-User': `UserDirectory=${USERDIRECTORY};UserId=${USER}`,
            'X-Qlik-Xrfkey': 'abcdefghijklmnop'
        }
    }
}

module.exports = config;