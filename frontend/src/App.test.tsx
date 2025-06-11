import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';import App from './App';
import AssignmentDetail from './pages/AssignmentDetail';

test('renders AssignmentDetail page', () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/assignments/123']}>
        <AssignmentDetail />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
});

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
