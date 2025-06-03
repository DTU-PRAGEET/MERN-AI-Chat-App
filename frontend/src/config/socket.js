import socket from "socket.io-client";

let socketInstance  = null;

export const initializeSocket = (projectId) => {
    socketInstance = socket(import.meta.env.VITE_API_URL, {
        auth: {
            token: localStorage.getItem('token') || '',
        },
        query: {
            projectId
        }
    });
 
    return socketInstance;
}


export const receiveMessage = (eventName, cb) => {
    if (!socketInstance) {
        throw new Error("Socket not initialized. Call initializeSocket first.");
    }

    socketInstance.on(eventName, cb);
}

export const sendMessage = (eventName, data) => {
    if (!socketInstance) {
        throw new Error("Socket not initialized. Call initializeSocket first.");
    }
    socketInstance.emit(eventName, data);
}
