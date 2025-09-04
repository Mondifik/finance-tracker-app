// src/components/AuthPage.js
import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { Box, Button, Text } from '@chakra-ui/react';

function AuthPage({ onLoginSuccess }) {
  const [showLogin, setShowLogin] = useState(true);

  const handleRegisterSuccess = (user) => {
    alert(`Пользователь ${user.email} успешно зарегистрирован! Теперь вы можете войти.`);
    setShowLogin(true); // Переключаем обратно на форму входа
  };

  return (
    <Box>
      {showLogin ? (
        <Login onLoginSuccess={onLoginSuccess} />
      ) : (
        <Register onRegisterSuccess={handleRegisterSuccess} />
      )}

      <Box textAlign="center" mt={4}>
        {showLogin ? (
          <Text>
            Еще нет аккаунта?{' '}
            <Button variant="link" colorScheme="teal" onClick={() => setShowLogin(false)}>
              Зарегистрироваться
            </Button>
          </Text>
        ) : (
          <Text>
            Уже есть аккаунт?{' '}
            <Button variant="link" colorScheme="teal" onClick={() => setShowLogin(true)}>
              Войти
            </Button>
          </Text>
        )}
      </Box>
    </Box>
  );
}

export default AuthPage;