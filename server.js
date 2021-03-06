const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const package = require('./package.json');
const {PORT, DATABASE_URL} = require('./config');
const restaurantsRouter = require('./routers/restaurantsRouter');
const organizationsRouter = require('./routers/organizationsRouter');
const adminsRouter = require('./routers/adminsRouter');
const schedulesRouter = require('./routers/schedulesRouter');
const sessionsRouter = require('./routers/sessionsRouter');
//use ES6 promises
mongoose.Promise = global.Promise;
const app = express();

//for logging
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.get('origin'));
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});
app.use(express.static('public'));

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/public/index.html');
});
//route all /restaurants to restaurantsRouter.js
app.use('/restaurants', restaurantsRouter);
//route all /restaurants to organizationsRouter.js
app.use('/organizations', organizationsRouter);
//route all /restaurants to adminsRouter.js
app.use('/admins', adminsRouter);
//route all /schedules to schedulesRouter.js
app.use('/schedules', schedulesRouter);
//route all /sessions to sessionsRouter.js
app.use('/sessions', sessionsRouter);
//root of the website
// app.get('/', (req, res)=>{
// 	res.json({name: package.name, version: package.version});
// });
app.use('*', (req,res)=>{
	res.send('Address not found. Please check your URL.');
});

let server;

//connects to the db and starts the server
function runServer(databaseUrl=DATABASE_URL, port=PORT){
    return new Promise ((resolve, reject) => {
        //connect to the db first
        mongoose.connect(databaseUrl, err => {
            //if there is an error connecting, return the promise
            //with reject and the error
            if(err){
                return reject(err);
            }
            //if not, move on to starting a server
            server = app.listen(port, () => {
                console.log(`The app is listening on ${port}.`);
                resolve();
            })
            //if there is an error, disconnect server and return a reject
            .on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        });
    });
}

//disconnects from the db and close the server
function closeServer(){
    return mongoose.disconnect().then(() => {
        return new Promise ((resolve, reject) => {
            console.log('Closing the server.');
            //closing the server
            server.close(err => {
                //if there is an error, return a reject
                if(err){
                    return reject(err);
                }
                //if not, return a resolve
                resolve();
            });
        });
    });
}

//if server.js is directly called from node, we will invoke runServer
if(require.main === module){
    //if any error, catch it and log
    runServer().catch(err => console.error(err));
}

//exporting our app and the run and close functions for testing
module.exports = {app, runServer, closeServer};