// src/App.js
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import { Box } from '@chakra-ui/react';


function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <Box>
      {token ? (
        <Dashboard token={token} onLogout={handleLogout} />
      ) : (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
    </Box>
  );
}

export default App;