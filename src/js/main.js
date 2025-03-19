// Recipe Management
class RecipeManager {
    constructor() {
        try {
            this.recipes = JSON.parse(localStorage.getItem('recipes')) || [];
            this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            this.categories = JSON.parse(localStorage.getItem('categories')) || [
                'מנות-עיקריות',
                'קינוחים',
                'מרקים',
                'סלטים',
                'תוספות'
            ];
            this.isDarkMode = localStorage.getItem('darkMode') === 'true';
            this.currentEditingId = null;
            this.setupEventListeners();
            this.initializeDarkMode();
            this.renderRecipes();
            this.updateCategorySelects();
            this.setupRecipeDragAndDrop();
        } catch (error) {
            console.error('Error initializing RecipeManager:', error);
            this.recipes = [];
            this.favorites = [];
            this.categories = ['מנות-עיקריות', 'קינוחים', 'מרקים', 'סלטים', 'תוספות'];
            this.isDarkMode = false;
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('addRecipeBtn').addEventListener('click', () => {
            this.closeMobileMenu();
            this.showEditModal();
        });
        document.getElementById('importAllBtn').addEventListener('click', () => {
            this.closeMobileMenu();
            this.handleImportAll();
        });
        document.getElementById('exportAllBtn').addEventListener('click', () => {
            this.closeMobileMenu();
            this.handleExportAll();
        });
        document.getElementById('deleteAllBtn').addEventListener('click', () => {
            this.closeMobileMenu();
            this.deleteAllRecipes();
        });
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.closeMobileMenu();
            this.toggleDarkMode();
        });
        document.getElementById('mobileMenuBtn').addEventListener('click', () => this.toggleMobileMenu());
        document.getElementById('aboutBtn').addEventListener('click', () => {
            this.closeMobileMenu();
            this.showAboutModal();
        });

        // Setup drag and drop
        this.setupDragAndDrop();

        // Tests button (dev mode only)
        const runTestsBtn = document.getElementById('runTestsBtn');
        if (runTestsBtn) {
            runTestsBtn.addEventListener('click', () => {
                console.clear();
                const tests = new RecipeManagerTests();
                tests.runAllTests();
            });
        }

        // Search and filter
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.handleSearch(e));
        document.getElementById('favoritesFilterBtn').addEventListener('click', () => this.toggleFavoritesFilter());

        // Modals
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Recipe form
        document.getElementById('recipeForm').addEventListener('submit', (e) => this.handleRecipeSubmit(e));

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const navLinks = document.querySelector('.nav-links');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            if (navLinks.classList.contains('active') && 
                !navLinks.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Add manage categories button event
        document.getElementById('manageCategoriesBtn').addEventListener('click', () => this.showCategoryModal());

        // Recipe type toggle
        const toggleButtons = document.querySelectorAll('.recipe-type-toggle .btn');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                toggleButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const type = btn.dataset.type;
                const linkGroup = document.getElementById('recipeLinkGroup');
                const ingredientsGroup = document.querySelector('#recipeIngredients').parentElement;
                const instructionsGroup = document.querySelector('#recipeInstructions').parentElement;
                
                if (type === 'link') {
                    linkGroup.style.display = 'block';
                    ingredientsGroup.style.display = 'none';
                    instructionsGroup.style.display = 'none';
                    
                    // Remove required from ingredients and instructions
                    document.getElementById('recipeIngredients').removeAttribute('required');
                    document.getElementById('recipeInstructions').removeAttribute('required');
                } else {
                    linkGroup.style.display = 'none';
                    ingredientsGroup.style.display = 'block';
                    instructionsGroup.style.display = 'block';
                    
                    // Add required back
                    document.getElementById('recipeIngredients').setAttribute('required', '');
                    document.getElementById('recipeInstructions').setAttribute('required', '');
                }
            });
        });
    }

    // Dark Mode
    initializeDarkMode() {
        if (this.isDarkMode) {
            document.body.setAttribute('data-theme', 'dark');
            document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.body.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        document.getElementById('darkModeToggle').innerHTML = this.isDarkMode ? 
            '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', this.isDarkMode);
    }

    // Mobile Menu
    toggleMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const isOpen = navLinks.classList.contains('active');
        
        if (isOpen) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            document.body.style.overflow = '';
        } else {
            navLinks.classList.add('active');
            mobileMenuBtn.classList.add('active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
            document.body.style.overflow = 'hidden';
        }
    }

    // Add method to close mobile menu
    closeMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        navLinks.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
    }

    // Recipe CRUD Operations
    addRecipe(recipe) {
        recipe.id = Date.now().toString();
        this.recipes.push(recipe);
        this.saveRecipes();
        this.renderRecipes();
    }

    updateRecipe(recipe) {
        const index = this.recipes.findIndex(r => r.id === recipe.id);
        if (index !== -1) {
            this.recipes[index] = recipe;
            this.saveRecipes();
            this.renderRecipes();
        }
    }

    deleteRecipe(id) {
        if (confirm('האם אתה בטוח שברצונך למחוק מתכון זה?')) {
            this.recipes = this.recipes.filter(recipe => recipe.id !== id);
            this.favorites = this.favorites.filter(favId => favId !== id);
            this.saveRecipes();
            this.renderRecipes();
        }
    }

    toggleFavorite(id) {
        const index = this.favorites.indexOf(id);
        if (index === -1) {
            this.favorites.push(id);
        } else {
            this.favorites.splice(index, 1);
        }
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.renderRecipes();
    }

    // Storage Operations
    saveRecipes() {
        localStorage.setItem('recipes', JSON.stringify(this.recipes));
    }

    // Modal Operations
    showEditModal(recipe = null) {
        const modal = document.getElementById('editRecipeModal');
        const form = document.getElementById('recipeForm');
        
        if (recipe) {
            this.currentEditingId = recipe.id;
            form.recipeName.value = recipe.name;
            form.recipeCategory.value = recipe.category;
            if (recipe.externalLink) {
                form.recipeLink.value = recipe.externalLink;
                form.recipeIngredients.parentElement.style.display = 'none';
                form.recipeInstructions.parentElement.style.display = 'none';
                form.recipeLink.parentElement.style.display = 'block';
            } else {
                form.recipeIngredients.value = recipe.ingredients.join('\n');
                form.recipeInstructions.value = recipe.instructions.join('\n');
                form.recipeIngredients.parentElement.style.display = 'block';
                form.recipeInstructions.parentElement.style.display = 'block';
                form.recipeLink.parentElement.style.display = 'none';
            }
        } else {
            this.currentEditingId = null;
            form.reset();
            form.recipeIngredients.parentElement.style.display = 'block';
            form.recipeInstructions.parentElement.style.display = 'block';
            form.recipeLink.parentElement.style.display = 'none';
        }

        modal.classList.add('active');
    }

    showAboutModal() {
        const modal = document.getElementById('aboutModal');
        modal.classList.add('active');
    }

    // Add method to format recipe as text
    formatRecipeAsText(recipe) {
        return `${recipe.name}
קטגוריה: ${recipe.category}

מרכיבים:
${recipe.ingredients.map(i => `• ${i}`).join('\n')}

הוראות הכנה:
${recipe.instructions.map((i, index) => `${index + 1}. ${i}`).join('\n')}`;
    }

    // Add method to copy text and show notification
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            const notification = document.createElement('div');
            notification.className = 'copy-success';
            notification.textContent = 'המתכון הועתק בהצלחה!';
            document.body.appendChild(notification);
            
            // Remove notification after animation
            setTimeout(() => {
                notification.remove();
            }, 2000);
        } catch (err) {
            alert('לא הצלחנו להעתיק את המתכון. נסה שוב.');
        }
    }

    showViewModal(recipe) {
        const modal = document.getElementById('recipeModal');
        const content = document.getElementById('recipeModalContent');
        
        content.innerHTML = `
            <div class="recipe-view">
                <h2>${recipe.name}</h2>
                <p class="category">${recipe.category}</p>
                <div class="recipe-actions">
                    <button class="btn edit-recipe-btn">
                        <i class="fas fa-edit"></i> ערוך
                    </button>
                    <button class="btn favorite-modal-btn">
                        <i class="fas ${this.favorites.includes(recipe.id) ? 'fa-heart' : 'far fa-heart'}"></i>
                        ${this.favorites.includes(recipe.id) ? 'הסר ממועדפים' : 'הוסף למועדפים'}
                    </button>
                    ${recipe.externalLink ? `
                        <a href="${recipe.externalLink}" target="_blank" class="btn">
                            <i class="fas fa-external-link-alt"></i> צפה במתכון המקורי
                        </a>
                    ` : `
                        <button class="btn export-recipe-btn">
                            <i class="fas fa-file-export"></i> ייצא מתכון
                        </button>
                        <button class="btn copy-recipe-btn">
                            <i class="fas fa-copy"></i> העתק מתכון
                        </button>
                    `}
                    <button class="btn danger-btn delete-modal-btn">
                        <i class="fas fa-trash"></i> מחק
                    </button>
                </div>
                ${recipe.externalLink ? '' : `
                    <h3>מרכיבים:</h3>
                    <ul>
                        ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                    <h3>הוראות הכנה:</h3>
                    <ol>
                        ${recipe.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ol>
                `}
            </div>
        `;

        // Add event listeners to modal buttons
        const modalContent = modal.querySelector('.recipe-view');
        
        modalContent.querySelector('.edit-recipe-btn').addEventListener('click', () => {
            this.showEditModal(recipe);
        });

        modalContent.querySelector('.favorite-modal-btn').addEventListener('click', () => {
            this.toggleFavorite(recipe.id);
            this.showViewModal(recipe); // Refresh the modal to update the favorite button text
        });

        modalContent.querySelector('.export-recipe-btn').addEventListener('click', () => {
            this.exportRecipe(recipe.id);
        });

        modalContent.querySelector('.copy-recipe-btn').addEventListener('click', () => {
            const text = this.formatRecipeAsText(recipe);
            this.copyToClipboard(text);
        });

        modalContent.querySelector('.delete-modal-btn').addEventListener('click', () => {
            this.deleteRecipe(recipe.id);
            this.closeModals();
        });

        modal.classList.add('active');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.currentEditingId = null;
    }

    // Form Handling
    handleRecipeSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        // Validate inputs
        const name = form.recipeName.value.trim();
        const category = form.recipeCategory.value;
        const externalLink = form.recipeLink.value.trim();
        
        if (name.length < 2) {
            alert('שם המתכון חייב להכיל לפחות 2 תווים');
            return;
        }

        let recipe = {
            name,
            category
        };

        if (externalLink) {
            if (!externalLink.startsWith('http://') && !externalLink.startsWith('https://')) {
                alert('נא להזין קישור תקין המתחיל ב-http:// או https://');
                return;
            }
            recipe.externalLink = externalLink;
        } else {
            const ingredients = form.recipeIngredients.value.split('\n').filter(line => line.trim());
            const instructions = form.recipeInstructions.value.split('\n').filter(line => line.trim());

            if (ingredients.length === 0) {
                alert('יש להזין לפחות מרכיב אחד');
                return;
            }

            if (instructions.length === 0) {
                alert('יש להזין לפחות הוראת הכנה אחת');
                return;
            }

            recipe.ingredients = ingredients;
            recipe.instructions = instructions;
        }

        if (this.currentEditingId) {
            recipe.id = this.currentEditingId;
            this.updateRecipe(recipe);
        } else {
            this.addRecipe(recipe);
        }

        this.closeModals();
    }

    // Search and Filter
    handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        this.renderRecipes(searchTerm, category);
    }

    toggleFavoritesFilter() {
        const btn = document.getElementById('favoritesFilterBtn');
        btn.classList.toggle('active');
        this.handleSearch();
    }

    // Import/Export
    exportRecipe(id) {
        const recipe = this.recipes.find(r => r.id === id);
        if (recipe) {
            const blob = new Blob([JSON.stringify(recipe)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${recipe.name.replace(/\s+/g, '_')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    handleExportAll() {
        const blob = new Blob([JSON.stringify(this.recipes)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my_recipes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async handleImportAll() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            this.showLoading();
            
            reader.onload = async (event) => {
                try {
                    const recipes = JSON.parse(event.target.result);
                    if (Array.isArray(recipes)) {
                        this.recipes = recipes;
                    } else {
                        this.recipes.push(recipes);
                    }
                    this.saveRecipes();
                    this.renderRecipes();
                    alert('המתכונים יובאו בהצלחה!');
                } catch (error) {
                    alert('שגיאה בייבוא הקובץ. אנא ודא שהקובץ תקין.');
                } finally {
                    this.hideLoading();
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    showLoading() {
        const loading = document.createElement('div');
        loading.className = 'loading';
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }

    deleteAllRecipes() {
        if (confirm('האם אתה בטוח שברצונך למחוק את כל המתכונים? פעולה זו לא ניתנת לביטול!')) {
            this.recipes = [];
            this.favorites = [];
            this.saveRecipes();
            localStorage.setItem('favorites', JSON.stringify([]));
            this.renderRecipes();
        }
    }
    clearAllRecipes() {
        this.recipes = []; // מוחק את כל המתכונים מהמערך
        this.favorites = []; // מוחק גם את המועדפים
        localStorage.removeItem('recipes'); // מוחק מהאחסון המקומי
        localStorage.removeItem('favorites'); // מוחק גם את רשימת המועדפים
        this.saveRecipes(); // שומר מצב ריק
        this.renderRecipes(); // מרענן את התצוגה
        console.log("📢 כל המתכונים נמחקו בהצלחה.");
    }
    // Rendering
    renderRecipes(searchTerm = '', category = '') {
        const grid = document.getElementById('recipesGrid');
        const showFavorites = document.getElementById('favoritesFilterBtn').classList.contains('active');
        
        let filteredRecipes = this.recipes;

        if (showFavorites) {
            filteredRecipes = filteredRecipes.filter(recipe => this.favorites.includes(recipe.id));
        }

        if (searchTerm) {
            filteredRecipes = filteredRecipes.filter(recipe => 
                recipe.name.toLowerCase().includes(searchTerm) ||
                (recipe.ingredients && recipe.ingredients.some(i => i.toLowerCase().includes(searchTerm)))
            );
        }

        if (category) {
            filteredRecipes = filteredRecipes.filter(recipe => recipe.category === category);
        }

        grid.innerHTML = filteredRecipes.map(recipe => `
            <div class="recipe-card ${recipe.externalLink ? 'external-link' : ''}" 
                data-recipe-id="${recipe.id}"
                draggable="true">
                <h3>${recipe.name}</h3>
                <p>${recipe.category}</p>
                <div class="recipe-card-actions">
                    ${recipe.externalLink ? `
                        <a href="${recipe.externalLink}" target="_blank" class="btn">
                            <i class="fas fa-external-link-alt"></i> צפה במתכון
                        </a>
                        <button class="btn edit-recipe-btn">
                            <i class="fas fa-edit"></i> ערוך
                        </button>
                    ` : `
                        <button class="btn view-recipe-btn">
                            <i class="fas fa-eye"></i> צפה במתכון
                        </button>
                    `}
                    <button class="btn favorite-btn">
                        <i class="fas ${this.favorites.includes(recipe.id) ? 'fa-heart' : 'far fa-heart'}"></i>
                    </button>
                    <button class="btn danger-btn delete-recipe-btn">
                        <i class="fas fa-trash"></i> הסר מתכון
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to the newly created elements
        grid.querySelectorAll('.recipe-card').forEach(card => {
            const recipeId = card.dataset.recipeId;
            const recipe = this.recipes.find(r => r.id === recipeId);
            
            if (!recipe) return;

            // View recipe (only for non-external recipes)
            const viewBtn = card.querySelector('.view-recipe-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', () => {
                    this.showViewModal(recipe);
                });
            }

            // Edit recipe (for external link recipes)
            const editBtn = card.querySelector('.edit-recipe-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showEditModal(recipe);
                });
            }

            // Toggle favorite
            card.querySelector('.favorite-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(recipeId);
            });

            // Delete recipe
            card.querySelector('.delete-recipe-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteRecipe(recipeId);
            });

            // For external links, add click handler to the entire card
            if (recipe.externalLink) {
                card.addEventListener('click', (e) => {
                    // Only handle click if it's not on a button
                    if (!e.target.closest('.btn')) {
                        window.open(recipe.externalLink, '_blank');
                    }
                });
            }
        });
    }

    // Categories Management
    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
        this.updateCategorySelects();
    }

    updateCategorySelects() {
        // Update all category select elements
        const categorySelects = document.querySelectorAll('.category-select, #recipeCategory');
        categorySelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = `
                ${select.classList.contains('category-select') ? '<option value="">כל הקטגוריות</option>' : ''}
                ${this.categories.map(category => `
                    <option value="${category}" ${currentValue === category ? 'selected' : ''}>
                        ${category.replace(/-/g, ' ')}
                    </option>
                `).join('')}
            `;
        });
    }

    showCategoryModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h2>ניהול קטגוריות</h2>
                <div class="categories-list">
                    ${this.categories.map(category => `
                        <div class="category-item">
                            <span>${category.replace(/-/g, ' ')}</span>
                            <button class="btn danger-btn delete-category" data-category="${category}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="add-category-form">
                    <input type="text" id="newCategoryInput" placeholder="שם הקטגוריה החדשה" class="search-input">
                    <button class="btn primary-btn" id="addCategoryBtn">
                        <i class="fas fa-plus"></i> הוסף קטגוריה
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('active');

        // Event Listeners
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Delete category
        modal.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                if (this.recipes.some(r => r.category === category)) {
                    alert('לא ניתן למחוק קטגוריה שיש בה מתכונים. העבר או מחק קודם את המתכונים מקטגוריה זו.');
                    return;
                }
                if (confirm('האם אתה בטוח שברצונך למחוק קטגוריה זו?')) {
                    this.categories = this.categories.filter(c => c !== category);
                    this.saveCategories();
                    this.showCategoryModal(); // Refresh modal
                }
            });
        });

        // Add category
        const addBtn = modal.querySelector('#addCategoryBtn');
        const input = modal.querySelector('#newCategoryInput');
        
        addBtn.addEventListener('click', () => {
            const newCategory = input.value.trim().replace(/\s+/g, '-');
            if (newCategory && !this.categories.includes(newCategory)) {
                this.categories.push(newCategory);
                this.saveCategories();
                this.showCategoryModal(); // Refresh modal
            } else if (this.categories.includes(newCategory)) {
                alert('קטגוריה זו כבר קיימת');
            }
        });
    }

    // Add new method for drag and drop setup
    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        
        // Show drop zone when dragging files over the window
        window.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dropZone.classList.add('visible');
        });

        // Handle drag over drop zone
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        // Handle drag leave
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        // Handle drop
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            dropZone.classList.remove('visible');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    this.showLoading();
                    try {
                        const text = await file.text();
                        const recipes = JSON.parse(text);
                        if (Array.isArray(recipes)) {
                            this.recipes = [...this.recipes, ...recipes];
                        } else {
                            this.recipes.push(recipes);
                        }
                        this.saveRecipes();
                        this.renderRecipes();
                        alert('המתכונים יובאו בהצלחה!');
                    } catch (error) {
                        alert('שגיאה בייבוא הקובץ. אנא ודא שהקובץ תקין.');
                        console.error('Error importing recipes:', error);
                    } finally {
                        this.hideLoading();
                    }
                } else {
                    alert('אנא גרור קובץ JSON בלבד.');
                }
            }
        });

        // Hide drop zone when dragging leaves the window
        window.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (e.clientX === 0 || e.clientY === 0) {
                dropZone.classList.remove('visible');
                dropZone.classList.remove('drag-over');
            }
        });
    }

    setupRecipeDragAndDrop() {
        const grid = document.getElementById('recipesGrid');
        let draggedItem = null;

        grid.addEventListener('dragstart', (e) => {
            draggedItem = e.target.closest('.recipe-card');
            e.dataTransfer.effectAllowed = 'move';
            draggedItem.classList.add('dragging');
        });

        grid.addEventListener('dragend', () => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');
                draggedItem = null;
            }
        });

        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            const card = e.target.closest('.recipe-card');
            if (!card || card === draggedItem) return;

            const rect = card.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            const insertAfter = e.clientY > midY;

            if (insertAfter) {
                card.after(draggedItem);
            } else {
                card.before(draggedItem);
            }

            // Update recipes array order
            const newOrder = Array.from(grid.children).map(card => 
                this.recipes.find(r => r.id === card.dataset.recipeId)
            );
            this.recipes = newOrder;
            this.saveRecipes();
        });
    }
}

// Initialize the app
const recipeManager = new RecipeManager();
