document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM
    const recordBtn = document.getElementById('recordBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const timerDisplay = document.getElementById('timer');
    const playExampleBtn = document.getElementById('playExampleBtn');
    const audioProgress = document.getElementById('audioProgress');
    const phraseSelect = document.getElementById('phraseSelect');
    const ageSelect = document.getElementById('ageSelect');
    const environmentSelect = document.getElementById('environmentSelect');

    // Variables d'état
    let isRecording = false;
    let currentExampleAudio = null;

    // Initialisation du recorder
    audioRecorder.init().then(initialized => {
        if (!initialized) {
            alert('Erreur d\'accès au microphone. Veuillez vérifier les permissions.');
            recordBtn.disabled = true;
        }
    });

    // Gestion de l'exemple audio
    playExampleBtn.addEventListener('click', async () => {
        if (currentExampleAudio && !currentExampleAudio.paused) {
            currentExampleAudio.pause();
            currentExampleAudio.currentTime = 0;
            playExampleBtn.innerHTML = '<i class="fas fa-play"></i> Écouter l\'exemple';
            audioProgress.style.width = '0%';
            return;
        }

        playExampleBtn.innerHTML = '<i class="fas fa-stop"></i> Arrêter';
        
        currentExampleAudio = await audioRecorder.playExample(phraseSelect.value);
        
        if (currentExampleAudio) {
            currentExampleAudio.addEventListener('timeupdate', () => {
                const progress = (currentExampleAudio.currentTime / currentExampleAudio.duration) * 100;
                audioProgress.style.width = `${progress}%`;
            });

            currentExampleAudio.addEventListener('ended', () => {
                playExampleBtn.innerHTML = '<i class="fas fa-play"></i> Écouter l\'exemple';
                audioProgress.style.width = '0%';
            });
        }
    });

    // Gestion de l'enregistrement
    recordBtn.addEventListener('click', async () => {
        if (!isRecording) {
            // Démarrer l'enregistrement
            const started = audioRecorder.startRecording(
                // Callback de mise à jour du timer
                (elapsed) => {
                    timerDisplay.textContent = audioRecorder.formatTime(elapsed);
                },
                // Callback de fin d'enregistrement
                (blob) => handleRecordingComplete(blob)
            );

            if (started) {
                isRecording = true;
                updateUIForRecording(true);
            }
        }
    });

    pauseBtn.addEventListener('click', () => {
        if (audioRecorder.isPaused) {
            audioRecorder.resumeRecording();
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            audioRecorder.pauseRecording();
            pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });

    stopBtn.addEventListener('click', () => {
        audioRecorder.stopRecording();
    });

    deleteBtn.addEventListener('click', () => {
        audioRecorder.cancelRecording();
        resetUI();
    });

    // Gestion de la fin d'enregistrement
    async function handleRecordingComplete(audioBlob) {
        if (!audioBlob) return;

        const metadata = {
            phrase: phraseSelect.value,
            ageRange: ageSelect.value,
            environment: environmentSelect.value,
            timestamp: new Date().toISOString()
        };

        try {
            // Envoi à Telegram
            await telegramService.sendAudioToTelegram(audioBlob, metadata);
            
            // Afficher le modal de remerciement
            showThankYouModal();
        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            alert('Une erreur est survenue lors de l\'envoi de l\'enregistrement. Veuillez réessayer.');
        } finally {
            resetUI();
        }
    }

    // Fonctions UI
    function updateUIForRecording(isRecording) {
        recordBtn.classList.toggle('recording', isRecording);
        recordBtn.innerHTML = isRecording ? 
            '<i class="fas fa-microphone-slash"></i>' : 
            '<i class="fas fa-microphone"></i>';
        
        pauseBtn.disabled = !isRecording;
        stopBtn.disabled = !isRecording;
        deleteBtn.disabled = !isRecording;
        playExampleBtn.disabled = isRecording;
        
        // Désactiver les sélecteurs pendant l'enregistrement
        phraseSelect.disabled = isRecording;
        ageSelect.disabled = isRecording;
        environmentSelect.disabled = isRecording;
    }

    function resetUI() {
        isRecording = false;
        updateUIForRecording(false);
        timerDisplay.textContent = '00:00';
        audioProgress.style.width = '0%';
    }

    // Gestion du modal de remerciement
    function showThankYouModal() {
        const modal = document.getElementById('thankYouModal');
        modal.style.display = 'block';
    }

    // Fonctions de partage
    window.shareToSocial = function(platform) {
        const message = "Participez à la création du premier assistant vocal en langue Fon ! 🎙️\n" +
                       "Rendez-vous sur https://sirifon.bj pour contribuer.\n" +
                       "#SiriFon #Bénin #IA #VoiceAssistant";

        switch (platform) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://sirifon.bj')}`, '_blank');
                break;
            case 'whatsapp':
                window.open(`whatsapp://send?text=${encodeURIComponent(message)}`, '_blank');
                break;
            case 'other':
                if (navigator.share) {
                    navigator.share({
                        title: 'Siri Fon Bénin',
                        text: message,
                        url: 'https://sirifon.bj'
                    });
                }
                break;
        }
    };

    window.closeThankYouModal = function() {
        const modal = document.getElementById('thankYouModal');
        modal.style.display = 'none';
    };

    // Gestion du défilement des textes
    const scrollingTexts = document.getElementById('scrollingTexts');
    let currentTextIndex = 0;
    const texts = scrollingTexts.children;

    function updateScrollingText() {
        for (let i = 0; i < texts.length; i++) {
            texts[i].style.opacity = i === currentTextIndex ? '1' : '0';
        }
        currentTextIndex = (currentTextIndex + 1) % texts.length;
    }

    // Initialiser le premier texte
    updateScrollingText();
    // Changer le texte toutes les 4 secondes
    setInterval(updateScrollingText, 4000);
});