/**
 * A enigma.js sample showing how to connect to QIX using certificates and interacting with data.
 */

const enigma = require('enigma.js');
const Promise = require('bluebird');
const request = Promise.promisify(require('request'));

// Configuration
let config = require('./config');

// Table to check for
const TABLENAME = 'ASCII'

// Set up connection to QIX
let globalConnection = enigma.getService('qix', config.enigma);

// Fetch application list from QRS.
request(config.request).then(result => {
    return JSON.parse(result.body).filter(app => app.published) // We only want published apps.
})
.then(apps => apps.filter(app => app.stream.name !== 'Monitoring apps')) // You can probably skip the monitoring apps.
.then(apps => {
    return Promise.all(apps.map(app => {
        return globalConnection.then(qix => {
            return qix.global.openDoc(app.id).then(app => app);
        })
    }))
})
.then(apps => {
    // Filter apps to only return apps with a specific table name
    // This looks a bit funky...

    // Reduce our list of available apps
    return apps.reduce((previous, current) => {
        return previous.then(appsContainingTable => {
            return new Promise(resolve => {
                current.evaluate('concat({1} $Table, \'|\')').then(tables => {
                    if( tables.split('|').indexOf(TABLENAME) > -1) {
                        resolve(appsContainingTable.concat(current)) // if app contains table append to list
                    } else { 
                        resolve(appsContainingTable); // if not, return the list
                    };
                })
            })
        })
    }, Promise.resolve([])) // <-- First iteration return a promise that resolves a empty array.
})
.then(appsContainingTable => {
    // We now have a list of apps containing the table we are looking for.
    // Lets fetch some data for each app.
    return Promise.all(appsContainingTable.map(app => {
        return app.createSessionObject({
            qInfo: {
                qType: 'myobject'
            },
            qHyperCubeDef: {
                qDimensions: [{ 
                    qDef: { 
                        qFieldDefs: ['Dim1'] 
                    } 
                }],
                qInitialDataFetch: [{ qTop: 0, qLeft: 0, qWidth: 1, qHeight: 2000 }]
            }
        }).then(object => {
            return object.getLayout()
        })
    }))
})
.then(pagesOfData => {
    // do something
    console.log(pagesOfData);
    process.exit(1)
})
.catch(err => {
    // Handle error
    console.log(err);
    process.exit(1)
})