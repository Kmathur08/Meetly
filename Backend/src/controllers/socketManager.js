import { Server } from "socket.io";

let connections = {}
let message = {}
let timeonline = {}

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors:{
            origin: "*",
            methods: ["GET", "POST"],
            allowHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {

        socket.on("Accept-call", (path) => {

            if(connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id);

            timeonline[socket.id] = new Date();

            for(let i=0;i<connections[path].length;i++) {
                io.to(connections[path][i]).emit("user-joined", socket.id, connections[path]);
            }

            if(message[path] !== undefined) {
                for(let i=0;i<message[path].length;++i) {
                    io.to(socket.id).emit("chat-message", message[path][i]['data'], message[path][i]['sender'], message[path][i]['socket-id-sender']);
                }
            }
        });

        socket.on("signal", (toId,message) => {
            to.to(toId).emit("signal", socket.id, message)
        });

        socket.on("chat-message",(data,sender) => {
            const [matchingroom, found] = Object.entries(connections).reduce(([room,isfound], [roomKey, roomvalue]) => {
                if(!isfound && roomvalue.includes(socket.id)) {
                    return [roomKey, true];
                }
                return [room, isfound];
        }, ['',false]);

        if(found === true) {
            if(message[matchingroom] === undefined) {
                message[matchingroom] = []
            }
            message[matchingroom].push({'sender': sender, "data" : data, "socket-id-sender": socket.id});

            connections[matchingroom].forEach((element) => {
                io.to(element).emit("chat-message", data, sender, socket.id);       
            });
        }   
        });

        socket.on("disconnect", () => {
            var diffTime = Math.abs((timeonline[socket.id] - new Date()))

            var key;
            for(const [k,v] of JSON.parse(JSON.stringify(Objects.entries(connections)))) {
                for(let i=0;i<v.length;++i) {
                    if(v[i] === socket.id) {
                        key = k;
                        v.splice(i,1);
                        for(let j=0;j<connections[key].length;++j) {
                            io.to(connections[key][j]).emit("user-left", socket.id);
                        }

                        var index = connections[key].indexOf(socket.id);
                        connections[key].splice(index,1);
                        
                        if(connections[key].length === 0) {
                            delete connections[key];
                        }
                    
                    }
                }   
            }
        });
    });

    return io;
}
export default connectToSocket;