// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. STATE ---
    let allPagesData = [];
    let currentPageIndex = 0;
    let touchStartX = null;
    let touchMoveX = null;

    // --- 2. GRAB DOM ELEMENTS ---
    const titleEl = document.getElementById('page-title');
    const imageEl = document.getElementById('page-image');
    const overviewEl = document.getElementById('page-overview');
    const linkEl = document.getElementById('page-link');
    const howToListEl = document.getElementById('page-how-to');
    const tipEl = document.getElementById('page-tip');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const cardEl = document.querySelector('.exercise-card');
    
    // --- NEW: Grab menu and counter elements ---
    const pageCounterEl = document.getElementById('page-counter');
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const sideMenuEl = document.getElementById('side-menu');
    const menuContentEl = document.querySelector('.menu-content');
    const menuLinksEl = document.getElementById('menu-links');


    // --- 3. FUNCTIONS ---

    /**
     * Fetches exercise data and initializes the first page.
     */
    async function init() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allPagesData = await response.json();
            
            // --- NEW: Populate the side menu ---
            populateSideMenu();

            // Load the first page
            displayPage(currentPageIndex);
            
            // Add event listeners for navigation
            prevBtn.addEventListener('click', showPrevPage);
            nextBtn.addEventListener('click', showNextPage);
            
            // Add touch event listeners for swiping
            cardEl.addEventListener('touchstart', handleTouchStart);
            cardEl.addEventListener('touchmove', handleTouchMove);
            cardEl.addEventListener('touchend', handleTouchEnd);

            // --- NEW: Add menu event listeners ---
            menuBtn.addEventListener('click', toggleMenu);
            closeBtn.addEventListener('click', toggleMenu);
            sideMenuEl.addEventListener('click', closeMenuOnOverlayClick);
            // Stop clicks inside the menu from closing it
            menuContentEl.addEventListener('click', (e) => e.stopPropagation());


        } catch (error)
        {
            console.error("Could not fetch or parse data:", error);
            // Display an error to the user
            document.body.innerHTML = '<p style="color: red;">Error loading content. Please try again later.</p>';
        }
    }

    /**
     * Renders a page's content based on its index.
     * @param {number} index - The index of the page to display from allPagesData.
     */
    function displayPage(index) {
        const page = allPagesData[index];

        // 1. Update simple text/image content
        titleEl.textContent = page.title;
        imageEl.src = page.imagePath;
        imageEl.alt = page.title; // Good for accessibility
        overviewEl.textContent = page.overview;
        linkEl.textContent = page.relatedLinkText;
        linkEl.href = page.relatedLinkUrl;
        tipEl.textContent = page.trainersTip;

        // 2. Update lists (using a helper function)
        populateList(howToListEl, page.howTo);

        // 3. Update navigation button states
        updateNavButtons();
        
        // --- NEW: Update Page Counter ---
        pageCounterEl.textContent = `${index + 1} / ${allPagesData.length}`;
    }

    /**
     * Helper function to fill a <ul> with items from an array.
     */
    function populateList(listElement, items) {
        listElement.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            listElement.appendChild(li);
        });
    }

    /**
     * Disables/Enables nav buttons based on the current page.
     */
    function updateNavButtons() {
        prevBtn.disabled = (currentPageIndex === 0);
        nextBtn.disabled = (currentPageIndex === allPagesData.length - 1);
    }

    // --- 4. NAVIGATION EVENT HANDLERS ---

    function showNextPage() {
        if (currentPageIndex < allPagesData.length - 1) {
            currentPageIndex++;
            displayPage(currentPageIndex);
        }
    }

    function showPrevPage() {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            displayPage(currentPageIndex);
        }
    }
    
    // --- 5. SWIPE HANDLER FUNCTIONS ---

    function handleTouchStart(event) {
        touchStartX = event.touches[0].clientX;
        touchMoveX = null; 
    }

    function handleTouchMove(event) {
        touchMoveX = event.touches[0].clientX;
    }

    function handleTouchEnd() {
        if (touchMoveX === null || touchStartX === null) {
            return;
        }
        let swipeDiff = touchStartX - touchMoveX;
        let swipeThreshold = 50; 

        if (swipeDiff > swipeThreshold) {
            showNextPage();
        } else if (swipeDiff < -swipeThreshold) {
            showPrevPage();
        }
        touchStartX = null;
        touchMoveX = null;
    }

    
    // --- 6. NEW: MENU FUNCTIONS ---

    /**
     * Fills the side menu with links to every page.
     */
    function populateSideMenu() {
        menuLinksEl.innerHTML = ''; // Clear old links
        allPagesData.forEach((page, index) => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = page.title;
            // Store the index on the button itself
            button.dataset.index = index; 
            button.addEventListener('click', jumpToPage);
            
            li.appendChild(button);
            menuLinksEl.appendChild(li);
        });
    }

    /**
     * Jumps to a specific page from a menu click.
     */
    function jumpToPage(event) {
        // Get the index we stored in the data-index attribute
        const newIndex = parseInt(event.target.dataset.index);
        
        if (!isNaN(newIndex)) {
            currentPageIndex = newIndex;
            displayPage(currentPageIndex);
            toggleMenu(); // Close the menu
        }
    }

    /**
     * Shows or hides the side menu.
     */
    function toggleMenu() {
        sideMenuEl.classList.toggle('hidden');
    }

    /**
     * Closes the menu ONLY if the click is on the dark overlay.
     */
    function closeMenuOnOverlayClick(event) {
        // If the click was directly on the overlay, close the menu
        if (event.target === sideMenuEl) {
            toggleMenu();
        }
    }


    // --- 7. INITIALIZE THE APP ---
    init();

});