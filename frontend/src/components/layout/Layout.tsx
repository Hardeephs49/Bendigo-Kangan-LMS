import React, { useState } from 'react';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        color: '#333333',
        margin: 0,
        padding: 0,
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <Navbar isSidebarOpen={isSidebarOpen} />
      <Container 
        maxWidth={false} 
        sx={{ 
          flex: 1, 
          width: '100%', 
          margin: 0, 
          padding: 0,
          paddingTop: '50px',
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout;