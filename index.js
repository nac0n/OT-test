var express = require('express');
var util = require('util');
var url = require('url')
var http = require('http');
var net = require('net');
var bodyParser = require('body-parser')
var app = express();
    app.use(express.static('static'));
    app.use(bodyParser.json()); 
    app.use(bodyParser.urlencoded( { 
      extended: true
    })); 
    var server = http.createServer(app);
    var tcpServer;

var ShareDB = require('sharedb');
var WebSocket = require('ws');
var WebsocketJSONStream = require('websocket-json-stream');

//This is the instantiation of our database. 
const db = require('sharedb-mongo')('mongodb://localhost:27017/test');
const backend = new ShareDB({ db });

var connection;
var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('form1.json', 'utf8'));
var port = 8080;

//Handling our view-engine
app.set('view engine', 'html');
app.set('views', 'views');
app.engine('html', require('ejs').renderFile);

app.get('/login', function (req, res, next) {
    res.render('login.html' , {
    });
});
app.get('/', function (req, res, next) {

    res.render('patient.html' , {
    });
});

//Starting the server by first initiating the existing database documents if needed which in our case would be the //patients. 
initiatePatients(startServer);
function initiatePatients(callback) {

    connection = backend.connect(); 

    //Create history log file
    fs.readFile(("./log/historylog.txt"), function (err) {
        if(err) {
            fs.writeFile("./log/historylog.txt", "", function() {
                console.log("Log file was created");
            });
        }
        else {
            console.log("Log file exists, did not create file again");
        }
    });

    //This code is how a patient is initiated but as we're initiating the patients on the client side (from //patient.html), we don't need to initiate them here.

    var oneDoc = connection.get('patients', 'Anita');
    oneDoc.fetch(function (err) {
        //console.log("Fetching doc!");
        if (err) throw err;
        if (oneDoc.type === null) {   
            oneDoc.create(obj);
            oneDoc.data
            return;
        }
    });

    callback();
}

//We start the server, this runs after we're running initiatePatients() as we run this with callback.
function startServer() {
    var wss = new WebSocket.Server({ server: server });
    wss.on('connection', function (ws) {
        console.log('user connected!')

        var stream = new WebsocketJSONStream(ws);
        ws.on('message', function (message) 
        {
            var messageJSONParsed = JSON.parse(message);
            console.log("MESSAGE!!!  ");
            console.log(util.inspect(messageJSONParsed));
            console.log("  !!!MESSAGE");

            historyLogging(message);
        });
        ws.on('close', function close() {
            console.log('A user disconnected');

        });
        backend.listen(stream);
    });

    //We create and run the tcp server to handle data coming from Node-red flow. TCP can be switched out with //websockets or similar. But we could not get it to work in our active time.
    tcpServer = net.createServer((c) => {
        // 'connection' listener
        console.log('client connected');

        c.on('end', () => {
            console.log('client disconnected');
        });

        //When data has been sent, this event occurs and we tell the database to change its' content.
        c.on('data', function (data) {
            var str_data = data.toString();
            var obj = JSON.parse(str_data);
        console.log(util.inspect(obj));
            if (typeof obj === 'object') {
                var str_value = obj.value.toString();
            }
            else {
                console.log("´obj´ variable isn't a JSON");
            }
            
            //We fetch the document requested by the node-red flow and apply new operations to it and thus send a //operation event for the client to handle.
            var doc = connection.get(obj.collection, obj.patient);
            doc.fetch(function(err) {
                if (doc.type != null) {
                   
                    if(obj.sender == "machine") {
                        if(obj.activity == "pulsrate") {
                            doc.submitOp({p:['formfields', 'pulsrate' ,'value'], od:doc.data.formfields.pulsrate.value, oi:str_value});
                            doc.submitOp({p:['formfields', 'pulsrate' ,'colorClass'], od:doc.data.formfields.pulsrate.colorClass, oi:obj.colorClass});
                            doc.submitOp({p:['formfields', 'pulsrate','sender'], od:doc.data.formfields.pulsrate.sender, oi:obj.sender});
                        }
                        else if(obj.activity == "oxygen") {
                            doc.submitOp({p:['formfields', 'oxygen', 'value'], od:doc.data.formfields.oxygen.value, oi:str_value});
                            doc.submitOp({p:['formfields','oxygen','colorClass'], od:doc.data.formfields.oxygen.colorClass, oi:obj.colorClass});
                            doc.submitOp({p:['formfields','oxygen','sender'],od:doc.data.formfields.oxygen.sender, oi:obj.sender});
                        }
                    }
                    else if(obj.sender == "man") {
                        console.log("Data comes from man");
                    }

                    else {
                        console.log("No sender... wait what?");
                    }
                }
            });
        });

        c.pipe(c);
    });

    // Starting the tcp-server.
    tcpServer.listen(1337, function() {
        console.log("Listening to TCP server on " + "1337");
    });
    // Starting the server.
    server.listen(port, function() {
        console.log('Listening on http://localhost:' + port);
    });
    
}

//Function for handling logging when there's been a message from the user.
function historyLogging (message) {
    var messageJSONParsed = JSON.parse(message);
    var collectionKey = messageJSONParsed['c'];
    var operationKey = messageJSONParsed['op'];
    var idKey = messageJSONParsed['d'];
    var time = new Date().getTime();
    var date = new Date(time);
    //If the source of 'message' is an operation, aka an user-made message
    if (operationKey !== undefined) 
    {
        // if (messageJSONParsed['c'] == 'usernames')
        // {
        //     var username = messageJSONParsed['d'];
        // }

        if (JSON.stringify(operationKey[0]['si']) && JSON.stringify(operationKey[1]) === undefined )
        {
            var addedValue = JSON.stringify(operationKey[0]['si']);
            fs.appendFile('./log/historylog.txt', "History: " + date.toString() + "  -  Added: " + addedValue + " , at field: " + idKey + " \n", function () {
                //
            });
        }

        else if (JSON.stringify(operationKey[0]['sd']) && JSON.stringify(operationKey[1]) === undefined ) 
        {
            var deletedValue = JSON.stringify(operationKey[0]['sd']);
            fs.appendFile('./log/historylog.txt', "History: " + date.toString() + "  -  Deleted: " + deletedValue + " , at field: " + idKey + " \n", function () {
                //
            });
        }

        else if (JSON.stringify(operationKey[0]['sd']) && JSON.stringify(operationKey[1]['si']))
        {
            var addedValue = JSON.stringify(operationKey[0]['sd']);
            var deletedValue = JSON.stringify(operationKey[1]['si']);
            fs.appendFile('./log/historylog.txt', "History: " + date.toString() + "  -  Replaced: " + addedValue + " with "  + deletedValue + " , at field: " + idKey + " \n", function () {
                // 
            });
        }
    }
}