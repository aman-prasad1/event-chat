import { Server } from 'socket.io';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';

let io;
let userSocketMap = new Map();

const initilizeScoket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    });

    io.use((socket, next) => {
        try {
            const rawCookie = socket.handshake.headers.cookie;

            if (!rawCookie) {
                return next(new Error("No cookies"));
            }

            const parsed = cookie.parse(rawCookie);

            const token = parsed.accessToken; // your cookie name
            
            if (!token) {
                return next(new Error("No token"));
            }

            const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            socket.data.userId = payload.id;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        userSocketMap.set(userId, socket.id);
        socket.on('disconnect', () => {
            userSocketMap.delete(userId);
        });
    });
}

export { io, initilizeScoket, userSocketMap };