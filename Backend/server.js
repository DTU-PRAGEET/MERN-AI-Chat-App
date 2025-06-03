import dotenv from "dotenv/config.js";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";
import { generateResult } from "./services/ai.service.js";

const port = process.env.PORT || 3000;
const server = http.createServer(app);


const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

//// middleware for socket.io through which only authenticate user will allow to be connected to the server. 
io.use(async (socket, next) => {
    try{
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;
        if(mongoose.Types.ObjectId.isValid(projectId) === false) {
            return next(new Error("Invalid ProjectId"));
        }

        socket.project = await projectModel.findById(projectId);

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
    socket.roomId = socket.project._id.toString();
    // console.log("A user connected to server: ", socket.user._id);

    socket.join(socket.roomId);

    socket.on('project-message', async (data) => {

        const aiIsPresentInMessage = data.message.includes('@ai');
        socket.broadcast.to(socket.roomId).emit('project-message', data);

        if (aiIsPresentInMessage) {

            const prompt = data.message.replace('@ai', '');
            const result = await generateResult(prompt);
                        
            io.to(socket.roomId).emit('project-message', {
                sender: {
                    _id: 'ai',
                    email: 'AI'
                },
                message: result,
            });
            return;
        }

        
    });

    socket.on('disconnect', () => { 
        console.log("A user disconnected from server");
        socket.leave(socket.roomId); 
    });
});

server.listen(port, () => {
    console.log(`Server is listening to port: ${port}`);
})