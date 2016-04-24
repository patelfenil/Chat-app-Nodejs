var express = require('express'),
	app=express(),
	server=require('http').createServer(app),
	io=require('socket.io').listen(server),
	mongodb=require('mongodb').MongoClient;
//var session = require('express-session');
server.listen(3000);
//var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(express);
var currentUser;
app.use(express.cookieParser());
var sessionMiddleware=require("express-session")({
  store: new MongoStore({
    url: 'mongodb://localhost/chat'
  }),
  secret: '1234567890QWERTY'
});
app.use(sessionMiddleware);
app.use(express.bodyParser());
var sharedsession = require("express-socket.io-session");
io.use(sharedsession(sessionMiddleware));
//app.use(session({secret: 'ssshhhhh'}));
app.get('/signup',function(req,res){
	if(req.session.name)
		res.redirect('/');
	else
	res.render(__dirname + '/signup.jade');

});
app.get('/logout',function(req,res){
	req.session.destroy();
	res.render(__dirname + '/login.jade');

});
app.get('/login',function(req,res){
	if(req.session.name)
		res.redirect('/');
	else
	res.render(__dirname + '/login.jade');
});
app.get('/chat',function(req,res){
	if(req.session.name)
	{
		//console.log(req.query.id);
		mongodb.connect('mongodb://localhost/chat',function(err,db){
			if(err)
				console.log(err);
			else
			{
				var collection = db.collection('user');
				//console.log("from inside" + req.query.id);
			    var stream = collection.find({ mobilenumber : req.query.id }).toArray(function(err,docs){
			    	console.log(docs);
			    	
			    	if(!err)
			    	{
			    		var messageCollection = db.collection('message');
			    		var conversationId1 = req.session.mobilenumber + req.query.id ; 
			    		var conversationId2 = req.query.id + req.session.mobilenumber ;
			    		var conversationId;
			    		if(req.session.mobilenumber<req.query.id)
			    			conversationId=req.session.mobilenumber+req.query.id;
			    		else
			    			conversationId=req.query.id+req.session.mobilenumber;
			    	    var messageQuery = messageCollection.find(  { $or: [ { conversationId : conversationId1 } , { conversationId : conversationId2 } ] } ).toArray(function(err,msg){
			    	    console.log(msg.length);
			    		var conv = new Array();
				    	for(var i=0;i<msg.length;i++)
				    	{
				    		 conv.push({ msg : decryptMessage(msg[i].msg,conversationId) , sender : msg[i].sender , reciever : msg[i].reciever });
				    	}
				    	console.log("conv" + conv.length);
				    	res.render(__dirname + '/chat.jade',{ friendName  : docs[0].name , friendNumber : docs[0].mobilenumber , friendId : docs[0]._id  , mobilenumber : req.session.mobilenumber , name : req.session.name , messages : conv });

			    	    });
			    	}
			    	
			    });
			}
		});
	}
	else
	res.render(__dirname + '/login.jade');
});
var conv=new Array();
app.get('/',function(req,res){
	if(req.session.name)
	{
		mongodb.connect('mongodb://localhost/chat',function(err,db){
			if(err)
				console.log(err);
			else
			{
				var collection = db.collection('user');
			    var stream = collection.find().toArray(function(err,docs){
			    	//console.log(docs);
			    	
			    	if(!err)
			    	{
			    		var conv = new Array();
				    	for(var i=0;i<docs.length;i++)
				    	{
				    		if(req.session.mobilenumber!=docs[i].mobilenumber)
				    		 conv.push({ name : docs[i].name , id : docs[i]._id , mobilenumber : docs[i].mobilenumber});
				    	}
				    	console.log(conv);
				    	res.render(__dirname + '/index.jade',{ friends  : conv ,name : req.session.name});
			    	}
			    	
			    });
			    // var i=0;
			    // var conv = new Array();
			    //  stream.on('data',function(chat){
			    //     conv.push(chat.msg);
			    //  	//console.log(conv);
			    //  });
			    // console.log(window.conv);
				
			}
		});
		
	}
	else
	res.render(__dirname + '/login.jade');
});
app.post('/signup',function(req,res){
	console.log(req.session.name);
	if(req.session.name)
	{
		console.log("hello");
		res.redirect('/');
	}
	else
	{
	mongodb.connect('mongodb://localhost/chat',function(err,db){
		if(err)
			console.log(err);
		else
		{
			
			console.log("hey");
			
			//console.log("Coneected to mongodb");
		     var collection = db.collection('user');
		     var query = collection.find({mobilenumber : req.body.mobilenumber}).toArray(function(err,docs){
		     	console.log(docs.length);
		     	if(docs.length==0)
		     	{
		     		req.session.mobilenumber=req.body.mobilenumber;
			        req.session.name=req.body.name;

		     		collection.insert({ name : req.body.name , password : req.body.password ,mobilenumber : req.body.mobilenumber},function(err)
			     	{
				 	if(err)
				  		console.warn(err);
				  	else
				  		console.log("New User Registered");
				    });
				    res.redirect('/');
		     	}
		     	else
		     	{
		     		var err = "An account with given mobile number already exists.";
			 	    res.render(__dirname + '/signup.jade',{ err  : err });

		     	}
		     });
		     
		     

		}
	   });
	}
});

app.post('/login',function(req,res){
	console.log(req.session.name);
	if(req.session.name)
	{
		//console.log("hello");
		res.redirect('/');
	}
	else
	{
	mongodb.connect('mongodb://localhost/chat',function(err,db){
		if(err)
			console.log(err);
		else
		{
			
			//console.log("hey");
			
			//console.log("Coneected to mongodb");
		     var collection = db.collection('user');
		     var query = collection.find({mobilenumber : req.body.mobilenumber}).toArray(function(err,docs){
		     	console.log(docs.length);
		     	if(docs.length==1)
		     	{
		     		console.log(docs[0].password);
		     		if(docs[0].password==req.body.password)
		     		{
		     			req.session.mobilenumber=req.body.mobilenumber;
			            req.session.name=docs[0].name;
			            res.redirect('/');
		     		}
		     		else
		     		{
		     			var err = "Invalid Password";
		     			res.render(__dirname + '/login.jade',{ err  : err });
		     		}    
		     	}
		     	else
		     	{
		     		var err = "Invalid Mobile Number or Password";
			 	    res.render(__dirname + '/login.jade',{ err  : err });
		     	}
		     });
		     
		     

		}
	   });
	}
});
// app.use(session({
//   cookieName: 'session',
//   secret: '12sbhedc$#@5tssag',
//   duration: 30 * 60 * 1000,
//   activeDuration: 5 * 60 * 1000,
// }));

io.sockets.on('connection',function(socket){
	socket.on('initials',function(){
		mongodb.connect('mongodb://localhost/chat',function(err,db){
			if(err)
				console.log(err);
			else
			{
				console.log("Coneected to mongodb");
				var collection = db.collection('message');
				var stream = collection.find().stream();
				stream.on('data',function(chat){io.sockets.emit('new message',chat.msg); })
			}
		});
	});
	
	socket.on('send message',function(data){
		mongodb.connect('mongodb://localhost/chat',function(err,db){
		if(err)
			console.log(err);
		else
		{
			//console.log("Coneected to mongodb");
			//console.log(socket.handshake.session.user);
			var collection = db.collection('message');
			//console.log(data.reciever + socket.handshake.session.user  + data//);
			var conversationId;
			if(socket.handshake.session.mobilenumber>data.reciever)
				conversationId = data.reciever+socket.handshake.session.mobilenumber;
			else
				conversationId = socket.handshake.session.mobilenumber + data.reciever;

			encryptedMessage = encryptMessage(data.msg,conversationId);
			collection.insert({ msg : encryptedMessage , sender : socket.handshake.session.mobilenumber , reciever : data.reciever , conversationId : conversationId },function(err){
				if(err)
					console.warn(err);
				else
					console.log("New msg inserted");
			});
		}
	   });
		data.senderName = socket.handshake.session.name;
		data.senderMobileNumber = socket.handshake.session.mobilenumber;
		io.emit('new message',data);
		//socket.broadcast.emit('new message',data);
	});
	socket.on('signup',function(data){
		mongodb.connect('mongodb://localhost/chat',function(err,db){
		if(err)
			console.log(err);
		else
		{
			console.log(data[0]);
			//console.log("Coneected to mongodb");
		    var collection = db.collection('user');
		    collection.insert({ name : data[0] , password : data[1] },function(err){
			 	if(err)
			 		console.warn(err);
			 	else
			 		console.log("New User Registered");
			 });
		}
	   });
		//io.sockets.emit('new message',data);
		//socket.broadcast.emit('new message',data);
	});
});
function encryptMessage(msg,cid)
{
	var cid1 = parseInt(cid.substr(0,10));
	var cid2 = parseInt(cid.substr(10,10));
	//alert(cid1);
	//alert(cid2);
	var matrix = new Array();
	for (var i=0;i<9;i++)
	{
		if(i<5)
		{
			var number = cid2%100;
			number = number*(i+1);
			matrix.push(number);
			cid2 = Math.floor(cid2/100);
		}
		else
		{
			var number = cid1%100;
			number = number*(i+1);
			matrix.push(number);
			cid1 = Math.floor(cid1/100);
		}
		
	}
	var n = msg.length;
	var msgMatrix = new Array();
	var msg = msg.toLowerCase();
	for(var i=0;i<n;i++)
	{
		var j;
		if(msg.charCodeAt(i)==32)
		{
			j = 27;
		}
		else
		{
			j = msg.charCodeAt(i)-96;
		}
		msgMatrix.push(j);
	}
	//alert(matrix);
	//alert(msgMatrix);
	var extra = 3-n%3;
	for(i=0;i<extra;i++)
		msgMatrix.push(27);
	n=n+extra;
	var encryptedMessage = new Array();
	for(var i=0;i<n/3;i++)
	{
		encryptedMessage.push(msgMatrix[3*i]*matrix[0] + msgMatrix[3*i+1]*matrix[3]+msgMatrix[3*i+2]*matrix[6]);
		encryptedMessage.push(msgMatrix[3*i]*matrix[1] + msgMatrix[3*i+1]*matrix[4]+msgMatrix[3*i+2]*matrix[7]);
		encryptedMessage.push(msgMatrix[3*i]*matrix[2] + msgMatrix[3*i+1]*matrix[5]+msgMatrix[3*i+2]*matrix[8]);
	}
	encryptedMessage = encryptedMessage.join();
	//alert(encryptedMessage)
	return encryptedMessage;
	
}
function decryptMessage(msg,cid)
{

	var encryptedMatrix = msg.split(",");
	var n =encryptedMatrix.length;
	var cid1 = parseInt(cid.substr(0,10));
	var cid2 = parseInt(cid.substr(10,10));
	//alert(cid1);
	//alert(cid2);
	var matrix = new Array();
	for (var i=0;i<9;i++)
	{
		if(i<5)
		{
			var number = cid2%100;
			number = number*(i+1);
			matrix.push(number);
			cid2 = Math.floor(cid2/100);
		}
		else
		{
			var number = cid1%100;
			number = number*(i+1);
			matrix.push(number);
			cid1 = Math.floor(cid1/100);
		}
		
	}
	//alert(matrix);
	var inverseMatrix = new Array();
	var number;
	number = matrix[4]*matrix[8] - matrix[7]*matrix[5];
	inverseMatrix.push(number);
	number = (matrix[1]*matrix[8] - matrix[7]*matrix[2])*-1;
	inverseMatrix.push(number);
	number = matrix[1]*matrix[5] - matrix[4]*matrix[2];
	inverseMatrix.push(number);
	number = (matrix[3]*matrix[8] - matrix[5]*matrix[6])*-1;
	inverseMatrix.push(number);
	number = matrix[0]*matrix[8] - matrix[2]*matrix[6];
	inverseMatrix.push(number);
	number = (matrix[0]*matrix[5] - matrix[2]*matrix[3])*-1;
	inverseMatrix.push(number);

	number = matrix[3]*matrix[7] - matrix[4]*matrix[6];
	inverseMatrix.push(number);
	number = (matrix[0]*matrix[7] - matrix[1]*matrix[6])*-1;
	inverseMatrix.push(number);
	number = matrix[0]*matrix[4] - matrix[1]*matrix[3];
	inverseMatrix.push(number);
	var determinant = (matrix[0]*(matrix[4]*matrix[8]-matrix[5]*matrix[7]))-(matrix[3]*(matrix[1]*matrix[8]-matrix[2]*matrix[7]))+(matrix[6]*(matrix[1]*matrix[5]-matrix[2]*matrix[4]));
	for(var i=0;i<9;i++)
		inverseMatrix[i]=inverseMatrix[i]/determinant;
	decryptedMessage = new Array();
	for(i=0;i<n/3;i++)
	{
		decryptedMessage.push(encryptedMatrix[3*i]*inverseMatrix[0] + encryptedMatrix[3*i+1]*inverseMatrix[3]+encryptedMatrix[3*i+2]*inverseMatrix[6]);
		decryptedMessage.push(encryptedMatrix[3*i]*inverseMatrix[1] + encryptedMatrix[3*i+1]*inverseMatrix[4]+encryptedMatrix[3*i+2]*inverseMatrix[7]);
		decryptedMessage.push(encryptedMatrix[3*i]*inverseMatrix[2] + encryptedMatrix[3*i+1]*inverseMatrix[5]+encryptedMatrix[3*i+2]*inverseMatrix[8]);
	}
	var alphabets = "abcdefghijklmnopqrstuvwxyz ";
	var message = "";
	//alert(decryptedMessage);
	for(var i=0;i<n;i++)
	{
		message = message+alphabets[Math.round(decryptedMessage[i]-1)];
	}
	return message;

}
