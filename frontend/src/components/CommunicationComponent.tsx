import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, List, ListItem, ListItemText, TextField, Button, Avatar, Paper, InputBase, IconButton } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { communicationAPI, userAPI } from '../services/api';
import { Course, User, CommunicationMessage, CommunicationRoom } from '../types';
import './CommunicationComponent.css';

interface CommunicationProps {
    course?: Course;
}

const CommunicationComponent: React.FC<CommunicationProps> = ({ course }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<CommunicationMessage[]>([]);
    const [message, setMessage] = useState('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Move setupSocketForRoom outside useEffect
    const setupSocketForRoom = (roomId: string, userId: string) => {
        socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
        socketRef.current.emit('joinRoom', { roomId, userId });
        socketRef.current.on('newMessage', (msg: CommunicationMessage) => {
            setMessages((prev) => [...prev.filter(m => m._id !== msg._id), msg].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        });
    };

    useEffect(() => {
        let isMounted = true;

        const fetchUsers = async () => {
            try {
                const allUsers = await userAPI.getAllUsers();
                const filteredUsers = Array.isArray(allUsers) ? allUsers.filter(u => 
                    u._id !== user?._id && 
                    (u.role === 'teacher' || u.role === 'student')
                ) : [];
                if (isMounted) setUsers(filteredUsers);
            } catch (error) {
                console.error('Error fetching users:', error);
                if (isMounted) setUsers([]);
            }
        };

        const fetchCourseRoom = async () => {
            if (!user?._id || !course) return;

            try {
                const room = await communicationAPI.createRoom(course._id);
                if (isMounted) {
                    setRoomId(room._id);
                    setSelectedUser(null); // Clear selected user for course chat
                    const history = await communicationAPI.getMessages(room._id);
                    if (isMounted) setMessages(history || []);

                    setupSocketForRoom(room._id, user._id);
                }
            } catch (error) {
                console.error('Error setting up course communication:', error);
            }
        };

        fetchUsers();
        if (course) fetchCourseRoom();

        return () => {
            isMounted = false;
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [course?._id, user?._id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!message.trim() || !roomId || !user?._id) return;

        try {
            const newMessage = await communicationAPI.sendMessage(roomId, message);
            if (newMessage._id) {
                setMessages((prev) => [...prev.filter(m => m._id !== newMessage._id), newMessage].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
            }
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleCreatePrivateRoom = async (targetUserId: string) => {
        if (!user?._id) return;

        try {
            const room = await communicationAPI.createPrivateRoom(user._id, targetUserId);
            setRoomId(room._id);
            setSelectedUser(users.find(u => u._id === targetUserId) || null);
            const history = await communicationAPI.getMessages(room._id);
            setMessages(history || []);

            // Disconnect from previous socket and setup for the new room
            socketRef.current?.disconnect();
            socketRef.current = null;
            setupSocketForRoom(room._id, user._id);
        } catch (error) {
            console.error('Error creating private room:', error);
        }
    };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container">
          {/* Sidebar */}
          <div className="sidebar">
            <div className="sidebar-header">Contacts</div>
            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="contacts-list">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <div
                    key={u._id}
                    className="contact-item"
                    onClick={() => handleCreatePrivateRoom(u._id)}
                  >
                    <Avatar className="contact-avatar">
                      {u.firstName.charAt(0)}
                    </Avatar>
                    <div className="contact-info">
                      <span className="contact-name">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="contact-role">{u.role}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', color: '#888' }}>
                  No users found.
                </div>
              )}
            </div>
          </div>
      
          {/* Chat Area */}
          <div className="chat-area">
            <div className="chat-header">
              {course
                ? `Course Chat: ${course.title}`
                : selectedUser
                ? `Chat with ${selectedUser.firstName} ${selectedUser.lastName}`
                : 'Select a contact to start chatting'}
            </div>
            <div className="chat-messages">
              {messages.map((msg, index) => {
                const isCurrentUser = msg.sender?._id === user?._id;
                const senderName = msg.sender
                  ? `${msg.sender.firstName || 'Unknown'} ${msg.sender.lastName || ''}`
                  : 'Unknown User';
                const timestamp = new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
      
                return (
                  <div key={index} className="message-item">
                    <div className="message-sender">{senderName}</div>
                    <div
                      className={`message-content ${
                        isCurrentUser ? 'self' : ''
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div className="message-timestamp">{timestamp}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Write a message..."
                disabled={!roomId}
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || !roomId}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      );
};

export default CommunicationComponent;