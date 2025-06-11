// backend/src/routes/chat.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Department = require('../models/Department');
const Fee = require('../models/Fee'); // Import Fee model
const authMiddleware = require('../middleware/auth');
const axios = require('axios'); // Add axios for external API calls
const config = require('../config/env');

router.post('/', authMiddleware, async (req, res) => {
  console.log('POST /chat called with body:', req.body);
  console.log('User from authMiddleware:', req.user);
  const { message, userRole } = req.body;
  const userId = req.user.userId;

  if (!message || !userRole) {
    console.log('Validation failed: Missing message or userRole');
    return res.status(400).json({ message: 'Message and userRole are required' });
  }

  if (!userId) {
    console.log('Validation failed: Missing userId from authMiddleware');
    return res.status(401).json({ message: 'User authentication failed' });
  }

  try {
    let context = ''; // Context to provide to the generative AI
    const lowerMessage = message.toLowerCase();
    console.log(`Chatbot received message: "${message}" for role: "${userRole}"`);
    console.log('Processed message (lowercase):', lowerMessage);

    // Student-specific context gathering
    if (userRole === 'student') {
      console.log('Checking student keywords for context...');
      if (lowerMessage.includes('assignments') || lowerMessage.includes('assignment') || lowerMessage.includes('due') || lowerMessage.includes('grades')) {
        const assignments = await Assignment.find({ 'submissions.student._id': userId }).populate('course');
        context += assignments.length > 0
          ? `The user has the following assignments:\\n${assignments
              .map(
                (a) =>
                  `- ${a.title} (Due: ${new Date(a.dueDate).toLocaleDateString()}, Course: ${a.course.title || 'N/A'}, Max Score: ${a.maxScore}${a.submissions.find(s => s.student.toString() === userId.toString())?.score !== undefined && a.submissions.find(s => s.student.toString() === userId.toString())?.score !== null ? `, Score: ${a.submissions.find(s => s.student.toString() === userId.toString())?.score}` : ''})`
              )
              .join('\n')}`
          : 'The user has no assignments.';
      } else if (lowerMessage.includes('course') || lowerMessage.includes('courses') || lowerMessage.includes('enroll')) {
        const courses = await Course.find({ 'students': userId });
        context += courses.length > 0
          ? `The user is enrolled in the following courses:\\n${courses
              .map((c) => `- ${c.title} (${c.code})`) // Simplified context for brevity
              .join('\n')}`
          : 'The user is not enrolled in any courses yet.';
      } else if (lowerMessage.includes('announcements')) {
        const announcements = await Announcement.find({ targetAudience: { $in: ['students', 'both'] } }).sort({
          createdAt: -1,
        });
        context += announcements.length > 0
          ? `Recent announcements for students:\\n${announcements
              .slice(0, 3)
              .map((a) => `- ${a.title}: ${a.content} (Posted: ${new Date(a.createdAt).toLocaleDateString()})`)}`
          : 'No recent announcements for students.';
      } else if (lowerMessage.includes('profile')) {
        const user = await User.findById(userId);
        context += `User profile:\\n- Name: ${user.firstName} ${user.lastName}\\n- Email: ${user.email}\\n- Student ID: ${user.studentId}\\n- Department: ${user.department.name}`; // Simplified context
      } else if (lowerMessage.includes('fees') || lowerMessage.includes('pay') || lowerMessage.includes('payment') || lowerMessage.includes('dues')) {
        const fees = await Fee.find({ student: userId, status: { $in: ['pending', 'overdue'] } }).sort({ dueDate: 1 });
        context += fees.length > 0
          ? `The user has the following outstanding fees:\\n${fees
              .map((f) => `- ${f.name}: $${f.amount} (Due: ${new Date(f.dueDate).toLocaleDateString()}, Status: ${f.status})`)
              .join('\n')}`
          : 'The user has no outstanding fees at the moment.';
      }
    }

    // Teacher-specific context gathering
    if (userRole === 'teacher') {
      console.log('Checking teacher keywords for context...');
      if (lowerMessage.includes('assignments') || lowerMessage.includes('grade')) {
        const assignments = await Assignment.find({
          course: { $in: await Course.find({ instructor: userId }).select('_id') },
        }).populate('course');
        context += assignments.length > 0
          ? `The user has the following assignments to grade:\\n${assignments
              .map((a) => `- ${a.title} (Course: ${a.course.title})`) // Simplified context
              .join('\n')}`
          : 'The user has no assignments to grade at the moment.';
      } else if (lowerMessage.includes('course') || lowerMessage.includes('courses')) {
        const courses = await Course.find({ instructor: userId });
        context += courses.length > 0
          ? `The user teaches the following courses:\\n${courses
              .map((c) => `- ${c.title} (${c.code})`) // Simplified context
              .join('\n')}`
          : 'The user is not teaching any courses yet.';
      } else if (lowerMessage.includes('announcements')) {
        const announcements = await Announcement.find({ targetAudience: { $in: ['teachers', 'both'] } }).sort({
          createdAt: -1,
        });
        context += announcements.length > 0
          ? `Recent announcements for teachers:\\n${announcements
              .slice(0, 3)
              .map((a) => `- ${a.title}: ${a.content} (Posted: ${new Date(a.createdAt).toLocaleDateString()})`)}`
          : 'No recent announcements for teachers.';
      }
    }

    // Admin-specific context gathering
    if (userRole === 'admin') {
      console.log('Checking admin keywords for context...');
      if (lowerMessage.includes('users')) {
        const users = await User.find().limit(5);
        context += users.length > 0
          ? `Recent users:\\n${users
              .map((u) => `- ${u.firstName} ${u.lastName} (${u.role}, Email: ${u.email})`)
              .join('\n')}`
          : 'No users found.';
      } else if (lowerMessage.includes('departments')) {
        const departments = await Department.find();
        context += departments.length > 0
          ? `Departments:\\n${departments.map((d) => `- ${d.name}`).join('\n')}`
          : 'No departments found.';
      } else if (lowerMessage.includes('course') || lowerMessage.includes('courses')) {
        const courses = await Course.find().limit(5);
        context += courses.length > 0
          ? `Recent courses:\\n${courses
              .map((c) => `- ${c.title} (${c.code})`)
              .join('\n')}`
          : 'No courses found.';
      }
    }

    // Navigation support can be a separate prompt or part of the general system prompt for LLM
    const navMap = {
        dashboard: '/dashboard',
        profile: '/profile',
        courses: userRole === 'admin' ? '/admin/courses' : '/courses',
        assignments: userRole === 'teacher' ? '/assignments/grade' : '/assignments',
        announcements: '/announcements',
        'admin panel': '/admin',
        payments: '/payments',
        grades: '/grades', // Added grades navigation
    };
    let navHint = '';
    for (const [key, path] of Object.entries(navMap)) {
        if (lowerMessage.includes(key.toLowerCase())) {
            navHint += `\\nConsider guiding the user to: [${key}](${path})`;
        }
    }

    console.log('Calling OpenRouter API with message:', message, 'and context:', context);
    console.log('Using OpenRouter API Key:', config.OPENROUTER_API_KEY ? '******' + config.OPENROUTER_API_KEY.substring(config.OPENROUTER_API_KEY.length - 4) : 'Not Set');
    try {
      const grokResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'deepseek/deepseek-prover-v2:free',
          messages: [
            {
              role: 'system',
              content: `You are an LMS assistant for a user with role: ${userRole}. Provide concise, accurate answers about assignments, courses, profile, announcements, navigation, or fees. Use markdown for links. If you suggest navigation, use the format [Link Text](/path). When providing steps, use numbered lists. For fees, list details (name, amount, due date, status) and suggest navigating to the payments page using a markdown link like [Pay Fees Now](/payments). Additional context: ${context}${navHint}`,
            },
            { role: 'user', content: message },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': config.FRONTEND_URL,
            'X-Title': 'LMS Chatbot',
          },
        }
      );

      console.log('OpenRouter API response:', grokResponse.data);
      let responseText = grokResponse.data.choices[0].message.content;

      // Post-process the response to ensure navigation links are in markdown format
      const linkReplacements = [
        { phrase: /check course schedule/gi, linkText: 'Check Course Schedule', path: navMap.courses },
        { phrase: /view courses/gi, linkText: 'View Courses', path: navMap.courses },
        { phrase: /access course content/gi, linkText: 'Access Course Content', path: navMap.courses },
        { phrase: /check announcements/gi, linkText: 'Check Announcements', path: navMap.announcements },
        { phrase: /manage profile/gi, linkText: 'Manage Profile', path: navMap.profile },
        { phrase: /view grades/gi, linkText: 'View Grades', path: navMap.grades },
        { phrase: /view payments/gi, linkText: 'View Payments', path: navMap.payments },
        { phrase: /how to enroll in a course/gi, linkText: 'Enroll in a Course', path: navMap.courses },
        { phrase: /how to submit an assignment/gi, linkText: 'Submit an Assignment', path: navMap.assignments },
        { phrase: /pay fees/gi, linkText: 'Pay Fees', path: navMap.payments },
        { phrase: /add fee voucher/gi, linkText: 'Add Fee Voucher', path: navMap.payments },
        { phrase: /print fee voucher/gi, linkText: 'Print Fee Voucher', path: navMap.payments },
        { phrase: /finance tab/gi, linkText: 'Finance Tab', path: navMap.payments },
        { phrase: /student account/gi, linkText: 'Student Account', path: navMap.profile },
        { phrase: /contact your instructor/gi, linkText: 'Contact Instructor', path: '/contact' }, // Assuming a contact page
        { phrase: /contact your college's finance department/gi, linkText: 'Contact Finance Department', path: '/contact' },
        // Add more common phrases and their corresponding paths as needed
      ];

      for (const rep of linkReplacements) {
        responseText = responseText.replace(rep.phrase, `[${rep.linkText}](${rep.path})`);
      }
      
      // Additional replacements for generic terms that should be linked
      responseText = responseText.replace(/\b(courses|course)\b/gi, `[Courses](${navMap.courses})`);
      responseText = responseText.replace(/\b(assignments|assignment)\b/gi, `[Assignments](${navMap.assignments})`);
      responseText = responseText.replace(/\b(grades|grade)\b/gi, `[Grades](${navMap.grades})`);
      responseText = responseText.replace(/\b(profile)\b/gi, `[Profile](${navMap.profile})`);
      responseText = responseText.replace(/\b(announcements)\b/gi, `[Announcements](${navMap.announcements})`);
      responseText = responseText.replace(/\b(dashboard)\b/gi, `[Dashboard](${navMap.dashboard})`);
      responseText = responseText.replace(/\b(payments|fees)\b/gi, `[Payments](${navMap.payments})`); // Combined for fees/payments
      

      const botMessage = {
        sender: 'bot',
        text: responseText || "I'm not sure how to help with that. Could you please rephrase your question or ask about assignments, courses, announcements, profile, grades, enrolling, or fees?",
        timestamp: new Date(),
      };

      try {
        console.log('Saving chat history for user:', userId);
        await Chat.findOneAndUpdate(
          { userId },
          {
            $push: {
              messages: [
                { sender: 'user', text: message, timestamp: new Date() },
                botMessage,
              ],
            },
          },
          { upsert: true }
        );
      } catch (dbError) {
        console.error('Database error saving chat history:', dbError.message);
      }

      res.json(botMessage);
    } catch (error) {
      console.error('Chat error:', error.message);
      if (error.response) {
        console.error('OpenRouter API error:', error.response.status, error.response.data);
        // Instead of returning an error status, return a friendly message
        return res.json({
          sender: 'bot',
          text: "I'm having trouble connecting to my knowledge base right now. Please try again in a few moments.",
          timestamp: new Date()
        });
      }
      // For other errors, return a generic message
      return res.json({
        sender: 'bot',
        text: "I'm having trouble processing your request. Please try again.",
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Chat error:', error.message, error.stack);
    if (error.response) {
      console.error('OpenRouter API error:', error.response.status, error.response.data);
      if (error.response.status === 429) {
        return res.status(429).json({ message: 'Rate limit exceeded. Please try again later.' });
      }
      if (error.response.status === 401) {
        return res.status(401).json({ message: 'Invalid OpenRouter API key or credentials' });
      }
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({ userId: req.user.userId });
    res.json(chat?.messages || []);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;