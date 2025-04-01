document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        messageForm: document.getElementById('messageForm'),
        futureMessagesList: document.getElementById('futureMessagesList'),
        pastMessagesList: document.getElementById('pastMessagesList'),
        draftsList: document.getElementById('draftsList'),
        themeToggle: document.getElementById('themeToggle'),
        searchInput: document.getElementById('searchInput'),
        categoryFilter: document.getElementById('categoryFilter'),
        futureSort: document.getElementById('futureSort'),
        pastSort: document.getElementById('pastSort'),
        draftSort: document.getElementById('draftSort'),
        messageInput: document.getElementById('messageInput'),
        charCount: document.getElementById('charCount'),
        notifications: document.getElementById('notifications'),
        revealDate: document.getElementById('revealDate'),
        categoryInput: document.getElementById('categoryInput'),
        tagsInput: document.getElementById('tagsInput'),
        reminderToggle: document.getElementById('reminderToggle'),
        totalMessages: document.getElementById('totalMessages'),
        futureCount: document.getElementById('futureCount'),
        pastCount: document.getElementById('pastCount'),
        draftCount: document.getElementById('draftCount'),
        categoryCount: document.getElementById('categoryCount'),
        navToggle: document.querySelector('.nav-toggle'),
        navMenu: document.querySelector('.nav-menu'),
        exportBtn: document.getElementById('exportBtn'),
        importBtn: document.getElementById('importBtn'),
        draftBtn: document.getElementById('draftBtn'),
        statsChart: document.getElementById('statsChart').getContext('2d'),
        sendDraftModal: document.getElementById('sendDraftModal'),
        sendDraftForm: document.getElementById('sendDraftForm'),
        draftRevealDate: document.getElementById('draftRevealDate'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        attachmentInput: document.getElementById('attachmentInput'),
        attachmentPreviews: document.getElementById('attachmentPreviews')
    };
    
    const API_URL = 'https://future-me-5ssb.onrender.com/messages';
    // const API_URL = 'http://localhost:3000/messages';
    const SHARE_BASE_URL = `${window.location.origin}/message/`;
    let chartInstance = null;
    let currentDraftId = null;
    let attachments = []; //hold file data

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

    elements.attachmentInput.addEventListener('change', (e) => {
        attachments = Array.from(e.target.files);
        updateAttachmentPreviews();
    });

    elements.messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!elements.messageInput.value.trim()) {
            showNotification('Please enter a message before sending!', 'error');
            return;
        }
        if (!elements.revealDate.value) {
            showNotification('Please set a reveal date to send to the future!', 'error');
            return;
        }

        const messageData = await prepareMessageData(false);
        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });
            showNotification('Message sent to your future self!', 'success');
            resetForm();
            fetchMessages(true);
        } catch (error) {
            showNotification('Failed to send message. Please try again.', 'error');
        }
    });

    elements.draftBtn.addEventListener('click', async () => {
        if (!elements.messageInput.value.trim()) {
            showNotification('Please enter a message before saving as a draft!', 'error');
            return;
        }

        const messageData = await prepareMessageData(true);
        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });
            showNotification('Message saved as draft!', 'success');
            resetForm();
            fetchMessages(true);
        } catch (error) {
            showNotification('Failed to save draft. Please try again.', 'error');
        }
    });

    elements.revealDate.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value);
        if (selectedDate < new Date()) {
            showNotification('Please select a future date and time!', 'error');
            e.target.value = '';
        }
    });

    elements.draftRevealDate.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value);
        if (selectedDate < new Date()) {
            showNotification('Please select a future date and time!', 'error');
            e.target.value = '';
        }
    });

    elements.searchInput.addEventListener('input', debounce(() => fetchMessages(), 300));
    elements.categoryFilter.addEventListener('change', () => fetchMessages());
    elements.futureSort.addEventListener('change', () => fetchMessages());
    elements.pastSort.addEventListener('change', () => fetchMessages());
    elements.draftSort.addEventListener('change', () => fetchMessages());
    elements.messageInput.addEventListener('input', () => {
        elements.charCount.textContent = elements.messageInput.value.length;
    });

    elements.exportBtn.addEventListener('click', exportMessages);
    elements.importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = importMessages;
        input.click();
    });

    elements.closeModalBtn.addEventListener('click', () => {
        elements.sendDraftModal.classList.remove('active');
        elements.sendDraftForm.reset();
    });

    elements.sendDraftForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!elements.draftRevealDate.value) {
            showNotification('Please select a reveal date!', 'error');
            return;
        }
        const selectedDate = new Date(elements.draftRevealDate.value);
        if (selectedDate < new Date()) {
            showNotification('Please select a future date and time!', 'error');
            return;
        }

        try {
            await fetch(`${API_URL}/${currentDraftId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    revealDate: selectedDate.toISOString(),
                    draft: false
                })
            });
            showNotification('Draft sent to your future self!', 'success');
            elements.sendDraftModal.classList.remove('active');
            elements.sendDraftForm.reset();
            fetchMessages();
        } catch (error) {
            showNotification('Failed to send draft.', 'error');
        }
    });

    // Helper Functions
    async function prepareMessageData(isDraft) {
        const attachmentData = await Promise.all(
            attachments.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve({ name: file.name, data: reader.result });
                    reader.readAsDataURL(file);
                });
            })
        );

        return {
            text: elements.messageInput.value,
            revealDate: isDraft ? null : new Date(elements.revealDate.value).toISOString(),
            createdAt: new Date().toISOString(),
            category: elements.categoryInput.value || 'Uncategorized',
            tags: elements.tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
            pinned: false,
            reminder: elements.reminderToggle.checked,
            draft: isDraft,
            attachments: attachmentData
        };
    }

    function updateAttachmentPreviews() {
        elements.attachmentPreviews.innerHTML = '';
        attachments.forEach((file, index) => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'attachment-preview';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.alt = `Preview of ${file.name}`;
                previewDiv.appendChild(img);
            }

            const nameSpan = document.createElement('span');
            nameSpan.textContent = file.name;
            previewDiv.appendChild(nameSpan);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-attachment';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', () => {
                attachments.splice(index, 1);
                updateAttachmentPreviews();
            });
            previewDiv.appendChild(removeBtn);

            elements.attachmentPreviews.appendChild(previewDiv);
        });
    }

    function resetForm() {
        elements.messageForm.reset();
        elements.charCount.textContent = '0';
        attachments = [];
        elements.attachmentPreviews.innerHTML = '';
    }

    // Fetch and Render Messages
    async function fetchMessages(animateNew = false) {
        try {
            const response = await fetch(API_URL);
            let messages = await response.json();

            const searchTerm = elements.searchInput.value.toLowerCase();
            const selectedCategory = elements.categoryFilter.value;
            if (searchTerm) {
                messages = messages.filter(msg =>
                    msg.text.toLowerCase().includes(searchTerm) ||
                    msg.category.toLowerCase().includes(searchTerm) ||
                    (msg.tags && msg.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
                );
            }
            if (selectedCategory && selectedCategory !== "") {
                messages = messages.filter(msg => msg.category === selectedCategory);
            }

            const drafts = messages.filter(msg => msg.draft);
            const futureMessages = messages.filter(msg => !msg.draft && new Date(msg.revealDate) > new Date());
            const pastMessages = messages.filter(msg => !msg.draft && new Date(msg.revealDate) <= new Date());

            sortMessages(drafts, elements.draftSort.value);
            sortMessages(futureMessages, elements.futureSort.value);
            sortMessages(pastMessages, elements.pastSort.value);

            renderDrafts(drafts, elements.draftsList, animateNew);
            renderMessages(futureMessages, elements.futureMessagesList, true, animateNew);
            renderMessages(pastMessages, elements.pastMessagesList, false, animateNew);

            const uniqueCategories = new Set(messages.map(msg => msg.category));
            updateStats(messages.length, futureMessages.length, pastMessages.length, drafts.length, uniqueCategories.size);
            updateCategoryFilter(uniqueCategories);
            updateStatsChart(messages.filter(msg => !msg.draft));

            localStorage.setItem('messagesBackup', JSON.stringify(messages));
        } catch (error) {
            console.error('Error fetching messages:', error);
            showNotification('Failed to load messages. Using backup.', 'error');
            const backup = JSON.parse(localStorage.getItem('messagesBackup') || '[]');
            const drafts = backup.filter(msg => msg.draft);
            const futureMessages = backup.filter(msg => !msg.draft && new Date(msg.revealDate) > new Date());
            const pastMessages = backup.filter(msg => !msg.draft && new Date(msg.revealDate) <= new Date());
            renderDrafts(drafts, elements.draftsList);
            renderMessages(futureMessages, elements.futureMessagesList, true);
            renderMessages(pastMessages, elements.pastMessagesList, false);
            const uniqueCategories = new Set(backup.map(msg => msg.category));
            updateStats(backup.length, futureMessages.length, pastMessages.length, drafts.length, uniqueCategories.size);
            updateCategoryFilter(uniqueCategories);
            updateStatsChart(backup.filter(msg => !msg.draft));
        }
    }

    function sortMessages(messages, sortType) {
        const pinned = messages.filter(msg => msg.pinned);
        const unpinned = messages.filter(msg => !msg.pinned);
        switch (sortType) {
            case 'date-asc':
                pinned.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                unpinned.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'date-desc':
                pinned.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                unpinned.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'text':
                pinned.sort((a, b) => a.text.localeCompare(b.text));
                unpinned.sort((a, b) => a.text.localeCompare(b.text));
                break;
        }
        return [...pinned, ...unpinned];
    }

    function renderMessages(messages, container, isFuture, animateNew) {
        container.innerHTML = '';
        if (messages.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No messages found.';
            emptyMessage.style.color = 'var(--secondary)';
            emptyMessage.style.textAlign = 'center';
            container.appendChild(emptyMessage);
            return;
        }

        messages.forEach((message, index) => {
            const messageCard = document.createElement('div');
            messageCard.className = 'message-card';
            if (message.pinned) messageCard.classList.add('pinned');
            if (animateNew && index === 0) messageCard.classList.add('new');

            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'content-wrapper';

            const content = document.createElement('p');
            if (isFuture) {
                content.className = 'locked-message';
                content.innerHTML = '<i class="fas fa-lock"></i> Message locked until reveal date';
            } else {
                content.textContent = message.text;
                contentWrapper.addEventListener('click', () => {
                    contentWrapper.classList.toggle('collapsed');
                });
            }
            contentWrapper.appendChild(content);

            const category = document.createElement('div');
            category.className = 'category';
            category.textContent = `Category: ${message.category}`;
            contentWrapper.appendChild(category);

            if (message.tags && message.tags.length > 0) {
                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'tags';
                message.tags.forEach(tag => {
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'tag';
                    tagSpan.textContent = tag;
                    tagsDiv.appendChild(tagSpan);
                });
                contentWrapper.appendChild(tagsDiv);
            }

            if (message.reminder) {
                const reminderNote = document.createElement('div');
                reminderNote.className = 'reminder-note';
                reminderNote.textContent = 'Reminder Set';
                reminderNote.style.color = '#8b5cf6';
                reminderNote.style.fontSize = '0.9rem';
                contentWrapper.appendChild(reminderNote);
            }

            if (isFuture) {
                const countdown = document.createElement('div');
                countdown.className = 'countdown';
                countdown.dataset.revealDate = message.revealDate;
                contentWrapper.appendChild(countdown);
            }

            if (!isFuture && message.attachments && message.attachments.length > 0) {
                const attachmentsDiv = document.createElement('div');
                attachmentsDiv.className = 'attachments-display';
                message.attachments.forEach(attachment => {
                    const attachmentItem = document.createElement('div');
                    attachmentItem.className = 'attachment-item';

                    if (attachment.data.startsWith('data:image/')) {
                        const img = document.createElement('img');
                        img.src = attachment.data;
                        img.alt = attachment.name;
                        img.addEventListener('click', () => window.open(attachment.data, '_blank'));
                        attachmentItem.appendChild(img);
                    } else {
                        const link = document.createElement('a');
                        link.href = attachment.data;
                        link.download = attachment.name;
                        link.textContent = attachment.name;
                        attachmentItem.appendChild(link);
                    }

                    attachmentsDiv.appendChild(attachmentItem);
                });
                contentWrapper.appendChild(attachmentsDiv);
            }

            messageCard.appendChild(contentWrapper);

            const actions = document.createElement('div');
            actions.className = 'message-actions';

            const pinBtn = document.createElement('button');
            pinBtn.className = 'btn btn-pin';
            pinBtn.innerHTML = message.pinned ? '<i class="fa-solid fa-thumbtack"></i>' : '<i class="fa-solid fa-thumbtack-slash"></i>';
            pinBtn.addEventListener('click', async () => {
                try {
                    await fetch(`${API_URL}/${message.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pinned: !message.pinned })
                    });
                    showNotification(`Message ${message.pinned ? 'unpinned' : 'pinned'}!`, 'success');
                    fetchMessages();
                } catch (error) {
                    showNotification('Failed to pin/unpin message.', 'error');
                }
            });
            actions.appendChild(pinBtn);

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

            if (!isFuture) {
                const shareBtn = document.createElement('button');
                shareBtn.className = 'btn btn-share';
                shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
                shareBtn.addEventListener('click', () => shareMessage(message.id));
                actions.appendChild(shareBtn);
            }

            messageCard.appendChild(actions);
            container.appendChild(messageCard);
        });
    }

    function renderDrafts(drafts, container, animateNew) {
        container.innerHTML = '';
        if (drafts.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No drafts found.';
            emptyMessage.style.color = 'var(--secondary)';
            emptyMessage.style.textAlign = 'center';
            container.appendChild(emptyMessage);
            return;
        }

        drafts.forEach((draft, index) => {
            const messageCard = document.createElement('div');
            messageCard.className = 'message-card draft';
            if (draft.pinned) messageCard.classList.add('pinned');
            if (animateNew && index === 0) messageCard.classList.add('new');

            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'content-wrapper';
            contentWrapper.addEventListener('click', () => {
                contentWrapper.classList.toggle('collapsed');
            });

            const content = document.createElement('p');
            content.textContent = draft.text;
            contentWrapper.appendChild(content);

            const category = document.createElement('div');
            category.className = 'category';
            category.textContent = `Category: ${draft.category}`;
            contentWrapper.appendChild(category);

            if (draft.tags && draft.tags.length > 0) {
                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'tags';
                draft.tags.forEach(tag => {
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'tag';
                    tagSpan.textContent = tag;
                    tagsDiv.appendChild(tagSpan);
                });
                contentWrapper.appendChild(tagsDiv);
            }

            if (draft.reminder) {
                const reminderNote = document.createElement('div');
                reminderNote.className = 'reminder-note';
                reminderNote.textContent = 'Reminder Set';
                reminderNote.style.color = '#8b5cf6';
                reminderNote.style.fontSize = '0.9rem';
                contentWrapper.appendChild(reminderNote);
            }

            if (draft.attachments && draft.attachments.length > 0) {
                const attachmentsDiv = document.createElement('div');
                attachmentsDiv.className = 'attachments-display';
                draft.attachments.forEach(attachment => {
                    const attachmentItem = document.createElement('div');
                    attachmentItem.className = 'attachment-item';

                    if (attachment.data.startsWith('data:image/')) {
                        const img = document.createElement('img');
                        img.src = attachment.data;
                        img.alt = attachment.name;
                        img.addEventListener('click', () => window.open(attachment.data, '_blank'));
                        attachmentItem.appendChild(img);
                    } else {
                        const link = document.createElement('a');
                        link.href = attachment.data;
                        link.download = attachment.name;
                        link.textContent = attachment.name;
                        attachmentItem.appendChild(link);
                    }

                    attachmentsDiv.appendChild(attachmentItem);
                });
                contentWrapper.appendChild(attachmentsDiv);
            }

            messageCard.appendChild(contentWrapper);

            const actions = document.createElement('div');
            actions.className = 'message-actions';

            const pinBtn = document.createElement('button');
            pinBtn.className = 'btn btn-pin';
            pinBtn.innerHTML = draft.pinned ? '<i class="fa-solid fa-thumbtack"></i>' : '<i class="fa-solid fa-thumbtack-slash"></i>';
            pinBtn.addEventListener('click', async () => {
                try {
                    await fetch(`${API_URL}/${draft.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pinned: !draft.pinned })
                    });
                    showNotification(`Draft ${draft.pinned ? 'unpinned' : 'pinned'}!`, 'success');
                    fetchMessages();
                } catch (error) {
                    showNotification('Failed to pin/unpin draft.', 'error');
                }
            });
            actions.appendChild(pinBtn);

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-edit';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', () => editMessage(draft));
            actions.appendChild(editBtn);

            const sendBtn = document.createElement('button');
            sendBtn.className = 'btn btn-send';
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            sendBtn.addEventListener('click', () => {
                currentDraftId = draft.id;
                elements.sendDraftModal.classList.add('active');
            });
            actions.appendChild(sendBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this draft?')) {
                    try {
                        await fetch(`${API_URL}/${draft.id}`, { method: 'DELETE' });
                        showNotification('Draft deleted successfully!', 'success');
                        fetchMessages();
                    } catch (error) {
                        showNotification('Failed to delete draft.', 'error');
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
        const newTags = prompt('Edit tags (comma-separated):', message.tags ? message.tags.join(', ') : '');
        const newReminder = confirm('Set email reminder for this message?');

        // For simplicity, we'll prompt to remove attachments; a full UI would allow adding new ones
        let newAttachments = message.attachments || [];
        if (newAttachments.length > 0) {
            const removeAttachments = confirm('Do you want to remove all attachments?');
            if (removeAttachments) {
                newAttachments = [];
            }
        }

        if (newText && (newText !== message.text || newCategory !== message.category || newTags !== message.tags?.join(', ') || newReminder !== message.reminder || newAttachments.length !== message.attachments?.length)) {
            try {
                await fetch(`${API_URL}/${message.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: newText,
                        category: newCategory || message.category,
                        tags: newTags ? newTags.split(',').map(tag => tag.trim()).filter(tag => tag) : message.tags,
                        reminder: newReminder,
                        attachments: newAttachments
                    })
                });
                showNotification('Message updated successfully!', 'success');
                fetchMessages();
            } catch (error) {
                showNotification('Failed to update message.', 'error');
            }
        }
    }

    function shareMessage(messageId) {
        const shareUrl = `${SHARE_BASE_URL}${messageId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Share link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy share link.', 'error');
        });
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

    function updateStats(total, future, past, drafts, categories) {
        elements.totalMessages.textContent = total;
        elements.futureCount.textContent = future;
        elements.pastCount.textContent = past;
        elements.draftCount.textContent = drafts;
        elements.categoryCount.textContent = categories;
    }

    function updateCategoryFilter(categories) {
        const currentValue = elements.categoryFilter.value;
        elements.categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            elements.categoryFilter.appendChild(option);
        });
        elements.categoryFilter.value = categories.has(currentValue) ? currentValue : "";
    }

    function updateStatsChart(messages) {
        const months = {};
        messages.forEach(msg => {
            const date = new Date(msg.revealDate);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months[monthYear] = (months[monthYear] || 0) + 1;
        });

        const labels = Object.keys(months).sort();
        const data = labels.map(label => months[label]);

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(elements.statsChart, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Messages per Month',
                    data,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        elements.notifications.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    function exportMessages() {
        const messages = JSON.parse(localStorage.getItem('messagesBackup') || '[]');
        const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `futureme-messages-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Messages exported successfully!', 'success');
    }

    async function importMessages(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedMessages = JSON.parse(e.target.result);
                for (const msg of importedMessages) {
                    await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(msg)
                    });
                }
                showNotification('Messages imported successfully!', 'success');
                fetchMessages();
            } catch (error) {
                showNotification('Failed to import messages. Invalid file format.', 'error');
            }
        };
        reader.readAsText(file);
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