// Адрес нашего API. Если запускаете локально, он такой.
const API_URL = 'http://127.0.0.1:8000';

// --- Получаем элементы со страницы ---
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

const userEmailSpan = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const expensesList = document.getElementById('expenses-list');
const addExpenseForm = document.getElementById('add-expense-form');
const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');

// --- Главная функция, которая запускается при загрузке страницы ---
function init() {
    const token = localStorage.getItem('token');
    if (token) {
        // Если токен есть в памяти браузера, показываем дашборд
        showDashboard(token);
    } else {
        // Если токена нет, показываем форму входа
        showLogin();
    }
}

// --- Функции для отображения/скрытия блоков ---
function showLogin() {
    loginView.classList.remove('d-none');
    dashboardView.classList.add('d-none');
}

async function showDashboard(token) {
    loginView.classList.add('d-none');
    dashboardView.classList.remove('d-none');

    // Получаем информацию о пользователе и его расходы
    try {
        const user = await fetchCurrentUser(token);
        userEmailSpan.textContent = user.email;

        const expenses = await fetchExpenses(token);
        renderExpenses(expenses);
    } catch (error) {
        // Если токен "протух" или невалидный, выкидываем на логин
        console.error('Ошибка аутентификации:', error);
        logout();
    }
}

// --- Функции для работы с API ---
async function login(email, password) {
    // Swagger отправлял form-data, а мы будем отправлять правильный JSON
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            'username': email,
            'password': password
        })
    });

    if (!response.ok) {
        throw new Error('Неверный email или пароль');
    }

    const data = await response.json();
    return data.access_token;
}

async function fetchCurrentUser(token) {
    const response = await fetch(`${API_URL}/users/me`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Не удалось получить данные пользователя');
    return await response.json();
}

async function fetchExpenses(token) {
    const response = await fetch(`${API_URL}/expenses/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Не удалось загрузить расходы');
    return await response.json();
}

async function addExpense(token, amount, description) {
    const response = await fetch(`${API_URL}/expenses/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, description })
    });
    if (!response.ok) throw new Error('Не удалось добавить расход');
    return await response.json();
}

// --- Функция для "отрисовки" списка расходов ---
function renderExpenses(expenses) {
    expensesList.innerHTML = ''; // Очищаем старый список
    if (expenses.length === 0) {
        expensesList.innerHTML = '<li class="list-group-item">У вас пока нет расходов.</li>';
        return;
    }
    expenses.forEach(expense => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <span>${expense.description || 'Без описания'}</span>
            <span class="badge bg-primary rounded-pill">${expense.amount} ₽</span>
        `;
        expensesList.appendChild(li);
    });
}

// --- Обработчики событий (когда пользователь что-то нажимает) ---
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Предотвращаем перезагрузку страницы
    loginError.classList.add('d-none');
    try {
        const token = await login(emailInput.value, passwordInput.value);
        localStorage.setItem('token', token); // Сохраняем токен в память браузера
        showDashboard(token);
    } catch (error) {
        loginError.textContent = error.message;
        loginError.classList.remove('d-none');
    }
});

logoutButton.addEventListener('click', () => {
    logout();
});

function logout() {
    localStorage.removeItem('token'); // Удаляем токен из памяти
    showLogin();
}

addExpenseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        await addExpense(token, parseFloat(amountInput.value), descriptionInput.value);
        // После успешного добавления, обновляем список
        const expenses = await fetchExpenses(token);
        renderExpenses(expenses);
        // Очищаем поля формы
        amountInput.value = '';
        descriptionInput.value = '';
    } catch (error) {
        alert('Ошибка добавления расхода: ' + error.message);
    }
});


// --- Запускаем все! ---
init();