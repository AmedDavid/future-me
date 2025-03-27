document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        messageForm: document.getElementById('messageForm'),
        futureMessagesList: document.getElementById('futureMessagesList'),
        pastMessagesList: document.getElementById('pastMessagesList'),
        themeToggle: document.getElementById('themeToggle'),
        searchInput: document.getElementById('searchInput'),
        futureSort: document.getElementById('futureSort'),
        pastSort: document.getElementById('pastSort'),
        messageInput: document.getElementById('messageInput'),
        charCount: document.getElementById('charCount'),
        notifications: document.getElementById('notifications'),
        revealDate: document.getElementById('revealDate'),
        categoryInput: document.getElementById('categoryInput'),
        totalMessages: document.getElementById('totalMessages'),
        futureCount: document.getElementById('futureCount'),
        pastCount: document.getElementById('pastCount'),
        navToggle: document.querySelector('.nav-toggle'),
        navMenu: document.querySelector('.nav-menu')
    };

    const API_URL = 'https://future-me-5ssb.onrender.com/messages';

    // Initialize Theme
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        elements.themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    };
    initTheme();

    // Initial Load
    fetchMessages();
    setInterval(updateCountdowns, 1000);

    // Navbar Toggle
    elements.navToggle.addEventListener('click', () => {
        elements.navMenu.classList.toggle('active');
    });

    // Event Listeners
    elements.themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        elements.themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', newTheme);
    });

    elements.messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageData = {
            text: elements.messageInput.value,
            revealDate: new Date(elements.revealDate.value).toISOString(),
            createdAt: new Date().toISOString(),
            category: elements.categoryInput.value || 'Uncategorized'
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });
            showNotification('Message sent to your future self!', 'success');
            elements.messageForm.reset();
            elements.charCount.textContent = '0';
            fetchMessages(true);
        } catch (error) {
            showNotification('Failed to send message. Please try again.', 'error');
        }
    });

    elements.revealDate.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value);
        if (selectedDate < new Date()) {
            alert('Please select a future date!');
            e.target.value = '';
        }
    });

    elements.searchInput.addEventListener('input', debounce(() => fetchMessages(), 300));
    elements.futureSort.addEventListener('change', () => fetchMessages());
    elements.pastSort.addEventListener('change', () => fetchMessages());
    elements.messageInput.addEventListener('input', () => {
        elements.charCount.textContent = elements.messageInput.value.length;
    });

    // Fetch and Render Messages
    async function fetchMessages(animateNew = false) {
        try {
            const response = await fetch(API_URL);
            let messages = await response.json();

            const searchTerm = elements.searchInput.value.toLowerCase();
            if (searchTerm) {
                messages = messages.filter(msg =>
                    msg.text.toLowerCase().includes(searchTerm) ||
                    msg.category.toLowerCase().includes(searchTerm)
                );
            }

            const futureMessages = messages.filter(msg => new Date(msg.revealDate) > new Date());
            const pastMessages = messages.filter(msg => new Date(msg.revealDate) <= new Date());

            sortMessages(futureMessages, elements.futureSort.value);
            sortMessages(pastMessages, elements.pastSort.value);

            renderMessages(futureMessages, elements.futureMessagesList, true, animateNew);
            renderMessages(pastMessages, elements.pastMessagesList, false, animateNew);

            updateStats(messages.length, futureMessages.length, pastMessages.length);
            localStorage.setItem('messagesBackup', JSON.stringify(messages));
        } catch (error) {
            console.error('Error fetching messages:', error);
            showNotification('Failed to load messages. Using backup.', 'error');
            const backup = JSON.parse(localStorage.getItem('messagesBackup') || '[]');
            const futureMessages = backup.filter(msg => new Date(msg.revealDate) > new Date());
            const pastMessages = backup.filter(msg => new Date(msg.revealDate) <= new Date());
            renderMessages(futureMessages, elements.futureMessagesList, true);
            renderMessages(pastMessages, elements.pastMessagesList, false);
            updateStats(backup.length, futureMessages.length, pastMessages.length);
        }
    }

    function sortMessages(messages, sortType) {
        switch (sortType) {
            case 'date-asc':
                messages.sort((a, b) => new Date(a.revealDate) - new Date(b.revealDate));
                break;
            case 'date-desc':
                messages.sort((a, b) => new Date(b.revealDate) - new Date(a.revealDate));
                break;
            case 'text':
                messages.sort((a, b) => a.text.localeCompare(b.text));
                break;
        }
    }

    function renderMessages(messages, container, showCountdown, animateNew) {
        container.innerHTML = '';
        messages.forEach((message, index) => {
            const messageCard = document.createElement('div');
            messageCard.className = 'message-card';
            if (animateNew && index === 0) messageCard.classList.add('new');

            const content = document.createElement('p');
            content.textContent = message.text;
            messageCard.appendChild(content);

            const category = document.createElement('div');
            category.className = 'category';
            category.textContent = `Category: ${message.category}`;
            messageCard.appendChild(category);

            if (showCountdown) {
                const countdown = document.createElement('div');
                countdown.className = 'countdown';
                countdown.dataset.revealDate = message.revealDate;
                messageCard.appendChild(countdown);
            }

            const actions = document.createElement('div');
            actions.className = 'message-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-edit';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', () => editMessage(message));
            actions.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this message?')) {
                    try {
                        await fetch(`${API_URL}/${message.id}`, { method: 'DELETE' });
                        showNotification('Message deleted successfully!', 'success');
                        fetchMessages();
                    } catch (error) {
                        showNotification('Failed to delete message.', 'error');
                    }
                }
            });
            actions.appendChild(deleteBtn);

            messageCard.appendChild(actions);
            container.appendChild(messageCard);
        });
    }

    async function editMessage(message) {
        const newText = prompt('Edit your message:', message.text);
        const newCategory = prompt('Edit category:', message.category);
        if (newText && (newText !== message.text || newCategory !== message.category)) {
            try {
                await fetch(`${API_URL}/${message.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: newText,
                        category: newCategory || message.category
                    })
                });
                showNotification('Message updated successfully!', 'success');
                fetchMessages();
            } catch (error) {
                showNotification('Failed to update message.', 'error');
            }
        }
    }

    function updateCountdowns() {
        const countdownElements = document.querySelectorAll('.countdown');
        countdownElements.forEach(element => {
            const revealDate = new Date(element.dataset.revealDate);
            const now = new Date();
            const diff = revealDate - now;

            if (diff <= 0) {
                fetchMessages();
                showNotification('A message has been unlocked!', 'success');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            element.textContent = `Unlocks in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
        });
    }

    function updateStats(total, future, past) {
        elements.totalMessages.textContent = total;
        elements.futureCount.textContent = future;
        elements.pastCount.textContent = past;
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        elements.notifications.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});