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

      // Если ответ НЕ успешный (например, 400 - email уже занят)
      if (!response.ok) {
        // Пытаемся прочитать ошибку в формате JSON
        const errorData = await response.json();
        // Выкидываем ошибку с текстом от сервера
        throw new Error(errorData.detail || 'Произошла неизвестная ошибка');
      }

      // Если ответ УСПЕШНЫЙ (201 Created), нам не нужно читать его тело,
      // так как оно может быть пустым. Сам факт успеха - это все, что нам нужно.
      // Мы просто вызываем родительскую функцию, передав ей email, который мы и так знаем.
      onRegisterSuccess({ email: email });

    } catch (err) {
      // Ловим любую ошибку (сетевую или ту, что мы выкинули выше)
      // и показываем ее пользователю.
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