// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Flex,
  Spacer,
  Text,
  List,
  ListItem,
  ListIcon,
  HStack,
  NumberInput,
  NumberInputField,
  VStack,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
} from '@chakra-ui/react';
import { MdReceipt } from 'react-icons/md';
import { FaTrash, FaEdit } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Dashboard({ token, onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [categories, setCategories] = useState([]); // Для хранения списка категорий
  const [newCategoryName, setNewCategoryName] = useState(''); // Для поля ввода новой категории
  const [selectedCategoryId, setSelectedCategoryId] = useState(''); // Для выпадающего списка в форме

  const fetchData = async () => {
    try {
      const [userRes, expensesRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/users/me`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/expenses/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/categories/`, { // <-- НОВЫЙ ЗАПРОС
                headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      if (!userRes.ok || !expensesRes.ok || !categoriesRes.ok) throw new Error("Ошибка загрузки данных");
      
      const userData = await userRes.json();
      const expensesData = await expensesRes.json();
      const categoriesData = await categoriesRes.json();
      
      setUserEmail(userData.email);
      setExpenses(expensesData);
      setCategories(categoriesData)

    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      if (error?.response?.status === 401) onLogout();
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleAddExpense = async (event) => {
    event.preventDefault();

    // Создаем базовый объект с данными
    const expenseData = {
        amount: parseFloat(amount),
        description: description,
        date: date,
    };

    // Проверяем, выбрал ли пользователь категорию
    if (selectedCategoryId) {
        // Если да, добавляем category_id в наш объект.
        // parseInt нужен, чтобы превратить строку из <select> в число.
        expenseData.category_id = parseInt(selectedCategoryId, 10);
    }

    try {
        await fetch(`${API_URL}/expenses/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            // Отправляем наш подготовленный объект expenseData
            body: JSON.stringify(expenseData)
        });
        
        // После успешной отправки обновляем все данные и сбрасываем поля формы
        await fetchData();
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setSelectedCategoryId(''); // <-- Важно! Сбрасываем и выбранную категорию

    } catch (error) {
        console.error("Ошибка добавления:", error);
        alert('Ошибка добавления расхода');
    }
};

  const openDeleteModal = (expenseId) => {
    setExpenseToDelete(expenseId);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await fetch(`${API_URL}/expenses/${expenseToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchData();
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      alert('Произошла ошибка при удалении расхода.');
    }
  };

  const openEditModal = (expense) => {
    setExpenseToEdit(expense);
    setIsEditModalOpen(true);
  };

  // --- ИСПРАВЛЕННАЯ ВЕРСИЯ ---
  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    if (!expenseToEdit || !expenseToEdit.id) {
        console.error("Попытка обновить расход без ID!");
        return;
    }
    try {
      const response = await fetch(`${API_URL}/expenses/${expenseToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(expenseToEdit.amount),
          description: expenseToEdit.description,
          date: expenseToEdit.date.split('T')[0],
          category_id: expenseToEdit.category_id 
        })
      });

      if (!response.ok) {
          const errorData = await response.json();
          console.error("Ошибка от сервера:", errorData);
          throw new Error('Не удалось обновить расход. Проверьте консоль.');
      }

      await fetchData();
      setIsEditModalOpen(false);
      setExpenseToEdit(null);
    } catch (error) {
      alert(error.message);
    }
  };
  const handleAddCategory = async (event) => {
    event.preventDefault();
    if (!newCategoryName.trim()) return; // Не добавляем пустые категории

    try {
        await fetch(`${API_URL}/categories/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newCategoryName })
        });
        fetchData(); // Обновляем все данные, включая список категорий
        setNewCategoryName(''); // Очищаем поле ввода
    } catch (error) {
        alert('Ошибка добавления категории');
    }
};

  return (
    <>
      <Box maxW="container.md" mx="auto" mt={8} p={4}>
        <Flex mb={8} alignItems="center">
          <Heading as="h1" size="xl">Ваши расходы</Heading>
          <Spacer />
          <Text mr={4}>{userEmail}</Text>
          <Button onClick={onLogout}>Выйти</Button>
        </Flex>

        <Box as="form" onSubmit={handleAddExpense} p={6} mb={8} borderWidth={1} borderRadius="lg" boxShadow="md">
            <VStack spacing={4}>
                <Heading as="h3" size="md">Добавить новый расход</Heading>
                <FormControl isRequired>
                    <FormLabel>Сумма</FormLabel>
                    <NumberInput value={amount} onChange={(valueString) => setAmount(valueString)}>
                        <NumberInputField placeholder="Например, 150.50" />
                    </NumberInput>
                </FormControl>
                <FormControl>
                    <FormLabel>Описание</FormLabel>
                    <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Например, Кофе" />
                </FormControl>
                <FormControl>
                    <FormLabel>Дата</FormLabel>
                    <Input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                    />
                </FormControl>
                <FormControl>
    <FormLabel>Категория</FormLabel>
    <Select 
        placeholder="Выберите категорию"
        value={selectedCategoryId}
        onChange={(e) => setSelectedCategoryId(e.target.value)}
    >
        {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
    </Select>
</FormControl>
                <Button type="submit" colorScheme="teal" width="full">Добавить</Button>

            </VStack>
        </Box>
        <Box as="form" onSubmit={handleAddCategory} p={6} mb={8} borderWidth={1} borderRadius="lg" boxShadow="md">
    <VStack spacing={4}>
        <Heading as="h3" size="md">Ваши категории</Heading>
        <List spacing={2} width="full">
            {categories.map(cat => (
                <ListItem key={cat.id}>{cat.name}</ListItem>
            ))}
        </List>
        <HStack width="full">
            <Input 
                placeholder="Название новой категории"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Button type="submit" colorScheme="green">Добавить</Button>
        </HStack>
    </VStack>
</Box>
        <List spacing={3}>
    {expenses.length > 0 ? expenses.map(expense => (
        <ListItem key={expense.id} p={3} borderWidth={1} borderRadius="md" boxShadow="sm">
            <Flex justify="space-between" align="center">
                
                {/* Левая часть: Иконка, Описание и Дата */}
                <HStack>
                    <ListIcon as={MdReceipt} color="green.500" w={6} h={6} />
                    <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{expense.description || 'Без описания'}</Text>
                        <Text fontSize="sm" color="gray.500">
                            {new Date(expense.date).toLocaleDateString('ru-RU')}
                        </Text>
                    </VStack>
                </HStack>

                {/* Правая часть: Категория, Сумма и Кнопки */}
                <HStack>
                    {/* Показываем категорию, только если она есть */}
                    {expense.category && (
                        <Text fontSize="sm" color="blue.500" mr={3}>
                            {expense.category.name}
                        </Text>
                    )}
                    <Text fontWeight="bold">{expense.amount} ₽</Text>
                    <IconButton
                        size="sm"
                        colorScheme="blue"
                        icon={<FaEdit />}
                        aria-label="Изменить расход"
                        onClick={() => openEditModal(expense)}
                    />
                    <IconButton
                        size="sm"
                        colorScheme="red"
                        icon={<FaTrash />}
                        aria-label="Удалить расход"
                        onClick={() => openDeleteModal(expense.id)}
                    />
                </HStack>
            </Flex>
        </ListItem>
    )) : (
        <ListItem>
            <Text>У вас пока нет расходов.</Text>
        </ListItem>
    )}
</List>
      </Box>

      {/* Модальное окно удаления */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Подтверждение удаления</ModalHeader>
          <ModalCloseButton />
          <ModalBody><Text>Вы уверены?</Text></ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsDeleteModalOpen(false)}>Отмена</Button>
            <Button colorScheme="red" onClick={confirmDelete}>Удалить</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Модальное окно редактирования */}
      {expenseToEdit && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
          <ModalOverlay />
          <ModalContent as="form" onSubmit={handleUpdateSubmit}>
            <ModalHeader>Редактировать расход</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Сумма</FormLabel>
                  <NumberInput
                    value={expenseToEdit.amount}
                    onChange={(valueString) => setExpenseToEdit({ ...expenseToEdit, amount: valueString })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>Описание</FormLabel>
                  <Input
                    value={expenseToEdit.description || ''}
                    onChange={(e) => setExpenseToEdit({ ...expenseToEdit, description: e.target.value })}
                  />
                </FormControl>
                <FormControl>
        <FormLabel>Дата</FormLabel>
        <Input 
            type="date"
            value={expenseToEdit.date.split('T')[0]} // Берем только дату, без времени
            onChange={(e) => setExpenseToEdit({...expenseToEdit, date: e.target.value})}
        />
            </FormControl>
            <FormControl>
        <FormLabel>Категория</FormLabel>
        <Select
            placeholder="Без категории"
            // ВАЖНО: значением select'а будет ID категории, если она есть, иначе пустая строка
            value={expenseToEdit.category?.id || ''}
            onChange={(e) => {
                const newCatId = e.target.value ? parseInt(e.target.value, 10) : null;
                setExpenseToEdit({ ...expenseToEdit, category_id: newCatId });
            }}
        >
            {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
        </Select>
    </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setIsEditModalOpen(false)}>Отмена</Button>
              <Button colorScheme="blue" type="submit">Сохранить</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default Dashboard;