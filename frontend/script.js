document.addEventListener('DOMContentLoaded', () => {
    // --- Глобальное состояние приложения ---
    let currentFilter = 'all';
    let currentNotes = [];
    let activeNote = null;
    let autoSaveTimer = null;

    // --- Поиск DOM Элементов ---
    const gridView = document.getElementById('notes-grid-view');
    const editorView = document.getElementById('note-editor-view');
    const notesGrid = document.getElementById('notes-grid');
    const mainNav = document.getElementById('main-nav');
    const contextNav = document.getElementById('context-nav');
    const newNoteSidebarBtn = document.getElementById('new-note-sidebar-btn');
    const sidebarNav = document.querySelector('.sidebar-nav');
    const trashWarning = document.getElementById('trash-warning');

    // Элементы редактора
    const backToGridBtn = document.getElementById('back-to-grid-btn');
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    const favoriteBtn = document.getElementById('favorite-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const deleteBtn = document.getElementById('delete-btn');
    
    // Элементы модального окна
    const modalOverlay = document.getElementById('modal-overlay');
    const newNoteTitleInput = document.getElementById('new-note-title-input');
    const modalErrorMsg = document.getElementById('modal-error-msg');
    const confirmCreateBtn = document.getElementById('confirm-create-btn');
    const cancelCreateBtn = document.getElementById('cancel-create-btn');

    const API_URL = 'http://localhost:5001/api/notes';

    // --- Функции для работы с API (Backend) ---
    const api = {
        async getNotes(filter = 'all') {
            const response = await fetch(`${API_URL}?filter=${filter}`);
            if (!response.ok) throw new Error('Ошибка сети при загрузке заметок');
            currentNotes = await response.json();
            return currentNotes;
        },
        async getNote(id) {
            const response = await fetch(`${API_URL}/${id}`);
            if (!response.ok) throw new Error('Ошибка сети при загрузке заметки');
            return response.json();
        },
        async createNote(title) {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
             if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }
            return response.json();
        },
        async updateNote(id, noteData) {
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            });
        },
        async deleteNote(id) {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        }
    };

    // --- Функции для управления модальным окном ---
    function openCreateModal() {
        newNoteTitleInput.value = '';
        modalErrorMsg.textContent = '';
        modalOverlay.classList.remove('hidden');
        newNoteTitleInput.focus();
    }

    function closeCreateModal() {
        modalOverlay.classList.add('hidden');
    }

    // --- Функции отображения (UI) ---
    function renderContextNav(allNotesInFilter, currentNoteId) {
        contextNav.innerHTML = '';

        let title = 'Недавние заметки';
        if (currentFilter === 'favorites') { title = 'Избранные заметки'; }
        if (currentFilter === 'trash') { title = 'В корзине'; }

        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        contextNav.appendChild(titleEl);

        const otherNotes = allNotesInFilter.filter(note => note.id !== currentNoteId);
        const notesToShow = otherNotes.slice(0, 5);

        if (notesToShow.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = 'Других заметок нет.';
            emptyMsg.style.padding = '12px';
            emptyMsg.style.color = 'var(--text-secondary)';
            contextNav.appendChild(emptyMsg);
            return;
        }

        notesToShow.forEach(note => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'context-note-link';
            link.textContent = note.title || 'Без заголовка';
            link.dataset.id = note.id;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                handleOpenNote(note.id);
            });
            contextNav.appendChild(link);
        });
    }

    function renderGridView(notes) {
        notesGrid.innerHTML = '';
        
        if (currentFilter !== 'trash') {
            const newNoteCard = document.createElement('div');
            newNoteCard.className = 'new-note-card';
            newNoteCard.innerHTML = '<span>+</span>';
            newNoteCard.addEventListener('click', openCreateModal);
            notesGrid.appendChild(newNoteCard);
        }

        if (notes && notes.length > 0) {
            notes.forEach(note => {
                const card = document.createElement('div');
                card.className = 'note-card';
                card.dataset.id = note.id;
                card.innerHTML = `
                    <div class="note-card-title">${note.title || 'Без заголовка'}</div>
                    <div class="note-card-content">${note.content || 'Нет содержимого'}</div>
                `;
                card.addEventListener('click', () => handleOpenNote(note.id));
                notesGrid.appendChild(card);
            });
        } else if (currentFilter === 'trash') {
            notesGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1 / -1;">Корзина пуста.</p>';
        }
    }

    async function loadAndRenderNotes() {
        try {
            const notes = await api.getNotes(currentFilter);
            trashWarning.classList.toggle('hidden', currentFilter !== 'trash' || notes.length === 0);
            renderGridView(notes);
            switchToView('grid');
        } catch (error) {
            console.error('Ошибка загрузки заметок:', error);
            notesGrid.innerHTML = '<p style="color: #ff6b6b;">Не удалось загрузить заметки. Проверьте, запущен ли бэкенд.</p>';
        }
    }

    function switchToView(viewName) {
        if (viewName === 'editor') {
            gridView.classList.add('hidden');
            editorView.classList.remove('hidden');
            mainNav.classList.add('hidden');
            contextNav.classList.remove('hidden');
        } else {
            editorView.classList.add('hidden');
            gridView.classList.remove('hidden');
            contextNav.classList.add('hidden');
            mainNav.classList.remove('hidden');
        }
    }

    // --- Обработчики событий ---
    async function handleOpenNote(noteId) {
        try {
            activeNote = await api.getNote(noteId);
            titleInput.value = activeNote.title;
            contentInput.value = activeNote.content;
            
            favoriteBtn.textContent = activeNote.is_favorite ? '★' : '☆';
            favoriteBtn.classList.toggle('is-favorite', activeNote.is_favorite);

            const inTrash = activeNote.is_deleted;
            favoriteBtn.classList.toggle('hidden', inTrash);
            restoreBtn.classList.toggle('hidden', !inTrash);
            deleteBtn.title = inTrash ? 'Удалить навсегда' : 'Переместить в корзину';
            
            renderContextNav(currentNotes, activeNote.id);
            switchToView('editor');
        } catch (error) {
            console.error('Ошибка открытия заметки:', error);
        }
    }

    async function handleConfirmCreation() {
        const title = newNoteTitleInput.value.trim();
        if (!title) {
            modalErrorMsg.textContent = 'Название не может быть пустым.'; return;
        }
        if (currentNotes.some(note => note.title === title)) {
            modalErrorMsg.textContent = 'Заметка с таким названием уже существует.'; return;
        }
        modalErrorMsg.textContent = '';
        try {
            const newNote = await api.createNote(title);
            closeCreateModal();
            await api.getNotes(currentFilter);
            handleOpenNote(newNote.id);
        } catch (error) {
            modalErrorMsg.textContent = error.message;
            console.error('Ошибка создания заметки:', error);
        }
    }

    function handleFilterChange(event) {
        event.preventDefault();
        const target = event.target.closest('.nav-link');
        if (!target) return;
        
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        target.classList.add('active');

        currentFilter = target.dataset.filter;
        loadAndRenderNotes();
    }
    
    function handleAutoSave() {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            if (!activeNote || activeNote.is_deleted) return;
            activeNote.title = titleInput.value;
            activeNote.content = contentInput.value;
            api.updateNote(activeNote.id, activeNote);
        }, 1000);
    }

    async function handleToggleFavorite() {
        if (!activeNote) return;
        // 1. Меняем состояние в объекте
        activeNote.is_favorite = !activeNote.is_favorite;
        // 2. Обновляем внешний вид кнопки (иконку и цвет через класс)
        favoriteBtn.textContent = activeNote.is_favorite ? '★' : '☆';
        favoriteBtn.classList.toggle('is-favorite', activeNote.is_favorite);
        // 3. Отправляем изменения на сервер
        await api.updateNote(activeNote.id, activeNote);
    }
    
    async function handleDeleteNote() {
        if (!activeNote) return;
        const inTrash = activeNote.is_deleted;

        if (inTrash) {
            if (confirm('Вы уверены, что хотите удалить эту заметку навсегда? Это действие нельзя отменить.')) {
                await api.deleteNote(activeNote.id);
                loadAndRenderNotes();
            }
        } else {
            activeNote.is_deleted = true;
            await api.updateNote(activeNote.id, activeNote);
            loadAndRenderNotes();
        }
    }

    async function handleRestoreNote() {
        if (!activeNote) return;
        activeNote.is_deleted = false;
        await api.updateNote(activeNote.id, activeNote);
        loadAndRenderNotes();
    }

    // --- Инициализация и привязка обработчиков ---
    sidebarNav.addEventListener('click', handleFilterChange);
    backToGridBtn.addEventListener('click', loadAndRenderNotes);
    newNoteSidebarBtn.addEventListener('click', openCreateModal);
    confirmCreateBtn.addEventListener('click', handleConfirmCreation);
    cancelCreateBtn.addEventListener('click', closeCreateModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) { closeCreateModal(); }
    });
    
    titleInput.addEventListener('input', handleAutoSave);
    contentInput.addEventListener('input', handleAutoSave);
    favoriteBtn.addEventListener('click', handleToggleFavorite);
    deleteBtn.addEventListener('click', handleDeleteNote);
    restoreBtn.addEventListener('click', handleRestoreNote);

    loadAndRenderNotes();
});