const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CommunicationRoom = require('../models/Communication');

router.post('/rooms', auth, async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.userId;

    try {
        let room = await CommunicationRoom.findOne({ course: courseId, participants: userId });
        if (!room) {
            room = new CommunicationRoom({
                course: courseId,
                participants: [userId],
            });
            await room.save();
        }
        res.json(room);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/private-rooms', auth, async (req, res) => {
    const { targetUserId } = req.body;
    const userId = req.user.userId;

    try {
        let room = await CommunicationRoom.findOne({
            participants: { $all: [userId, targetUserId], $size: 2 },
            course: null,
        });
        if (!room) {
            room = new CommunicationRoom({
                participants: [userId, targetUserId],
                course: null,
            });
            await room.save();
        }
        res.json(room);
    } catch (error) {
        console.error('Error creating private room:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/rooms/:roomId/messages', auth, async (req, res) => {
    const { roomId } = req.params;
    const { content } = req.body;

    try {
        const room = await CommunicationRoom.findById(roomId).populate('messages.sender', 'firstName lastName email');
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (!room.participants.includes(req.user.userId)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (!Array.isArray(room.messages)) {
            room.messages = [];
        }

        const newMessage = {
            sender: req.user.userId,
            content,
            timestamp: new Date(),
        };

        room.messages.push(newMessage);
        await room.save();

        const populatedRoom = await CommunicationRoom.findById(roomId).populate('messages.sender', 'firstName lastName email');
        const savedMessage = populatedRoom.messages[populatedRoom.messages.length - 1];

        const io = global.io; // Access the globally initialized socket.io instance
        room.participants.forEach(participantId => {
            const roomName = `room_${roomId}_${participantId}`;
            io.to(roomName).emit('newMessage', savedMessage);
        });

        res.json(savedMessage);
    } catch (error) {
        console.error('Error sending message:', {
            message: error.message,
            stack: error.stack,
            roomId,
            content,
            userId: req.user.userId,
        });
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/rooms/:roomId/messages', auth, async (req, res) => {
    const { roomId } = req.params;

    try {
        const room = await CommunicationRoom.findById(roomId).populate('messages.sender', 'firstName lastName email');
        if (!room || !room.participants.includes(req.user.userId)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        res.json(room.messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;