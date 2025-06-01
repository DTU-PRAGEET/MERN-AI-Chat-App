import dotenv from "dotenv/config.js";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const port = process.env.PORT || 3000;
const server = http.createServer(app);


const io = new Server(server);

//// middleware for socket.io through which only authenticate user will allow to be connected to the server. 
io.use((socket, next) => {
    try{
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded) {
            return next(new Error("Authentication error"));
        }
        socket.user = decoded; // Attach user info to the socket
        next();
        
    } catch (error) {
        next(new Error("Authentication error"));
    }
});


io.on('connection', socket => {
    console.log("socketIo is connected to server");

    socket.on('event', data => { /* … */ });
    socket.on('disconnect', () => { 
        console.log("socketIo is disconnected from server");
    });
});

server.listen(port, () => {
    console.log(`Server is listening to port: ${port}`);
})
