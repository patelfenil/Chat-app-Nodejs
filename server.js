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
			    	    var messageQuery = messageCollection.find(  { $or: [ { conversationId : conversationId1 } , { conversationId : conversationId2 } ] } ).toArray(function(err,msg){
			    	    console.log(msg.length);
			    		var conv = new Array();
				    	for(var i=0;i<msg.length;i++)
				    	{
				    		 conv.push({ msg : msg[i].msg , sender : msg[i].sender , reciever : msg[i].reciever });
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
			var conversationId = socket.handshake.session.mobilenumber + data.reciever;
			collection.insert({ msg : data.msg , sender : socket.handshake.session.mobilenumber , reciever : data.reciever , conversationId : conversationId },function(err){
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