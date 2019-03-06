var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const fs = require('fs');
//Simple way to do sessionIDs could also try to allow custom ID's from users, need extra validation.
//This will probably need to be a singleton so that we don't get any weird issues if we keep this.
var sessionCount = 0;

//Serve base HTML view, no other pages are required state will only be updated though board datastruct.
app.get('/', function(req, res){
    res.sendFile(__dirname + '/Pages/index.html');
});

//Set Server to listen, does some console logging.
http.listen(3000, function(){
    console.log('listening on *:3000');
});

//TODO: Connection Handler
// Check if newgame is requested and set up a new session
//    New socket.io room is created with sessionid, blank board state pushed, board state file is copied to the sessions with format sessionid.html or boardstate.
// If sessionID is given, check for sessionID.
//    If session is found in sessions then join user to socket.io room, and push session state to user
//    If session is requested but not found, throw error message to client that's displayed by the client

//TODO: Game Engine
// Board state is represented by 2D array
// X is red O is black
// Coordinates and type of piece are sent to the server for validation, if it passed board state is pushed
// If not an error is displayed

//TODO: Disconnection Handler
// Upon disconnection of one user an error message is displayed and all board moves sent are told to kindly fuck off
// Upon disconnection of both users the session is archived by saving the board state to a file, and putting it away.


//TODO: Add try catch blocks to open and save sessions.
function openSession(boardfilename,roomid){
    console.log("opening session " + roomid);
    var boardObjBuff = fs.readFileSync(__dirname + "/Session/" + roomid);
    var boardObj = JSON.parse(boardObjBuff.toString());
    return boardObj;
}

function saveSession(boardObj, roomid){
    console.log("saving session " + roomid);
    var boardObjString = boardObj.toString();
    fs.writeFile(__dirname + "/Session/" + roomid, boardObjString, function(err){
        if (err) throw err;
        console.log('Saved!');
    });
}

io.on('connection', function(socket){
    console.log("user connected " + checker);
    //Fresh board is generated.
    var board = {
        boardstate :
            [
                [1,0,1,0,1,0,1,0],
                [0,1,0,1,0,1,0,1],
                [1,0,1,0,1,0,1,0],
                [0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0],
                [0,-1,0,-1,0,-1,0,-1],
                [-1,0,-1,0,-1,0,-1,0],
                [0,-1,0,-1,0,-1,0,-1]
            ]};
    var roomid = -2;

    socket.on("gameReq", function(msg){
        if(msg === -1){
            roomid=sessionCount;
            io.join(roomid);
            saveSession(board,roomid);
            sessionCount++;
        } else if (msg >= 0) {
            //Check for session
            var sessions= fs.readdir('Session');

            for (var session in sessions){
                if(parseInt(session) === msg ) {
                    roomid = parseInt(session);
                    io.join(roomid);
                    openSession(board,roomid);
                }
            }

            //No room found send error to client.
            //if (roomid == -2) { io.emit only to you .("Didn't work bruh."}
        } else {
            console.log("bad message received.");
            //error to client.
            //io.emit.onlytoyourself.("bad message received");
        }
    });

    socket.on("moveReq", function(msg){
        var validmove = true;
            //GameEngine.movevalidator(msg);
        if(validmove){
            //board.boardstate = GameEngine.makemove(board.boardstate,msg);
            io.to(roomid).emit(board.boardstate);
        } else {
            io.to(roomid).emit("Bad move");
        }
    });
    //Disconnection Handler
    //Save game state in file
    //Send opponent disconnected message to client
    socket.on('disconnect', function(socket){
        console.log("user disconnected, saving game");
        saveSession(board,roomid);
        console.log("sending error to other player.");
        io.to(roomid).emit("The other guy left bro.")
    });
});
