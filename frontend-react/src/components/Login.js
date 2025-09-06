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

const API_URL = 'https://finance-tracker-app-production-e5ce.up.railway.app';
console.log("LOGIN COMPONENT USING API URL:", API_URL);

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ 'username': email, 'password': password })
            });
            if (!response.ok) { throw new Error('Неверный email или пароль'); }
            const data = await response.json();
            onLoginSuccess(data.access_token);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Box maxW="md" mx="auto" mt={10} p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
            <VStack spacing={4} as="form" onSubmit={handleSubmit}>
                <Heading as="h1" size="lg">Вход</Heading>
                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Пароль</FormLabel>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </FormControl>
                {error && (<Alert status="error"><AlertIcon />{error}</Alert>)}
                <Button type="submit" colorScheme="teal" width="full">Войти</Button>
            </VStack>
        </Box>
    );
}
export default Login;