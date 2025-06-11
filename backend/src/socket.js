const socketIO = require('socket.io');

function initializeSocket(server) {
    const io = socketIO(server, {
        cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('joinRoom', ({ roomId, userId }) => {
            socket.join(roomId);
            console.log(`User ${userId} joined room: ${roomId}`);
            socket.broadcast.to(roomId).emit('userOnline', userId);
        });

        socket.on('sendMessage', ({ roomId, content, userId }) => {
            io.to(roomId).emit('newMessage', { sender: userId, content, timestamp: new Date() });
        });

        socket.on('updateStatus', ({ userId, status }) => {
            socket.broadcast.emit('statusUpdate', { userId, status });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            socket.broadcast.emit('userOffline', socket.id);
        });
    });

    return io;
}

module.exports = { initializeSocket };