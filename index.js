var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(express.static(__dirname + '/public'));


var twitter = require('twitter');
var mongo = require("mongojs");


var stringConnection = 'mongodb://localhost:27017/twitter';
var db = mongo(stringConnection,['tweets']);

/**
 * Socket.IO Listening connection from client. 
 * @param  {Object} socket WebSocket connection (Client)
 */
io.on('connection', function(socket){
        console.log('Socket.io connected');

        //Listening track event from client
        socket.on('track', function(key){

	        console.log('tracking key ',key);

		    var twitterApp = new TwitterApp(socket,db);
		    twitterApp.track(key);

        });
        socket.on('disconnect', function(){
          console.log('user disconnected');
        });
      });


var TwitterApp = function(socket,db){

  this.twit = new twitter({
      consumer_key: 'eTj9Xmuk5r9woFAnnkuieg',
      consumer_secret: 'U5FHYvPXA6BP73FRmn6ijmOMj2aJOttgl5jFAsKZo',
      access_token_key: '237929077-pu4UtvlYWVnUUvCzp1vsO6yJz2xvQNX8cJxkgab8',
      access_token_secret: 'OLfePOTeGc8eoMN8xbcCNSxuNtd9Ea58X7C4uRa9IoHJO'
  });
  this.db = db;
  this.socket = socket;


  /**
   * NO SEAS MALO. TODO evitar callback hell. 
   * @param  {string} key key a trackear
   * 
   */
  this.track = function(key){
      var _this = this;

      /**
       * Listening filter event from twitter-node
       */
      this.twit.stream('statuses/filter', {track: key}, function(stream) {

      stream.on('data', function(data) {
          var message = data;
          if(message){
              console.log("Tweet: ",message);

              /**
               * Valid Tweet
               */
              if(message.user){
                  socket.emit('tweet', JSON.stringify(message));
                  console.log("@"+message.user.name);
                  console.log(message.user["screen_name"]);

                  /**
                   * MongoDB Save
                   */
                  _this.save(message);
              }

          }else{
              console.log('message empty');
          }
      });

      stream.on('error',function(err){
          console.log('err ',err);
      });
      stream.on('end',function(end){
          console.log('end ',end);
      });

      // Disconnect stream after five seconds
      //setTimeout(stream.destroy, 5000);
      });

      /**
       * save tweet mongodb
       * @param  {Object} tweet tweet as object
       */
      this.save = function(tweet){
        this.db.tweets.save(tweet);
      }
  }
}

app.get('/', function(req, res){
  res.sendfile('index.html');
});

http.listen(3000, function(){
  console.log('listening on *:7000');
});



