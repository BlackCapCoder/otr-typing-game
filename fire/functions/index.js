const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

global.counter = 0;

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send(String(++global.counter));
});
