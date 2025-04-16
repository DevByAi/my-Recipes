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
            
            // Dark mode initialization
            const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
            const savedTheme = localStorage.getItem('theme');
            this.isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches);
            
            this.currentEditingId = null;
            this.showingFavorites = false;
            
            // Initialize other features
            this.initializeDarkMode();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.renderRecipes();
            this.updateCategorySelects();
            this.setupRecipeDragAndDrop();

            // בדיקה אם כבר הוצגה ההודעה על העדכון
            const updateNotificationShown = localStorage.getItem('updateNotificationShown');
            if (!updateNotificationShown) {
                this.showUpdateNotification();
            }

            // Import/Export Instructions Modal
            this.importExportInstructionsModal = document.getElementById('importExportInstructionsModal');
            this.dontShowAgainBtn = document.getElementById('dontShowAgainBtn');
            this.closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
            this.closeInstructionsXBtn = this.importExportInstructionsModal.querySelector('.close-btn');
            
            // Set up event listeners for import/export instructions
            this.setupImportExportInstructionsListeners();

            // Dark mode toggle
            const darkModeToggle = document.getElementById('darkModeToggle');
            
            function updateDarkModeButton(isDark) {
                const icon = darkModeToggle.querySelector('i');
                const text = darkModeToggle.querySelector('span');
                if (isDark) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                    text.textContent = 'מצב בהיר';
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                    text.textContent = 'מצב חשוך';
                }
            }

            // Check if user has a theme preference in localStorage
            const currentTheme = localStorage.getItem('theme');
            if (currentTheme) {
                document.documentElement.setAttribute('data-theme', currentTheme);
                updateDarkModeButton(currentTheme === 'dark');
            } else if (prefersDarkScheme.matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
                updateDarkModeButton(true);
            }

            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
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
            this.showImportExportInstructions();
            this.handleImportAll();
        });
        document.getElementById('exportAllBtn').addEventListener('click', () => {
            this.closeMobileMenu();
            this.showImportExportInstructions();
            this.handleExportAll();
        });
        document.getElementById('deleteAllBtn').addEventListener('click', () => {
            this.closeMobileMenu();
            this.deleteAllRecipes();
        });
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });
        document.getElementById('aboutBtn').addEventListener('click', () => {
            this.closeMobileMenu();
            this.showAboutModal();
        });

        // Mobile menu button
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMobileMenu();
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const navLinks = document.querySelector('.nav-links');
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            if (navLinks && navLinks.classList.contains('active') && 
                !navLinks.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close mobile menu when window is resized
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
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
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) return;

        // Set initial state
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');

        // Update button state
        const icon = darkModeToggle.querySelector('i') || document.createElement('i');
        const text = darkModeToggle.querySelector('span') || document.createElement('span');
        
        icon.className = `fas ${this.isDarkMode ? 'fa-sun' : 'fa-moon'}`;
        text.textContent = this.isDarkMode ? 'מצב בהיר' : 'מצב חשוך';
        
        if (!darkModeToggle.contains(icon)) darkModeToggle.appendChild(icon);
        if (!darkModeToggle.contains(text)) darkModeToggle.appendChild(text);

        // Add event listener
        darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        // Listen for system theme changes
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        prefersDarkScheme.addListener((e) => {
            if (!localStorage.getItem('theme')) {
                this.isDarkMode = e.matches;
                this.updateDarkModeState();
            }
        });
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        this.updateDarkModeState();
    }

    updateDarkModeState() {
        // Update DOM
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
        
        // Update button
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) return;

        const icon = darkModeToggle.querySelector('i');
        const text = darkModeToggle.querySelector('span');
        
        if (icon && text) {
            icon.className = `fas ${this.isDarkMode ? 'fa-sun' : 'fa-moon'}`;
            text.textContent = this.isDarkMode ? 'מצב בהיר' : 'מצב חשוך';
        }
    }

    // Mobile Menu
    toggleMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const isOpen = navLinks.classList.contains('active');
        
        if (isOpen) {
            navLinks.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            document.body.style.overflow = '';
        } else {
            navLinks.classList.add('active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
            document.body.style.overflow = 'hidden';
        }
    }

    // Add method to close mobile menu
    closeMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        navLinks.classList.remove('active');
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
    }

    // Recipe CRUD Operations
    addRecipe(recipe) {
        recipe.id = Date.now().toString();
        recipe.ingredients = recipe.ingredients || [];
        recipe.instructions = recipe.instructions || [];
        this.recipes.push(recipe);
        this.saveRecipes();
        this.renderRecipes();
    }

    updateRecipe(recipe) {
        const index = this.recipes.findIndex(r => r.id === recipe.id);
        if (index !== -1) {
            recipe.ingredients = recipe.ingredients || [];
            recipe.instructions = recipe.instructions || [];
            this.recipes[index] = recipe;
            this.saveRecipes();
            this.renderRecipes();
        }
    }

    deleteRecipe(id) {
        this.recipes = this.recipes.filter(recipe => recipe.id !== id);
        this.favorites = this.favorites.filter(favId => favId !== id);
        this.saveRecipes();
        this.renderRecipes();
    }

    toggleFavorite(id) {
        const index = this.favorites.indexOf(id);
        const recipe = this.recipes.find(r => r.id === id);
        if (!recipe) return;

        if (index === -1) {
            this.favorites.push(id);
            this.showFavoriteNotification(recipe.name, true);
        } else {
            this.favorites.splice(index, 1);
            this.showFavoriteNotification(recipe.name, false);
        }
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.renderRecipes();
    }

    showFavoriteNotification(recipeName, isAdding) {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.favorite-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `favorite-notification ${isAdding ? '' : 'remove'}`;
        notification.innerHTML = `
            <i class="fas ${isAdding ? 'fa-heart' : 'fa-heart-broken'}"></i>
            <span>${recipeName} ${isAdding ? 'נוסף למועדפים' : 'הוסר מהמועדפים'}</span>
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Remove after animation
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    // Storage Operations
    saveRecipes() {
        localStorage.setItem('recipes', JSON.stringify(this.recipes));
    }

    // Modal Operations
    showEditModal(recipe = null) {
        const modal = document.getElementById('editRecipeModal');
        const form = document.getElementById('recipeForm');
        
        // Always update category selects to ensure they're populated
        this.updateCategorySelects();
        
        if (recipe) {
            this.currentEditingId = recipe.id;
            form.recipeName.value = recipe.name;
            form.recipeCategory.value = recipe.category;
            form.prepTime.value = recipe.prepTime || '';
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
        let text = `${recipe.name}\n`;
        text += `=================\n\n`;
        text += `קטגוריה: ${recipe.category}\n`;
        text += `זמן הכנה: ${recipe.prepTime || 'לא צוין'} דקות\n`;
        
        if (recipe.storageInstructions) {
            text += `\nהמלצות שמירה:\n${recipe.storageInstructions}\n`;
        }

        if (recipe.externalLink) {
            text += `\nקישור למתכון:\n${recipe.externalLink}\n`;
        } else {
            text += `\nמרכיבים:\n`;
            text += recipe.ingredients.map(i => `• ${i}`).join('\n');
            
            text += `\n\nהוראות הכנה:\n`;
            text += recipe.instructions.map((i, index) => `${index + 1}. ${i}`).join('\n');
        }

        return text;
    }

    // Add method to generate filename for recipe
    generateRecipeFilename(recipe) {
        // Check if recipe name contains Hebrew characters
        const hasHebrew = /[\u0590-\u05FF]/.test(recipe.name);
        
        if (hasHebrew) {
            return 'מתכון.json';
        } else {
            // Clean the filename - replace invalid characters with hyphens
            const cleanName = recipe.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
            
            return `${cleanName}.json`;
        }
    }

    // Add method to share recipe as JSON
    async shareRecipeAsJSON(recipe) {
        try {
            // נקה ותקן את הערכים
            const cleanRecipe = {
                name: recipe.name.trim(),
                category: recipe.category.trim(),
                prepTime: recipe.prepTime ? recipe.prepTime.toString().trim() : "לא צוין",
                storageInstructions: recipe.storageInstructions ? recipe.storageInstructions.trim() : "",
                ingredients: recipe.ingredients.map(i => i.trim()).filter(i => i),
                instructions: recipe.instructions.map(i => i.trim()).filter(i => i),
                externalLink: recipe.externalLink ? recipe.externalLink.trim() : null,
                exportDate: new Date().toISOString(),
                version: '1.0',
                textDirection: 'rtl'
            };
            
            const jsonStr = JSON.stringify(cleanRecipe, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const filename = this.generateRecipeFilename(recipe);
            
            // Check if browser supports sharing files
            if (navigator.share && navigator.canShare) {
                const file = new File([blob], filename, { type: 'application/json' });
                const shareData = {
                    title: cleanRecipe.name,
                    text: `הנה המתכון ל${cleanRecipe.name} ששתפתי מהאתר שלי. תוכל להוסיף אותו לספר המתכונים שלך!`,
                    files: [file]
                };
                
                if (navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    return;
                }
            }
            
            // Fallback to download if sharing is not supported
            this.downloadFile(blob, filename);
        } catch (error) {
            console.error('Error sharing recipe:', error);
            alert('אירעה שגיאה בשיתוף המתכון. אנא נסה שוב.');
        }
    }

    // Add method to copy text and show notification
    copyToClipboard(text) {
        try {
            // יצירת אלמנט textarea זמני
            const textArea = document.createElement('textarea');
            const websiteLink = "קישור לאתר המתכונים: https://devbyai.github.io/my-Recipes/";
            textArea.value = `${text}\n\n${websiteLink}`;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            
            // בחירת הטקסט והעתקה
            textArea.select();
            document.execCommand('copy');
            
            // הסרת האלמנט הזמני
            document.body.removeChild(textArea);
            
            // הצגת הודעת הצלחה
            const notification = document.createElement('div');
            notification.className = 'copy-success';
            notification.textContent = 'המתכון הועתק בהצלחה!';
            document.body.appendChild(notification);
            
            // הסרת ההודעה אחרי האנימציה
            setTimeout(() => {
                notification.remove();
            }, 2000);
        } catch (err) {
            console.error('Error copying text:', err);
            alert('לא הצלחנו להעתיק את המתכון. נסה שוב.');
        }
    }

    showViewModal(recipe) {
        const modal = document.getElementById('recipeModal');
        const content = document.getElementById('recipeModalContent');
        const canShare = navigator.share !== undefined && navigator.canShare;
        
        content.innerHTML = `
            <div class="recipe-view">
                <h2>${recipe.name}</h2>
                <p class="category">${recipe.category}</p>
                <p class="prep-time"><i class="fas fa-clock"></i> זמן הכנה: ${recipe.prepTime || 'לא צוין'} דקות</p>
                ${recipe.storageInstructions ? `
                <div class="storage-instructions">
                    <h3><i class="fas fa-box"></i> המלצות שמירה:</h3>
                    <p>${recipe.storageInstructions}</p>
                </div>
                ` : ''}
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
                        ${canShare ? `
                            <button class="btn share-recipe-btn">
                                <i class="fas fa-share-alt"></i> שתף מתכון
                            </button>
                        ` : `
                            <button class="btn export-recipe-btn">
                                <i class="fas fa-file-export"></i> ייצא מתכון
                            </button>
                        `}
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
                    <ul class="recipe-ingredients">
                        ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                    <h3>הוראות הכנה:</h3>
                    <ol class="recipe-instructions">
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
            // Update the favorite button in the modal
            const favoriteBtn = modalContent.querySelector('.favorite-modal-btn');
            const isFavorite = this.favorites.includes(recipe.id);
            favoriteBtn.innerHTML = `
                <i class="fas ${isFavorite ? 'fa-heart' : 'far fa-heart'}"></i>
                ${isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
            `;
        });

        if (!recipe.externalLink) {
            if (canShare) {
                modalContent.querySelector('.share-recipe-btn').addEventListener('click', async () => {
                    try {
                        // יצירת טקסט השיתוף
                        const shareText = `ספר המתכונים שלי\ndevbyai.github.io\n\n${recipe.name}\n\nקטגוריה: ${recipe.category}\nזמן הכנה: ${recipe.prepTime || 'לא צוין'} דקות\n\nלמתכון המלא:\nhttps://devbyai.github.io/my-Recipes/`;

                        // יצירת קובץ JSON
                        const recipeData = {
                            name: recipe.name.trim(),
                            category: recipe.category.trim(),
                            prepTime: recipe.prepTime ? recipe.prepTime.toString().trim() : "לא צוין",
                            storageInstructions: recipe.storageInstructions ? recipe.storageInstructions.trim() : "",
                            ingredients: recipe.ingredients.map(i => i.trim()).filter(i => i),
                            instructions: recipe.instructions.map(i => i.trim()).filter(i => i),
                            externalLink: recipe.externalLink ? recipe.externalLink.trim() : null,
                            exportDate: new Date().toISOString(),
                            version: '1.0',
                            textDirection: 'rtl'
                        };

                        const jsonStr = JSON.stringify(recipeData, null, 2);
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const filename = `מתכון.json`;
                        const file = new File([blob], filename, { type: 'application/json' });

                        // בדיקה אם המכשיר תומך בשיתוף קבצים
                        const shareData = {
                            title: `מתכון: ${recipe.name}`,
                            text: shareText,
                            files: [file]
                        };

                        if (navigator.canShare(shareData)) {
                            await navigator.share(shareData);
                        } else {
                            // אם לא ניתן לשתף קבצים, נשתף רק את הטקסט ונוריד את הקובץ
                            await navigator.share({
                                title: `מתכון: ${recipe.name}`,
                                text: shareText
                            });
                            // הורדת הקובץ
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }
                    } catch (error) {
                        console.error('Error sharing:', error);
                        alert('אירעה שגיאה בשיתוף המתכון. אנא נסה שוב.');
                    }
                });
            } else {
                modalContent.querySelector('.export-recipe-btn').addEventListener('click', () => {
                    this.showImportExportInstructions();
                    this.exportRecipes([recipe.id]);
                });
            }

            modalContent.querySelector('.copy-recipe-btn').addEventListener('click', () => {
                const text = this.formatRecipeAsText(recipe);
                this.copyToClipboard(text);
            });
        }

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
    handleRecipeSubmit(event) {
        event.preventDefault();
        const name = document.getElementById('recipeName').value;
        const category = document.getElementById('recipeCategory').value;
        const prepTime = document.getElementById('prepTime').value;
        const storageInstructions = document.getElementById('storageInstructions').value;
        const isKosher = document.getElementById('isKosher')?.checked || false;
        const isVegan = document.getElementById('isVegan')?.checked || false;
        const isGlutenFree = document.getElementById('isGlutenFree')?.checked || false;
        
        // בדיקה אם זה מתכון עם קישור או מתכון מלא
        const isLinkRecipe = document.querySelector('.recipe-type-toggle .btn[data-type="link"]').classList.contains('active');
        
        let recipe = {
            id: this.currentEditingId || Date.now().toString(),
            name,
            category,
            prepTime,
            storageInstructions,
            isKosher,
            isVegan,
            isGlutenFree
        };

        if (isLinkRecipe) {
            const externalLink = document.getElementById('recipeLink').value;
            if (!externalLink) {
                alert('נא להזין קישור למתכון');
                return;
            }
            recipe.externalLink = externalLink;
            recipe.ingredients = [];
            recipe.instructions = [];
        } else {
            const ingredients = document.getElementById('recipeIngredients').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line !== '');
            
            const instructions = document.getElementById('recipeInstructions').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line !== '');

            if (!ingredients.length || !instructions.length) {
                alert('נא למלא את שדות המרכיבים והוראות ההכנה');
                return;
            }

            recipe.ingredients = ingredients;
            recipe.instructions = instructions;
        }

        if (!name || !category) {
            alert('נא למלא את כל השדות הנדרשים');
            return;
        }

        if (this.currentEditingId) {
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
        this.showingFavorites = !this.showingFavorites;
        btn.classList.toggle('active');
        
        // הצגת הודעה מתאימה
        if (this.showingFavorites) {
            this.showFilterNotification('מציג מתכונים מועדפים בלבד', 'fa-heart');
        } else {
            this.showFilterNotification('מציג את כל המתכונים', 'fa-list');
        }
        
        this.renderRecipes();
    }

    showFilterNotification(message, icon) {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.favorite-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = 'favorite-notification filter-change';
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Remove after animation
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    // Import/Export
    exportRecipes(recipeIds = null) {
        try {
            let recipesToExport;
            let fileName;
            let shareText = "הנה המתכון/ים ששמתי באתר, תוכל לעשות שהם ישמרו גם אצלך על ידי העלאת הקובץ לאתר https://devbyai.github.io/my-Recipes/";

            if (recipeIds) {
                recipesToExport = this.recipes.filter(recipe => recipeIds.includes(recipe.id));
                const recipe = recipesToExport[0];
                fileName = `${recipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.json`;
            } else {
                recipesToExport = this.recipes;
                fileName = 'all_recipes.json';
            }

            // עדכון המתכונים לייצוא כדי לוודא שיש הוראות אחסון
            recipesToExport = recipesToExport.map(recipe => ({
                ...recipe,
                storageInstructions: recipe.storageInstructions || '',
                textDirection: 'rtl'  // הוספת שדה לציון כיוון הטקסט
            }));

            const exportData = {
                recipes: recipesToExport,
                exportDate: new Date().toISOString(),
                version: '1.0',
                textDirection: 'rtl'  // הוספת שדה לציון כיוון הטקסט
            };

            const jsonStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });

            if (navigator.share) {
                const file = new File([blob], fileName, { type: 'application/json' });
                navigator.share({
                    title: 'ספר מתכונים',
                    text: shareText,
                    files: [file]
                }).catch(error => {
                    console.error('שגיאה בשיתוף:', error);
                    this.downloadFile(blob, fileName);
                });
            } else {
                this.downloadFile(blob, fileName);
            }
        } catch (error) {
            console.error('שגיאה בייצוא המתכונים:', error);
            alert('אירעה שגיאה בייצוא המתכונים. אנא נסה שוב.');
        }
    }

    downloadFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                    const data = JSON.parse(event.target.result);
                    
                    let recipesToImport = [];
                    
                    if (Array.isArray(data)) {
                        recipesToImport = data;
                    } else if (data.recipes && Array.isArray(data.recipes)) {
                        recipesToImport = data.recipes;
                    } else if (typeof data === 'object') {
                        recipesToImport = [data];
                    } else {
                        throw new Error('פורמט קובץ לא תקין');
                    }
                    
                    const validRecipes = recipesToImport.filter(recipe => {
                        return recipe && 
                               typeof recipe === 'object' && 
                               recipe.name && 
                               recipe.category;
                    });
                    
                    if (validRecipes.length === 0) {
                        throw new Error('לא נמצאו מתכונים תקינים בקובץ');
                    }
                    
                    validRecipes.forEach(recipe => {
                        if (!recipe.id) {
                            recipe.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                        }
                        recipe.ingredients = recipe.ingredients || [];
                        recipe.instructions = recipe.instructions || [];
                        recipe.storageInstructions = recipe.storageInstructions || '';
                        // שמירה על כיוון טקסט מימין לשמאל
                        if (recipe.textDirection !== 'rtl') {
                            recipe.textDirection = 'rtl';
                        }
                    });
                    
                    this.recipes = [...this.recipes, ...validRecipes];
                    this.saveRecipes();
                    
                    // קריאה מחדש לרינדור כדי להוסיף את כל מאזיני האירועים
                    this.renderRecipes();
                    
                    alert(`יובאו ${validRecipes.length} מתכונים בהצלחה!`);
                } catch (error) {
                    console.error('שגיאה בייבוא המתכונים:', error);
                    alert(`שגיאה בייבוא הקובץ: ${error.message || 'פורמט קובץ לא תקין'}`);
                } finally {
                    this.hideLoading();
                }
            };
            
            reader.onerror = () => {
                this.hideLoading();
                alert('שגיאה בקריאת הקובץ');
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
                recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (recipe.ingredients && recipe.ingredients.some(i => i.toLowerCase().includes(searchTerm.toLowerCase())))
            );
        }

        if (category) {
            filteredRecipes = filteredRecipes.filter(recipe => recipe.category === category);
        }

        // Clear existing content and event listeners
        grid.innerHTML = '';

        // Create and append recipe cards one by one
        filteredRecipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = `recipe-card ${recipe.externalLink ? 'external-link' : ''}`;
            card.dataset.recipeId = recipe.id;
            
            card.innerHTML = `
                <h3>${recipe.name}</h3>
                <div class="recipe-info">
                    <span class="category">${recipe.category}</span>
                    <span class="prep-time"><i class="fas fa-clock"></i> ${recipe.prepTime || 'לא צוין'} דקות</span>
                </div>
                <div class="recipe-card-actions">
                    ${recipe.externalLink ? `
                        <button class="btn view-recipe-btn" data-link="${recipe.externalLink}" aria-label="צפה במתכון ${recipe.name}">
                            <i class="fas fa-external-link-alt"></i> צפה במתכון
                        </button>
                        <button class="btn edit-recipe-btn" aria-label="ערוך מתכון ${recipe.name}">
                            <i class="fas fa-edit"></i> ערוך
                        </button>
                    ` : `
                        <button class="btn view-recipe-btn" aria-label="צפה במתכון ${recipe.name}">
                            <i class="fas fa-eye"></i> צפה במתכון
                        </button>
                    `}
                    <button class="btn favorite-btn" aria-label="${this.favorites.includes(recipe.id) ? 'הסר ממועדפים' : 'הוסף למועדפים'} ${recipe.name}">
                        <i class="fas ${this.favorites.includes(recipe.id) ? 'fa-heart' : 'far fa-heart'}"></i>
                    </button>
                    <button class="btn danger-btn delete-recipe-btn" aria-label="הסר מתכון ${recipe.name}">
                        <i class="fas fa-trash"></i> הסר מתכון
                    </button>
                </div>
            `;

            // Add event listeners
            const viewBtn = card.querySelector('.view-recipe-btn');
            if (viewBtn) {
                viewBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (recipe.externalLink) {
                        window.open(recipe.externalLink, '_blank');
                    } else {
                        this.showViewModal(recipe);
                    }
                };
            }

            const editBtn = card.querySelector('.edit-recipe-btn');
            if (editBtn) {
                editBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showEditModal(recipe);
                };
            }

            const favoriteBtn = card.querySelector('.favorite-btn');
            if (favoriteBtn) {
                favoriteBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleFavorite(recipe.id);
                };
            }

            const deleteBtn = card.querySelector('.delete-recipe-btn');
            if (deleteBtn) {
                deleteBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm('האם אתה בטוח שברצונך למחוק מתכון זה? פעולה זו אינה הפיכה!')) {
                        this.deleteRecipe(recipe.id);
                    }
                };
            }

            // Card click event
            card.onclick = () => {
                if (recipe.externalLink) {
                    window.open(recipe.externalLink, '_blank');
                } else {
                    this.showViewModal(recipe);
                }
            };

            // Append the card to the grid
            grid.appendChild(card);
        });
    }

    // פונקציה לבדיקת מתכונים כפולים
    findDuplicateRecipes(recipes) {
        const duplicates = [];
        const seen = new Map();

        recipes.forEach((recipe, index) => {
            const key = `${recipe.name}-${recipe.ingredients.join(',')}-${recipe.instructions}`;
            if (seen.has(key)) {
                duplicates.push({
                    original: seen.get(key),
                    duplicate: index,
                    recipe: recipe
                });
            } else {
                seen.set(key, index);
            }
        });

        return duplicates;
    }

    // פונקציה להצגת דיאלוג למחיקת מתכון כפול
    showDuplicateDialog(duplicate) {
        const dialog = document.createElement('div');
        dialog.className = 'modal active';
        dialog.innerHTML = `
            <div class="modal-content">
                <div class="close-btn" onclick="this.parentElement.parentElement.remove()">×</div>
                <h2>נמצא מתכון כפול</h2>
                <p>נמצאו שני מתכונים זהים:</p>
                <div class="duplicate-recipes">
                    <div class="duplicate-recipe">
                        <h3>מתכון #${duplicate.original + 1}</h3>
                        <p>${this.recipes[duplicate.original].name}</p>
                    </div>
                    <div class="duplicate-recipe">
                        <h3>מתכון #${duplicate.duplicate + 1}</h3>
                        <p>${this.recipes[duplicate.duplicate].name}</p>
                    </div>
                </div>
                <p>איזה מתכון תרצה למחוק?</p>
                <div class="duplicate-actions">
                    <button class="btn danger-btn" onclick="recipeManager.deleteDuplicateRecipe(${duplicate.original})">
                        <i class="fas fa-trash"></i> מחק מתכון #${duplicate.original + 1}
                    </button>
                    <button class="btn danger-btn" onclick="recipeManager.deleteDuplicateRecipe(${duplicate.duplicate})">
                        <i class="fas fa-trash"></i> מחק מתכון #${duplicate.duplicate + 1}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    // פונקציה למחיקת מתכון כפול
    deleteDuplicateRecipe(index) {
        this.recipes.splice(index, 1);
        this.saveRecipes();
        this.renderRecipes();
        document.querySelector('.modal').remove();
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
                            <button class="btn danger-btn delete-category" data-category="${category}" aria-label="מחק קטגוריה ${category}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="add-category-form">
                    <label for="newCategoryInput" class="sr-only">שם הקטגוריה החדשה</label>
                    <input type="text" id="newCategoryInput" placeholder="שם הקטגוריה החדשה" class="search-input">
                    <button class="btn primary-btn" id="addCategoryBtn" aria-label="הוסף קטגוריה חדשה">
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
                    
                    // עדכון המודל במקום ליצור אותו מחדש
                    const categoriesList = modal.querySelector('.categories-list');
                    categoriesList.innerHTML = this.categories.map(category => `
                        <div class="category-item">
                            <span>${category.replace(/-/g, ' ')}</span>
                            <button class="btn danger-btn delete-category" data-category="${category}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('');
                    
                    // הוספת מאזיני אירועים חדשים לכפתורי המחיקה
                    this.setupCategoryDeleteListeners(categoriesList);
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
                
                // עדכון המודל במקום ליצור אותו מחדש
                const categoriesList = modal.querySelector('.categories-list');
                categoriesList.innerHTML = this.categories.map(category => `
                    <div class="category-item">
                        <span>${category.replace(/-/g, ' ')}</span>
                        <button class="btn danger-btn delete-category" data-category="${category}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
                
                // הוספת מאזיני אירועים חדשים לכפתורי המחיקה
                this.setupCategoryDeleteListeners(categoriesList);
                
                // ניקוי שדה הקלט
                input.value = '';
            } else if (this.categories.includes(newCategory)) {
                alert('קטגוריה זו כבר קיימת');
            }
        });
        
        // הוספת מאזין אירועים למקש Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addBtn.click();
            }
        });
    }
    
    // פונקציה עזר להוספת מאזיני אירועים לכפתורי מחיקת קטגוריות
    setupCategoryDeleteListeners(categoriesList) {
        categoriesList.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                if (this.recipes.some(r => r.category === category)) {
                    alert('לא ניתן למחוק קטגוריה שיש בה מתכונים. העבר או מחק קודם את המתכונים מקטגוריה זו.');
                    return;
                }
                if (confirm('האם אתה בטוח שברצונך למחוק קטגוריה זו?')) {
                    this.categories = this.categories.filter(c => c !== category);
                    this.saveCategories();
                    
                    // עדכון המודל במקום ליצור אותו מחדש
                    const categoriesList = btn.closest('.categories-list');
                    categoriesList.innerHTML = this.categories.map(category => `
                        <div class="category-item">
                            <span>${category.replace(/-/g, ' ')}</span>
                            <button class="btn danger-btn delete-category" data-category="${category}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('');
                    
                    // הוספת מאזיני אירועים חדשים לכפתורי המחיקה
                    this.setupCategoryDeleteListeners(categoriesList);
                }
            });
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
                        const data = JSON.parse(text);
                        
                        // בדיקה אם הקובץ הוא מערך או אובייקט
                        let recipesToImport = [];
                        
                        if (Array.isArray(data)) {
                            recipesToImport = data;
                        } else if (data.recipes && Array.isArray(data.recipes)) {
                            recipesToImport = data.recipes;
                        } else if (typeof data === 'object') {
                            recipesToImport = [data];
                        } else {
                            throw new Error('פורמט קובץ לא תקין');
                        }
                        
                        // בדיקה שכל המתכונים מכילים את השדות הנדרשים
                        const validRecipes = recipesToImport.filter(recipe => {
                            return recipe && 
                                   typeof recipe === 'object' && 
                                   recipe.name && 
                                   recipe.category;
                        });
                        
                        if (validRecipes.length === 0) {
                            throw new Error('לא נמצאו מתכונים תקינים בקובץ');
                        }
                        
                        // הוספת ID ייחודי לכל מתכון מיובא אם אין לו כבר ID
                        validRecipes.forEach(recipe => {
                            if (!recipe.id) {
                                recipe.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                            }
                            recipe.ingredients = recipe.ingredients || [];
                            recipe.instructions = recipe.instructions || [];
                        });
                        
                        // הוספת המתכונים החדשים
                        this.recipes = [...this.recipes, ...validRecipes];
                        this.saveRecipes();
                        
                        // קריאה מחדש לרינדור כדי להוסיף את כל מאזיני האירועים
                        this.renderRecipes();
                        
                        alert(`יובאו ${validRecipes.length} מתכונים בהצלחה!`);
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

    // Check if user has chosen not to show the instructions again
    shouldShowInstructions() {
        return localStorage.getItem('hideImportExportInstructions') !== 'true';
    }
    
    // Show the instructions modal
    showImportExportInstructions() {
        if (this.shouldShowInstructions()) {
            this.importExportInstructionsModal.classList.add('active');
        }
    }
    
    // Close the instructions modal
    closeImportExportInstructions() {
        this.importExportInstructionsModal.classList.remove('active');
    }
    
    // Set up event listeners for import/export instructions
    setupImportExportInstructionsListeners() {
        // Handle "Don't show again" button
        this.dontShowAgainBtn.addEventListener('click', () => {
            localStorage.setItem('hideImportExportInstructions', 'true');
            this.closeImportExportInstructions();
        });
        
        // Handle close button
        this.closeInstructionsBtn.addEventListener('click', () => this.closeImportExportInstructions());
        this.closeInstructionsXBtn.addEventListener('click', () => this.closeImportExportInstructions());
    }

    showUpdateNotification() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content update-notification">
                <h2><i class="fas fa-exclamation-triangle"></i> הודעה חשובה - עדכון משמעותי!</h2>
                <div class="update-message">
                    <p>ברוכים הבאים לגרסה החדשה של האתר! 🎉</p>
                    <p>בוצע עדכון משמעותי שמשפר את חווית השימוש באתר.</p>
                    <p><strong>חשוב מאוד:</strong> על מנת שהאתר יעבוד בצורה תקינה עם התכונות החדשות, יש לבצע את הפעולות הבאות:</p>
                    <ol>
                        <li>ייצא את כל המתכונים הקיימים למחשב שלך (שמירת גיבוי)</li>
                        <li>מחק את כל המתכונים מהאתר</li>
                        <li>העלה מחדש את המתכונים מקובץ הגיבוי</li>
                    </ol>
                    <p>פעולה זו תבטיח שכל המתכונים שלך יעבדו בצורה מיטבית עם התכונות החדשות!</p>
                </div>
                <div class="modal-actions">
                    <button class="btn primary-btn" id="startUpdateBtn">
                        <i class="fas fa-check"></i> הבנתי, בוא נתחיל
                    </button>
                    <button class="btn" id="remindLaterBtn">
                        <i class="fas fa-clock"></i> תזכיר לי מאוחר יותר
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // הוספת מאזיני אירועים לכפתורים
        const startUpdateBtn = modal.querySelector('#startUpdateBtn');
        const remindLaterBtn = modal.querySelector('#remindLaterBtn');

        startUpdateBtn.addEventListener('click', () => {
            localStorage.setItem('updateNotificationShown', 'true');
            modal.remove();
            this.showExportAllPrompt();
        });

        remindLaterBtn.addEventListener('click', () => {
            modal.remove();
        });
    }

    showExportAllPrompt() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-file-export"></i> ייצוא המתכונים</h3>
                <p>ראשית, בוא נייצא את כל המתכונים שלך לקובץ גיבוי.</p>
                <div class="modal-actions">
                    <button class="btn primary-btn" id="exportNowBtn">
                        <i class="fas fa-download"></i> ייצא עכשיו
                    </button>
                    <button class="btn" id="cancelBtn">
                        <i class="fas fa-times"></i> ביטול
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const exportNowBtn = modal.querySelector('#exportNowBtn');
        const cancelBtn = modal.querySelector('#cancelBtn');

        exportNowBtn.addEventListener('click', () => {
            this.handleExportAll();
            modal.remove();
            this.showDeleteAllPrompt();
        });

        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });
    }

    showDeleteAllPrompt() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-trash"></i> מחיקת כל המתכונים</h3>
                <p>עכשיו, לאחר שייצאת את המתכונים, נמחק את כל המתכונים מהאתר.</p>
                <div class="modal-actions">
                    <button class="btn danger-btn" id="deleteAllBtn">
                        <i class="fas fa-trash"></i> מחק הכל
                    </button>
                    <button class="btn" id="cancelBtn">
                        <i class="fas fa-times"></i> ביטול
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const deleteAllBtn = modal.querySelector('#deleteAllBtn');
        const cancelBtn = modal.querySelector('#cancelBtn');

        deleteAllBtn.addEventListener('click', () => {
            if (confirm('האם אתה בטוח שברצונך למחוק את כל המתכונים? וידאת שיש לך גיבוי?')) {
                this.recipes = [];
                this.favorites = [];
                this.saveRecipes();
                localStorage.setItem('favorites', JSON.stringify(this.favorites));
                this.renderRecipes();
                modal.remove();
                this.showImportPrompt();
            }
        });

        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });
    }

    showImportPrompt() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-file-import"></i> ייבוא המתכונים מחדש</h3>
                <p>לסיום, בוא נייבא את המתכונים מקובץ הגיבוי שיצרת.</p>
                <div class="modal-actions">
                    <button class="btn primary-btn" id="importNowBtn">
                        <i class="fas fa-upload"></i> ייבא עכשיו
                    </button>
                    <button class="btn" id="cancelBtn">
                        <i class="fas fa-times"></i> ייבא מאוחר יותר
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const importNowBtn = modal.querySelector('#importNowBtn');
        const cancelBtn = modal.querySelector('#cancelBtn');

        importNowBtn.addEventListener('click', () => {
            this.handleImportAll();
            modal.remove();
        });

        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });
    }
}

// Initialize the app
const recipeManager = new RecipeManager();
