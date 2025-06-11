import React from 'react';
import { Box, Typography } from '@mui/material';
import Layout from '../components/layout/Layout';
import CommunicationComponent from '../components/CommunicationComponent';

const CommunicationPage: React.FC = () => {
  return (
    <Layout>
      <Box sx={{ mt: 8, px: 3, py: 2 }}>
        <Typography variant="h4" gutterBottom>
          Communication Portal
        </Typography>
        <CommunicationComponent />
      </Box>
    </Layout>
  );
};

export default CommunicationPage; 