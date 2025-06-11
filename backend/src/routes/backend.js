// routes/backend.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const router = express.Router();

// -----------------
// Static staff data
// -----------------
const staffList = [
  {
    id: 1,
    name: "John Doe",
    staffId: "STF001",
    email: "john.doe@tafe.edu",
    department: "Computer Science",
    subjects: ["CS101", "CS202"],
    schedule: [
      { day: "Monday", time: "10-12", subject: "CS101" },
      { day: "Wednesday", time: "2-4", subject: "CS202" }
    ],
    resources: ["Syllabus_CS101.pdf", "Lecture1_CS202.pdf"],
    announcements: ["Meeting at 2 PM", "Submit grades by Friday"]
  },
  // ... other staff
];

// Staff API - All
router.get('/staff', (req, res) => {
  res.json(staffList);
});

// Staff API - By ID
router.get('/staff/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const staff = staffList.find(s => s.id === id);
  if (staff) {
    res.json(staff);
  } else {
    res.status(404).json({ message: "Staff not found" });
  }
});

// Export both router and socket setup function
let ioInstance;
const setupSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*',
    },
  });

  const messages = [];

  io.on('connection', (socket) => {
    console.log('New client connected: ' + socket.id);

    socket.emit('chatHistory', messages);

    socket.on('sendMessage', (data) => {
      const { username, message } = data;
      const time = new Date().toLocaleTimeString();
      const chatMessage = { username, message, time };

      messages.push(chatMessage);
      io.emit('receiveMessage', chatMessage);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected: ' + socket.id);
    });
  });

  ioInstance = io;
};

module.exports = { router, setupSocket };
