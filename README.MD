		ShareDB OT project readme.txt

-------------------------------------------------------------
				Getting started
-------------------------------------------------------------
Github:
https://github.com/nac0n/OT-test

If you cloned from Github you need to add a \db\ and \log\ folder in root and a \dist\ folder in the \static\ folder.

See basicArchitecture.png for a general view of the project and how everything is connected.

	--------------------------------------------------
	IMPORTANT NOTE:
	Don't forget to check that all the ip-adresses point 
	to the desired adresses.
	--------------------------------------------------

Useful links:
	Node.js: https://nodejs.org
	MongoDB documentation: https://docs.mongodb.com/
	MongoDB community version download: https://www.mongodb.com/download-center#community
	ShareDB documentation: https://github.com/share/sharedb
	npm: https://www.npmjs.com/

- Install necessary things:
	- Node.js (v6.6.0 at the time)  https://nodejs.org
		Node.js is our main component in the OT-project using ShareDB and has several modules needed for this project.
		To install the modules you need to use "npm" which is included in the node.js installation. One such module is node-red but is one of the exceptions to the rest of the modules being installed (read under the "modules" section below).
		
	- MongoDB (Community version 3.2.10 at the time) https://www.mongodb.com/download-center#community
		Mongodb is our database for saving document information in the node.js module ShareDB (read more about ShareDB in their documentation here: https://github.com/share/sharedb)


-------------------------------------------------------------
				Installing Modules
-------------------------------------------------------------

Inside the package.json file we have several dependecies for the project which we can install with a simple npm command (npm install).

Firstly, open a terminal/command prompt window with admin rights and navigate to the folder containing the package.json file.
$ cd <path-to-the-package.json-file>

Inside this path; Type: 
$ npm install

This will install all dependecies that exists in the package.json file to a new folder called "node-modules". If there is a module missing that somehow didn't get installed. Try installing it with: 
$ npm install --save modulename
If you want to install additional modules, just use the previous command:
$ npm install --save modulename

If you're having problem installing the modules with npm and you're behind a proxy, try:
$ npm config set proxy http://<proxyadress>:<proxyport>

-------------------------------------------------------------
				Installing Node-red
-------------------------------------------------------------

Read more about node-red here:
https://nodered.org/

Node-red is a node.js module that this project use to simulate recieving data from external devices. It's installed locally on the test-machine to simulate the flows from another device onto the server using simple inject nodes but is also built to receive data from external sources via MQTT if there's a MQTT server installed locally and connected to.

Firstly, in a terminal/command prompt window, install the actual node-red module on your machine using the npm command: 

$ npm install -g node-red

This will install Node-red globally on your computer which allows you to access and run node-red from whichever folder you're in.

To allow an access to sharedb and mongodb from Node-red you need to first install the modules.
You do this with npm:

$ cd C:\Users\<username>\.node-red
$ npm install --save sharedb
$ npm install --save sharedb-mongo

Copy the settings.js file in this projects' "node-red-flows" folder and paste it in your .node-red folder.
If you paste the settings.js file in there, the node-red nodes will have access to the modules that you installed here.

-------------------------------------------------------------
				Starting the enviroment
-------------------------------------------------------------

To start off, using terminal/command prompt (admin), go to the MongoDB folder (in Windows):

$ cd C:\Program Files\MongoDB\Server\3.2\bin 

From here we want to start the mongoDB database to use with our project:

$ mongod --dbpath <dbpath>

<dbpath> means the path to .\OT-test\db\. This will put all your database files in that folder and start the database. You can access the database using the MongoDB shell located at C:\Program Files\MongoDB\Server\3.2\bin from which you then in terminal/command prompt type:
$ mongo 
...to start the mongo shell.

------

To run the Node.js server, open the project folder in terminal/command prompt as an admin and type (in Windows).

$ npm run build && npm start 

The server is started this way because we use Browserify to create a bundle.js file so that we can access modules from the client script. Otherwise you usually start a node.js server with:
$ node <servername.js>
But we do not start the server this way because of Browserify.

If there was an error, try reading the readme over again.
If theres no error, go to localhost:8080 in the browser and the test-enviroment html page should be up and running with Operational Transformation if you type inside a field (It works if there's things being logged in the server console.)

---
	Running Node-red 
	(Do this after you've started the Node.js server)
Open a terminal/command prompt as admin and just type:
$ node-red
As we installed node-red globally on the computer you don't need to run it from a certain folder.

Go to localhost:1880 in the browser.

Import the flow in the node-red flow folder by going to Import > Clipboard in the top right corner menu and paste the text.

Make sure that the TCP is connected, otherwise, check its' settings.

-------------------------------------------------------------
				Projects' main components
-------------------------------------------------------------

.\db\
Our database folder, this will contain all the files that the MongoDB needs when started.

.\log\
This is our logging folder which contains a .txt. This gets filled with everything passing through the socket-stream.

.\views\
Our html views. In this test-project we use the module "ejs" as a view-engine of type html to render pages and allows growth of the project.

.\form1.json\
An .json that contains the basic structure of how we want the documents in our database to look like. The real instanciation though, occurs in our patient.html. This .json file is just here incase you want to test commented code which use the .json.

.\static\javascript.js
Our client-sided code.

.\index.js
Our server-sided code. This starts up the server, takes care of listening to the stream and connecting to node-red via tcp by creating a tcp-server, etc.
