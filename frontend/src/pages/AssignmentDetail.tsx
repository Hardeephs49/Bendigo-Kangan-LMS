import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, List, ListItem, ListItemText, TextField } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { assignmentAPI } from '../services/api';
import { Assignment } from '../types';
import Layout from '../components/layout/Layout';
import api from '../services/api';

const AssignmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<{ [submissionId: string]: number | '' }>({});
  const [feedback, setFeedback] = useState<{ [submissionId: string]: string }>({});

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        if (id) {
          const response = await assignmentAPI.getAssignment(id);
          setAssignment(response);
          console.log('Fetched Assignment Data for AssignmentDetail (including submissions):', response);

          // Initialize scores and feedback for existing submissions
          const initialScores: { [submissionId: string]: number | '' } = {};
          const initialFeedback: { [submissionId: string]: string } = {};
          response.submissions.forEach(sub => {
            if (sub._id) {
              initialScores[sub._id as string] = sub.score !== undefined ? sub.score : '';
              initialFeedback[sub._id as string] = sub.feedback !== undefined ? sub.feedback : '';
            }
          });
          setScores(initialScores);
          setFeedback(initialFeedback);
        }
      } catch (err) {
        setError('Failed to load assignment');
        console.error('Error fetching assignment in AssignmentDetail:', err);
      }
    };
    fetchAssignment();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSubmissionFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    try {
      if (id && submissionFiles.length > 0) {
        const fileUrls = await Promise.all(
          submissionFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            console.log('Attempting file upload to URL:', api.defaults.baseURL + '/uploads');
            const response = await api.post<{ title: string; fileUrl: string }[]>('/uploads', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log('Upload response data:', response.data);
            return response.data;
          })
        );

        // fileUrls is now an array of arrays, flatten it if it was multiple files initially
        const flattenedFileUrls = fileUrls.flat();
        console.log('Files being sent to submitAssignment:', flattenedFileUrls);

        await assignmentAPI.submitAssignment(id, flattenedFileUrls);
        setSubmissionFiles([]);
        alert('Submission successful');
      }
    } catch (err) {
      setError('Failed to submit assignment');
    }
  };

  const handleScoreChange = (submissionId: string, value: string) => {
    setScores(prev => ({ ...prev, [submissionId]: value === '' ? '' : Number(value) }));
  };

  const handleFeedbackChange = (submissionId: string, value: string) => {
    setFeedback(prev => ({ ...prev, [submissionId]: value }));
  };

  const handleSaveMark = async (submissionId: string) => {
    try {
      if (!assignment || !id) return;
      const score = scores[submissionId];
      const studentFeedback = feedback[submissionId];

      if (score === '' || score === null || score === undefined) {
        alert('Please enter a score.');
        return;
      }
      if (score < 0 || score > assignment.maxScore) {
        alert(`Score must be between 0 and ${assignment.maxScore}.`);
        return;
      }

      await assignmentAPI.updateSubmissionScore(id, submissionId, score, studentFeedback);
      // After successful update, re-fetch assignment to get updated submissions
      const updatedAssignment = await assignmentAPI.getAssignment(id);
      setAssignment(updatedAssignment);
      alert('Score saved successfully!');
    } catch (err: any) {
      console.error('Error saving mark:', err);
      setError(err.response?.data?.message || 'Failed to save mark.');
    }
  };

  if (!user || !assignment) return <Typography>Loading...</Typography>;

  console.log('Assignment object in AssignmentDetail (Teacher View):', assignment);

  return (
    <Layout>
      <Box sx={{ flex: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {assignment.title}
        </Typography>
        <Typography variant="body1">Due: {new Date(assignment.dueDate).toLocaleDateString()}</Typography>
        <Typography variant="body1">Max Score: {assignment.maxScore}</Typography>
        <Typography variant="body1">Description: {assignment.description}</Typography>

        {assignment.brief && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${assignment.brief}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => console.log('Attempting to download brief. Full URL:', `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${assignment.brief}`)}
              component="a"
            >
              Download Assignment Brief
            </Button>
          </Box>
        )}

        {user.role === 'student' && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Submit Assignment</Typography>
            <input type="file" multiple onChange={handleFileChange} aria-label="Upload Assignment Files" />
            <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
              Submit
            </Button>
            {user.role === 'student' && assignment.submissions && assignment.submissions.length > 0 && (
              <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Typography variant="h6">Your Submission Details</Typography>
                {assignment.submissions.find(sub => sub.student._id === user._id) ? (
                  <>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Submitted: {new Date(assignment.submissions.find(sub => sub.student._id === user._id)!.submittedAt).toLocaleDateString()}
                    </Typography>
                    {assignment.submissions.find(sub => sub.student._id === user._id)!.files && assignment.submissions.find(sub => sub.student._id === user._id)!.files.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">Your Submitted Files:</Typography>
                        {assignment.submissions.find(sub => sub.student._id === user._id)!.files.map(file => (
                          <Button
                            key={file.fileUrl}
                            component="a"
                            href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${file.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                            onClick={() => console.log('Attempting to open student file:', file)}
                          >
                            {file.title}
                          </Button>
                        ))}
                      </Box>
                    )}
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Score: {assignment.submissions.find(sub => sub.student._id === user._id)!.score !== undefined ? `${assignment.submissions.find(sub => sub.student._id === user._id)!.score} / ${assignment.maxScore}` : 'Not graded'}
                    </Typography>
                    {assignment.submissions.find(sub => sub.student._id === user._id)!.feedback && (
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        Feedback: {assignment.submissions.find(sub => sub.student._id === user._id)!.feedback}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2">You have not submitted this assignment yet.</Typography>
                )}
              </Box>
            )}
          </Box>
        )}

        {user.role === 'teacher' && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Submissions</Typography>
            <List>
              {assignment.submissions.map((submission) => (
                <ListItem key={submission._id} sx={{ flexDirection: 'column', alignItems: 'flex-start', border: '1px solid #e0e0e0', borderRadius: 2, mb: 1, p: 2 }}>
                  <ListItemText
                    primary={`${submission.student.firstName} ${submission.student.lastName}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                        </Typography>
                        {submission.student.studentId && (
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            (ID: {submission.student.studentId})
                          </Typography>
                        )}
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color={submission.files && submission.files.length > 0 ? 'success.main' : 'text.secondary'}>
                            {submission.files && submission.files.length > 0 
                              ? `Files submitted: ${submission.files.length}`
                              : 'No files submitted yet'}
                          </Typography>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => {
                              if (submission.files && submission.files.length > 0) {
                                submission.files.forEach(file => {
                                  if (file.fileUrl) {
                                    window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${file.fileUrl}`, '_blank');
                                  } else {
                                    console.warn('file.fileUrl is undefined for file:', file);
                                    alert('File URL is missing.');
                                  }
                                });
                              } else {
                                alert('No files submitted yet');
                              }
                            }}
                            disabled={!submission.files || submission.files.length === 0}
                          >
                            View Submission
                          </Button>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Current Score: {submission.score !== undefined ? `${submission.score} / ${assignment.maxScore}` : 'Not graded'}
                        </Typography>
                        {submission.feedback && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Feedback: {submission.feedback}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <Box sx={{ mt: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                      label="Score"
                      type="number"
                      value={scores[submission._id as string] ?? ''}
                      onChange={(e) => handleScoreChange(submission._id as string, e.target.value)}
                      inputProps={{ min: 0, max: assignment.maxScore }}
                      sx={{ maxWidth: 150 }}
                      size="small"
                    />
                    <TextField
                      label="Feedback"
                      multiline
                      rows={2}
                      value={feedback[submission._id as string] ?? ''}
                      onChange={(e) => handleFeedbackChange(submission._id as string, e.target.value)}
                      fullWidth
                      size="small"
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSaveMark(submission._id as string)}
                      sx={{ mt: 1, maxWidth: 150 }}
                    >
                      Save Mark
                    </Button>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default AssignmentDetail;