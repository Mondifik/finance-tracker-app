// src/components/Login.js
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Alert,
  AlertIcon,
  VStack
} from '@chakra-ui/react'; 

function Register({ onRegisterSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const API_URL = process.env.REACT_APP_API_URL;

      const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        // Если ответ НЕ успешный...
        try {
          // ...сначала ПЫТАЕМСЯ прочитать тело как JSON
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Произошла ошибка');
        } catch (jsonError) {
          // ...но если это НЕ УДАЛОСЬ (тело пустое),
          // то выкидываем ОБЩУЮ ошибку
          throw new Error(`Ошибка ${response.status}: Email уже занят или неверные данные`);
        }
      }

      // Если ответ УСПЕШНЫЙ
      onRegisterSuccess({ email: email });

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={10} p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <VStack spacing={4} as="form" onSubmit={handleSubmit}>
        {/* 4. Меняем заголовки и текст */}
        <Heading as="h1" size="lg">Регистрация</Heading>
        
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Пароль</FormLabel>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormControl>

        {error && (<Alert status="error"><AlertIcon />{error}</Alert>)}

        <Button type="submit" colorScheme="teal" width="full">Зарегистрироваться</Button>
      </VStack>
    </Box>
  );
}

export default Register;