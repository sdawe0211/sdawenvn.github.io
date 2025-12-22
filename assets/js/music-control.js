// Background Music Control System
(function () {
    const bgMusic = document.getElementById('bgMusic');
    const successMusic = document.getElementById('successMusic');
    const musicToggle = document.getElementById('musicToggle');
    const musicIcon = musicToggle.querySelector('i');

    // Load saved music preference from localStorage
    const savedMusicState = localStorage.getItem('musicEnabled');
    let isMusicEnabled = savedMusicState === null ? true : savedMusicState === 'true';
    let hasUserInteracted = false;

    // Initialize music state
    function initMusicState() {
        if (isMusicEnabled) {
            musicToggle.classList.remove('muted');
            musicIcon.className = 'fas fa-volume-up';
            musicToggle.title = '點擊以靜音';
        } else {
            musicToggle.classList.add('muted');
            musicIcon.className = 'fas fa-volume-mute';
            musicToggle.title = '點擊以播放音樂';
            bgMusic.pause();
        }
    }

    // Try to play music
    function tryPlayMusic() {
        if (isMusicEnabled && hasUserInteracted) {
            bgMusic.volume = 0.5; // Set volume to 50%
            const playPromise = bgMusic.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('🎵 Background music started playing');
                }).catch(error => {
                    console.log('⚠️ Auto-play prevented:', error);
                    // If autoplay is blocked, we'll try again on next user interaction
                });
            }
        }
    }

    // Toggle music on/off
    function toggleMusic() {
        hasUserInteracted = true;
        isMusicEnabled = !isMusicEnabled;

        // Save preference
        localStorage.setItem('musicEnabled', isMusicEnabled);

        if (isMusicEnabled) {
            musicToggle.classList.remove('muted');
            musicIcon.className = 'fas fa-volume-up';
            musicToggle.title = '點擊以靜音';
            // Only play background music if success music is not playing
            if (!successMusic || successMusic.paused) {
                tryPlayMusic();
            }
        } else {
            musicToggle.classList.add('muted');
            musicIcon.className = 'fas fa-volume-mute';
            musicToggle.title = '點擊以播放音樂';
            bgMusic.pause();
            // Also pause success music if it's playing
            if (successMusic && !successMusic.paused) {
                successMusic.pause();
            }
        }
    }

    // Music toggle button click handler
    musicToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMusic();
    });

    // Start music on first user interaction
    function onFirstInteraction() {
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            tryPlayMusic();
        }
    }

    // Listen for any user interaction to start music
    const interactionEvents = ['click', 'touchstart', 'keydown'];
    interactionEvents.forEach(eventType => {
        document.addEventListener(eventType, onFirstInteraction, { once: true });
    });

    // Initialize on page load
    initMusicState();

    // Handle audio errors
    bgMusic.addEventListener('error', (e) => {
        console.error('❌ Audio loading error:', e);
        musicToggle.classList.add('muted');
        musicIcon.className = 'fas fa-volume-mute';
    });

    // Log when music is ready
    bgMusic.addEventListener('canplaythrough', () => {
        console.log('✅ Background music loaded and ready');
    });

    if (successMusic) {
        successMusic.addEventListener('canplaythrough', () => {
            console.log('✅ Success music loaded and ready');
        });
    }

    // Expose API for other scripts
    window.musicControl = {
        isMusicEnabled: function () {
            return isMusicEnabled;
        },
        toggleMusic: toggleMusic,
        playBackgroundMusic: tryPlayMusic,
        pauseBackgroundMusic: function () {
            bgMusic.pause();
        }
    };

    console.log('🎵 Music control system initialized');
})();
