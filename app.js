// At the top of app.js
import { aiTracker } from './ai-tracker.js';

document.addEventListener('DOMContentLoaded', () => {

    // ... [KEEP YOUR EXISTING VARIABLES] ...
    
    // --- NEW VARIABLES ---
    const aiLaunchContainer = document.getElementById('ai-launch-container');
    const btnLaunchAi = document.getElementById('btn-launch-ai');
    
    // Overlay Elements
    const aiOverlay = document.getElementById('ai-overlay');
    const aiBtnStart = document.getElementById('ai-btn-start');
    const aiBtnClose = document.getElementById('ai-btn-close');
    const aiBtnExitSmall = document.getElementById('ai-btn-exit-small');
    const aiExerciseTitle = document.getElementById('ai-exercise-title');
    const aiStartScreen = document.getElementById('ai-start-screen');

    // ... [KEEP YOUR EXISTING INIT FUNCTION] ...

    /**
     * Attaches all primary event listeners.
     */
    function addEventListeners() {
        // ... [KEEP EXISTING LISTENERS] ...
        
        // --- NEW AI LISTENERS ---
        btnLaunchAi.addEventListener('click', openAiTracker);
        
        // Overlay Controls
        aiBtnStart.addEventListener('click', () => {
            aiStartScreen.style.display = 'none';
            // Extract Reps from the text (e.g. "3x12") -> 12
            const repString = document.querySelector('.exercise-sets').textContent;
            let target = 12;
            const match = repString.match(/x(\d+)/); // looks for "x12"
            if(match) target = parseInt(match[1]);
            
            aiTracker.start(target);
        });
        
        const closeAi = () => {
            aiTracker.stop();
            aiOverlay.classList.add('hidden');
            // Show start screen again for next time
            aiStartScreen.style.display = 'flex'; 
        };
        
        aiBtnClose.addEventListener('click', closeAi);
        aiBtnExitSmall.addEventListener('click', closeAi);
    }

    // ... [KEEP SIDE MENU FUNCTIONS] ...

    /**
     * Displays the detailed view for a single exercise.
     */
    function displayExerciseView(exerciseId, setsAndReps) {
        const exercise = allData.exerciseLibrary[exerciseId];
        
        // ... [KEEP EXISTING DISPLAY LOGIC] ...
        
        // --- NEW: AI BUTTON LOGIC ---
        // Check if data.json has "aiType" set for this exercise
        if (exercise.aiType) {
            aiLaunchContainer.classList.remove('hidden');
            // Store current exercise data on the button for easy access
            btnLaunchAi.dataset.title = exercise.title;
        } else {
            aiLaunchContainer.classList.add('hidden');
        }

        // ... [KEEP THE REST OF THE FUNCTION] ...
    }
    
    function openAiTracker() {
        aiOverlay.classList.remove('hidden');
        aiExerciseTitle.textContent = btnLaunchAi.dataset.title || "Workout";
        // We don't start the camera immediately; we wait for user to hit "Start Session" in overlay
    }
});

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. STATE ---
    let allData = {}; 
    let currentDayExercises = []; 
    let currentExerciseIndex = 0; 
    let touchStartX = null;
    let touchMoveX = null;

    // --- 2. GRAB DOM ELEMENTS (Corrected) ---
    const cardEl = document.querySelector('.exercise-card');
    const titleEl = document.getElementById('page-title');
    
    // --- CORRECTED Media Elements ---
    const imageContainerEl = document.getElementById('image-container'); // This was the problem area
    const imageEl = document.getElementById('page-image');
    const videoContainerEl = document.getElementById('video-container'); // This was the problem area
    
    const contentWrapperEl = document.getElementById('text-content-wrapper');
    const paginationEl = document.getElementById('pagination');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageCounterEl = document.getElementById('page-counter');
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const sideMenuEl = document.getElementById('side-menu');
    const menuContentEl = document.querySelector('.menu-content');
    const menuLinksEl = document.getElementById('menu-links');

    // --- 3. MAIN FUNCTIONS ---

    /**
     * Fetches exercise data and initializes the app.
     */
    async function init() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allData = await response.json();
            
            if (!allData.workoutPlan || !allData.exerciseLibrary) {
                throw new Error("Data.json is in the wrong format.");
            }
            
            populateSideMenu();
            addEventListeners();

        } catch (error) {
            console.error("Could not fetch or parse data:", error);
            titleEl.textContent = "Error";
            contentWrapperEl.innerHTML = `<p style="color: red;">Error loading content: ${error.message}</p>`;
        }
    }

    /**
     * Attaches all primary event listeners.
     */
    function addEventListeners() {
        // Navigation
        prevBtn.addEventListener('click', showPrevExercise);
        nextBtn.addEventListener('click', showNextExercise);
        
        // Swiping
        cardEl.addEventListener('touchstart', handleTouchStart);
        cardEl.addEventListener('touchmove', handleTouchMove);
        cardEl.addEventListener('touchend', handleTouchEnd);

        // Menu
        menuBtn.addEventListener('click', toggleMenu);
        closeBtn.addEventListener('click', toggleMenu);
        sideMenuEl.addEventListener('click', closeMenuOnOverlayClick);
    }

    /**
     * Fills the side menu with links to every "Day" in the plan.
     */
    function populateSideMenu() {
        menuLinksEl.innerHTML = ''; // Clear old links
        
        allData.workoutPlan.forEach(day => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = day.dayTitle;
            button.dataset.dayId = day.dayId; 
            
            button.addEventListener('click', () => {
                displayDayView(day);
                toggleMenu(); // Close the menu
            });
            
            li.appendChild(button);
            menuLinksEl.appendChild(li);
        });
    }

    /**
     * Displays the "Day" view with its purpose and list of exercises.
     * @param {object} day - The day object from allData.workoutPlan
     */
    function displayDayView(day) {
        // Set main title
        titleEl.textContent = day.dayTitle;
        
        // --- This is line 110, it should now work ---
        imageContainerEl.style.display = 'none';
        videoContainerEl.style.display = 'none'; // Hide video
        videoContainerEl.innerHTML = ''; // Stop any playing videos
        paginationEl.classList.add('hidden');
        
        // Clear old content
        contentWrapperEl.innerHTML = '';
        
        // Add Day Purpose
        const purposeEl = document.createElement('p');
        purposeEl.className = 'day-purpose';
        purposeEl.textContent = day.purpose;
        contentWrapperEl.appendChild(purposeEl);
        
        // Add Exercise List
        const listEl = document.createElement('ol');
        listEl.className = 'day-exercise-list';
        
        // Store this day's exercise list for nav
        currentDayExercises = day.exercises;
        
        day.exercises.forEach((exercise, index) => {
            const exerciseDetails = allData.exerciseLibrary[exercise.id];
            
            if (!exerciseDetails) {
                console.warn(`Could not find exercise with ID: ${exercise.id}`);
                return;
            }

            const li = document.createElement('li');
            const button = document.createElement('button');
            
            button.innerHTML = `
                ${exerciseDetails.title}
                <span>${exercise.setsAndReps}</span>
            `;
            
            button.dataset.index = index;
            button.dataset.exerciseId = exercise.id;
            
            button.addEventListener('click', () => {
                currentExerciseIndex = index;
                displayExerciseView(exercise.id, exercise.setsAndReps);
            });
            
            li.appendChild(button);
            listEl.appendChild(li);
        });
        
        contentWrapperEl.appendChild(listEl);
    }

    /**
     * Displays the detailed view for a single exercise.
     * @param {string} exerciseId - The ID of the exercise from the library.
     * @param {string} setsAndReps - The sets/reps string for this specific day.
     */
    function displayExerciseView(exerciseId, setsAndReps) {
        const exercise = allData.exerciseLibrary[exerciseId];
        
        if (!exercise) {
            titleEl.textContent = "Error";
            contentWrapperEl.innerHTML = `<p>Exercise not found.</p>`;
            return;
        }

        // Set title
        titleEl.textContent = exercise.title;
        
        // --- NEW MEDIA LOGIC ---
        if (exercise.youtubeId) {
            // Show video, hide image
            imageContainerEl.style.display = 'none';
            videoContainerEl.style.display = 'block';

            // Create the iframe
            videoContainerEl.innerHTML = `
                <iframe 
                    src="https://www.youtube.com/embed/${exercise.youtubeId}?autoplay=0&modestbranding=1&rel=0" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>`;
        } else {
            // Show image, hide video
            imageContainerEl.style.display = 'block';
            videoContainerEl.style.display = 'none';
            videoContainerEl.innerHTML = ''; // Clear any old iframe

            // Set image source
            imageEl.src = exercise.imagePath;
            imageEl.alt = exercise.title;
        }
        
        // Show navigation
        paginationEl.classList.remove('hidden');
        
        // Clear wrapper and build content
        contentWrapperEl.innerHTML = '';

        // Add the Sets and Reps as a sub-header
        const setsEl = document.createElement('h2');
        setsEl.className = 'exercise-sets';
        setsEl.textContent = setsAndReps;
        contentWrapperEl.appendChild(setsEl);
        
        // Overview
        if (exercise.overview) {
            const p = document.createElement('p');
            p.id = 'page-overview';
            p.textContent = exercise.overview;
            contentWrapperEl.appendChild(p);
        }
        
        // Related Link
        if (exercise.relatedLink) {
            const a = document.createElement('a');
            a.id = 'page-link';
            a.href = '#'; 
            a.textContent = exercise.relatedLink;
            a.target = '_blank';
            contentWrapperEl.appendChild(a);
        }
        
        contentWrapperEl.appendChild(document.createElement('hr'));
        
        // How-To Section
        if (exercise.howTo && exercise.howTo.length > 0) {
            const howToSection = document.createElement('section');
            howToSection.className = 'content-section';
            howToSection.innerHTML = `<h2>How-To</h2>`;
            const ul = document.createElement('ul');
            populateList(ul, exercise.howTo);
            howToSection.appendChild(ul);
            contentWrapperEl.appendChild(howToSection);
        }
        
        // Trainer's Tip Section
        if (exercise.trainersTip) {
            const tipSection = document.createElement('section');
            tipSection.className = 'content-section';
            tipSection.innerHTML = `<h2>Our Trainer's Tip</h2>`;
            const bq = document.createElement('blockquote');
            bq.id = 'page-tip';
            bq.textContent = exercise.trainersTip;
            tipSection.appendChild(bq);
            contentWrapperEl.appendChild(tipSection);
        }
        
        // Update nav state
        updateNavButtons();
    }
    

    // --- 4. NAVIGATION & HELPERS ---

    function populateList(listElement, items) {
        listElement.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            listElement.appendChild(li);
        });
    }

    function updateNavButtons() {
        prevBtn.disabled = (currentExerciseIndex === 0);
        nextBtn.disabled = (currentExerciseIndex === currentDayExercises.length - 1);
        pageCounterEl.textContent = `${currentExerciseIndex + 1} / ${currentDayExercises.length}`;
    }

    function showNextExercise() {
        if (currentExerciseIndex < currentDayExercises.length - 1) {
            currentExerciseIndex++;
            const nextExercise = currentDayExercises[currentExerciseIndex];
            displayExerciseView(nextExercise.id, nextExercise.setsAndReps);
        }
    }

    function showPrevExercise() {
        if (currentExerciseIndex > 0) {
            currentExerciseIndex--;
            const prevExercise = currentDayExercises[currentExerciseIndex];
            displayExerciseView(prevExercise.id, prevExercise.setsAndReps);
        }
    }
    
    // --- 5. MENU & SWIPE HANDLERS ---

    function toggleMenu() {
        sideMenuEl.classList.toggle('hidden');
    }

    function closeMenuOnOverlayClick(event) {
        if (event.target === sideMenuEl) {
            toggleMenu();
        }
    }
    
    function handleTouchStart(event) {
        touchStartX = event.touches[0].clientX;
        touchMoveX = null; 
    }

    function handleTouchMove(event) {
        touchMoveX = event.touches[0].clientX;
    }

    function handleTouchEnd() {
        if (paginationEl.classList.contains('hidden')) {
            return;
        }
        if (touchMoveX === null || touchStartX === null) return;
        let swipeDiff = touchStartX - touchMoveX;
        let swipeThreshold = 50; 

        if (swipeDiff > swipeThreshold) {
            showNextExercise();
        } else if (swipeDiff < -swipeThreshold) {
            showPrevExercise();
        }
        touchStartX = null;
        touchMoveX = null;
    }

    // --- 6. INITIALIZE THE APP ---
    init();


});
