$(document).ready(function () {
    
    //These requires are made possible because of Browserify. If you get an error trying to require them, check to see
    //if broswerify is installed and running. Also make sure you run the server with the 'npm run build && npm start' command
    var sharedb = require('sharedb/lib/client');
    var StringBinding = require('sharedb-string-binding');
    var socket = new WebSocket('ws://' + 'localhost:8080/');
    var socket2;
    var connection = new sharedb.Connection(socket);
    var elementId;
    var patientID;
    var doc;

    $('#paused-icon').show();
    $('#syncing-icon').hide();

    //As ShareDB uses a pub-sub system. we need to subscribe to changes in the server from our client.
    function subscribeToPatientFields (patientID) {
        doc = connection.get('patients', patientID);

        doc.subscribe(function (err) {
            if (err) throw err;
            for (var key in doc.data.formfields)
            {
                subscribeToAllFields(document.querySelector('#' + key), doc);
            }
            
            doc.on('op', function (source, err) {
                //if(err) throw err;
                console.log("Operation!");
                operationChanged(source);

            });
        });
    };

    //Initiate our documents for usage. This function is called in "patient.html".
    function initCollection(patientID, text) {
        var obj = JSON.parse(text);
        console.log(obj);
        var doc = connection.get('patients', patientID);
        if(doc.data == null) {
            console.log(doc);
            doc.create(obj);
            return;
        }
    };

    //Set initial value to each field in the document.
    function subscribeToAllFields (element, docitem) {
        if(element != null) {
            elementId = element.id;
            if((typeof element.value) == 'string') {
                console.log(element);
                var binding = new StringBinding(element, docitem, ['formfields', elementId ,'value']);
                binding.setup();
            }
            else if(elementId === "activeRadioButton") {
                setradiobutton();
            }
            
            else if (elementId == "checklistButtonsId") {
                setChecklistButtons();
            }
        }
        else {
            console.log("Element is null");
        }
    };

     //Send a radiobutton operation event to the database. After the operation, the value will be 
    //stored in the database.

    $("input[name='inlineRadioOption']").change(function () {
        var value = $('input[name=inlineRadioOption]:checked', '#activeRadioButton').val();
        doc.submitOp([{p:['formfields','activeRadioButton'], od:doc.data.formfields.activeRadioButton, oi:value}]);
    });

    //Send a checkBox operation event to the database. After the operation, the value will be 
    //stored in the database.
    $("input[name='checklistOption']").change(function () {
        var elementChecked = $(this)[0];
        if(elementChecked.checked === true) {
            doc.submitOp([{p:['formfields','checklistButtonsId', elementChecked.value], oi:true}]);
        }
        else if(elementChecked.checked === false) {
            doc.submitOp([{p:['formfields','checklistButtonsId', elementChecked.value], oi:false}]);
        }
    });

    //Not working as intended but is kept for testing.
    function removePatient(patientID) {
        var doc = connection.get('patients', patientID);

        doc.fetch(function (err){
            if (err) throw err;
            if(doc.type != null) {
                console.log("Not null");
                doc.del(function () {
                        console.log("deleted document");
                });
            }
        });
    };

    //Incoming messages from Node-red is set here.
    function setREDPushValue(elementId) {
        if(doc.id != null) {
            //console.log(elementId);
            
            if(elementId == "pulsrate") {
                var value = doc.data.formfields.pulsrate.value;
                $('#pulsrate').val(value);
                $('#'+elementId).attr('class', doc.data.formfields.pulsrate.colorClass);
            }

            else if(elementId == "oxygen"){
                var value = doc.data.formfields.oxygen.value;
                $('#oxygen').val(value);
                $('#'+elementId).addClass(doc.data.formfields.oxygen.colorClass);
            }
        }
    }

    //After an operation has been ran. This function will set the radiobutton to a new value according to database.
    function setradiobutton() {
        var value = doc.data.formfields.activeRadioButton;
        switch (value) {
            case "1":
                $('#inlineRadio1').prop("checked",true);
            break;
            case "2":
                $('#inlineRadio2').prop("checked",true);    
            break;
            case "3":
                $('#inlineRadio3').prop("checked",true);
            break;
        }
    };

    //After an operation has been ran. This function will set the checkboxes to a new value according to database.
    function setChecklistButtons () {
        var docChecklist = doc.data.formfields.checklistButtonsId;
        for(var key in docChecklist) {
            if(docChecklist[key] === true) {
                var element = document.querySelector("#" + key + "box");
                document.getElementById(element.id).checked = true;
            }
            else {
                var element = document.querySelector("#" + key + "box");
                document.getElementById(element.id).checked = false;
            }
        }   
    };

    //Creating a custom event.
    function operationChanged(state) {
        var evt = new CustomEvent('operationChanged', { detail: state });
        window.dispatchEvent(evt);
    }

    //Calling event that makes it possible to embed the project. Put functions that triggers by operations in here.
    window.addEventListener('operationChanged', function (e) {
        setREDPushValue(e.detail[0].p[1]);
    });

    //Get the currently active doc.
    function getDoc() {        
        return doc;
    }

   $('#paused-icon').click(function() {
        doc.submitOp([{p:['syncing'], od:doc.data.syncing, oi:true}]);
        $('#paused-icon').hide();
        $('#syncing-icon').show();
   });

   $('#syncing-icon').click(function() {
        doc.submitOp([{p:['syncing'], od:doc.data.syncing, oi:false}]);
        $('#paused-icon').show();
        $('#syncing-icon').hide();
   });

  //   function changeColorAtField (elementID,sender) {
        // // var color;
        // // if(sender == "puls") {
        // //   color = doc.data.formfields.pulsrate.color;
        // // }
        // // else if(sender == "oxygen") {
        // //   color = doc.data.formfields.oxygen.color;
        // // }
        // // else {
        // //   color = 'red';
        // // }

        // // $('#'+elementID).css('border-color', color);
        // // document.getElementById("MyElement").className += sender.class;
  //   }

    //Make functions global for usage outside the .js file.
    global.subscribeToPatientFields = subscribeToPatientFields
    global.initCollection = initCollection;
    global.removePatient = removePatient;
    global.getDoc = getDoc;

});