exports.messageAllUsers = function(){
    var Users = require('domain.io')().domain('Users');
    if (Users){
        Users.broadcast('chatMessage', 'This message was sent from a different file!');
    }
}