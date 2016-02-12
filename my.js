mongodb=mongodb.connect();
     mongodb.connect('mongodb://localhost/chat',function(err,db)
     {
			if(err)
				console.log(err);
			else
			{
				console.log("Coneected to mongodb in jade");
			}
	 }); 