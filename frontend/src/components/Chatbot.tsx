// Chatbot.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Link,
  Chip,
  Stack,
} from '@mui/material';
import { Chat, Close, Send } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      const fetchChatHistory = async () => {
        try {
          const history = await chatAPI.getChatHistory();
          setMessages(history);
        } catch (error) {
          console.error('Error fetching chat history:', error);
        }
      };
      fetchChatHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      const roleSuggestions = {
        student: [
          'How do I enroll in a course?',
          'When is my next assignment due?',
          'How do I submit an assignment?',
          'How do I check my grades?',
          'How do I access my course materials?',
          'Pay Fees',
        ],
        teacher: [
          'How do I create a new assignment?',
          'How do I grade student submissions?',
          'How do I post an announcement?',
          'How do I view student progress?',
          'How do I manage course content?',
        ],
        admin: [
          'How do I manage users?',
          'How do I create a new course?',
          'How do I assign teachers to courses?',
          'How do I view system reports?',
          'How do I manage departments?',
        ],
        support: [
          'How do I help students with technical issues?',
          'How do I escalate a support ticket?',
          'How do I view support requests?',
          'How do I manage user accounts?',
          'How do I access system logs?',
        ],
      };
      setSuggestions(roleSuggestions[user.role] || []);
    }
  }, [isOpen, user]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user?.role) return;

    const userMessage: Message = {
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatAPI.sendMessage(input, user.role);
      
      const botMessage: Message = {
        text: response.text,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!user?.role) return;
    
    setInput(suggestion);
    const userMessage: Message = {
      text: suggestion,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    chatAPI.sendMessage(suggestion, user.role)
      .then(response => {
        const botMessage: Message = {
          text: response.text,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      })
      .catch(error => {
        console.error('Error:', error);
        const errorMessage: Message = {
          text: 'Sorry, I encountered an error. Please try again.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsTyping(false);
      });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <IconButton
        onClick={() => setIsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          backgroundColor: 'primary.main',
          color: 'white',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
          width: 56,
          height: 56,
        }}
      >
        <Chat />
      </IconButton>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 350,
        height: 500,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          p: 2,
          backgroundColor: 'primary.main',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Chat Assistant</Typography>
        <IconButton
          size="small"
          onClick={() => setIsOpen(false)}
          sx={{ color: 'white' }}
        >
          <Close />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1,
                backgroundColor:
                  message.sender === 'user' ? 'primary.light' : 'grey.100',
                color: message.sender === 'user' ? 'white' : 'text.primary',
                borderRadius: '10px',
              }}
            >
              <Typography variant="body2" component="div">
                <Box sx={{ '& .markdown-body': { p: 0 } }}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: marked(message.text, {
                        breaks: true,
                        gfm: true,
                      })
                    }}
                  />
                </Box>
              </Typography>
            </Paper>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: 'text.secondary',
                mt: 0.5,
                display: 'block',
                textAlign:
                  message.sender === 'user' ? 'right' : 'left',
              }}
            >
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          endIcon={<Send />}
        >
          Send
        </Button>
      </Box>

      {suggestions.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: 'absolute',
            bottom: 70,
            left: 0,
            right: 0,
            p: 1,
            overflowX: 'auto',
            backgroundColor: 'background.paper',
            borderTop: '1px solid #eee',
          }}
        >
          {suggestions.map((s, idx) => (
            <Chip key={idx} label={s} onClick={() => handleSuggestionClick(s)} clickable />
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default Chatbot;