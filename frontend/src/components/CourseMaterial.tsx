import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { courseMaterialAPI } from '../services/api';
import { API_URL } from '../services/api';
import { CourseMaterial } from '../types';

interface CourseMaterialProps {
  courseId: string;
}

const CourseMaterialComponent: React.FC<CourseMaterialProps> = ({ courseId }) => {
  console.log('[Frontend] CourseMaterialComponent rendering.', { courseId });
  const { user } = useAuth();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true,
    file: null as File | null,
  });

  useEffect(() => {
    console.log('[Frontend] CourseMaterialComponent useEffect triggered.');
    fetchMaterials();
  }, [courseId]);

  const fetchMaterials = async () => {
    console.log('[Frontend] fetchMaterials called.');
    if (!courseId) {
      console.log('[Frontend] courseId is undefined, skipping fetchMaterials.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching materials for courseId:', courseId);
      console.log('[Frontend] Attempting courseMaterialAPI.getCourseMaterials with courseId:', courseId);
      const data = await courseMaterialAPI.getCourseMaterials(courseId);
      console.log('Fetched materials data:', data);
      setMaterials(data);
    } catch (err) {
      setError('Failed to fetch course materials');
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        file: event.target.files![0]
      }));
    }
  };

  const handleUpload = async () => {
    if (!formData.file || !formData.title || !formData.description) {
      setError('Please fill in all fields and select a file');
      return;
    }

    try {
      setUploading(true);
      const uploadData = new FormData();
      uploadData.append('file', formData.file);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('isPublic', String(formData.isPublic));
      uploadData.append('courseId', courseId);

      await courseMaterialAPI.uploadMaterial(uploadData);
      setOpenDialog(false);
      setFormData({
        title: '',
        description: '',
        isPublic: true,
        file: null,
      });
      fetchMaterials();
    } catch (err) {
      setError('Failed to upload material');
      console.error('Error uploading material:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await courseMaterialAPI.deleteMaterial(materialId);
        fetchMaterials();
      } catch (err) {
        setError('Failed to delete material');
        console.error('Error deleting material:', err);
      }
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const baseUrl = API_URL.replace('/api', '');
    const fullUrl = `${baseUrl}${fileUrl}`;
    console.log('Attempting to download file:', fullUrl, fileName);
    window.open(fullUrl, '_blank');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {user?.role === 'teacher' && (
        <Box mb={2}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Upload Material
          </Button>
        </Box>
      )}

      <Paper>
        <List>
          {materials.length === 0 ? (
            <ListItem>
              <ListItemText primary="No course materials available" />
            </ListItem>
          ) : (
            materials.map((material) => (
              <ListItem key={material._id}>
                <DescriptionIcon sx={{ mr: 2 }} />
                <ListItemText
                  primary={material.title}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="textPrimary">
                        {material.description}
                      </Typography>
                      <br />
                      <Typography component="span" variant="caption" color="textSecondary">
                        Uploaded by {material.uploadedBy.firstName} {material.uploadedBy.lastName} on{' '}
                        {new Date(material.uploadDate).toLocaleDateString()}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDownload(material.fileUrl, material.title)}
                    sx={{ mr: 1 }}
                  >
                    <DownloadIcon />
                  </IconButton>
                  {user?.role === 'teacher' && (
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(material._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Course Material</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              required
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
              }
              label="Make public"
              sx={{ mt: 1 }}
            />
            <Box sx={{ mt: 2 }}>
              <input
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="raised-button-file">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                >
                  Select File
                </Button>
              </label>
              {formData.file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {formData.file.name}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseMaterialComponent; 