$(document).ready( function() {

  $('#loginform').submit(function(){

	var usernamevalue = $("#username").val();
	var passwordvalue = $("#password").val();

  	var data = {
  		type: "login",
  		username: usernamevalue,
  		pass: passwordvalue
  	};

  	console.log(data)

    $.post('/' , data, function() {
    	window.location = '/patient';
    });

    return false;
  });

   $('#createuserform').submit(function(){

	var usernamevalue = $("#createusername").val();
	var passwordvalue = $("#createpassword").val();

   	var data = {
  		type: "createuser",
  		username: usernamevalue,
  		pass: passwordvalue
  	};

  	console.log(data)

    $.post('/' , data, function() {
    	//created user
    });

    return false;
  });


});