var app = require("express")(),
    http = require("http").Server(app),
    port = process.env.PORT;

var io = require("socket.io")(http);
var dio = require('domain.io')(io);

var Users = dio.domain("Users");
var Module2 = require('./module2.js');
var topics = {};
topics.sports = dio.domain("Sports");
topics.movies = dio.domain("Movies");


app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
});


function getId(s){
    // since I don't have a persistence layer, I'm just going to use the socket id as a "user id"
    return s.id;
}

io.on("connection", function(socket) {
    console.log("A user connected");
    
    
    Users.add(getId(socket), socket);
    Users.broadcast("chatMessage", "Someone just joined the chatroom!");
    
    if (Math.random() < 0.5){ // The DIO singletons work just as well from external files
        Module2.messageAllUsers(); 
    }
    
    

    socket.on("joinSports", function(){
        var id = getId(socket);
        topics.sports.add(id, socket);
        topics.sports.emitToDifference([id], "chatMessage", "Someone just joined sports! They will receive messages or updates from sports.");
        Users.send(id, "chatMessage", "You just joined sports!");
    });
    
    socket.on("leaveSports", function() {
        var id = getId(socket);
        topics.sports.remove(socket); // removing by socket
        topics.sports.emitToDifference([id], "chatMessage", "Someone just left sports! They will no longer receive messages or updates from sports.");
        Users.send(id, "chatMessage", "You just left sports!");

    });
    
    socket.on("joinMovies", function(id) {
        var id = getId(socket);
        topics.movies.add(id, socket);
        topics.movies.emitToDifference([id], "chatMessage", "Someone just joined movies! They will receive messages or updates from movies.");
        Users.send(id, "chatMessage", "You just joined movies!");

    });
    
    socket.on("leaveMovies", function() {
        var id = getId(socket);
        topics.movies.remove(id); // removing by id
        topics.movies.broadcast("chatMessage", "Someone just left movies! They will no longer receive messages or updates from movies.");
        Users.send(id, "chatMessage", "You just left movies!");
    });

    socket.on("disconnect", function() {
        Users.broadcast("chatMessage", "Someone just left :(");
    });
    
    socket.on("chatMessage", function(data){
        if (!data.topic){
            Users.broadcast('chatMessage', data.msg);
        }
        else{
            topics[data.topic.toLowerCase()].broadcast('chatMessage', data.msg);
        }
    })
});

http.listen(port, function() {
    console.log("listening on 8080");
});
