document.addEventListener('DOMContentLoaded', () => {
    // Créer l'instance de AudioRecorder
    const audioRecorder = new AudioRecorder();

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
    const playRecordingBtn = document.getElementById('playRecordingBtn');
    const submitBtn = document.getElementById('submitBtn');
    const currentPhraseElement = document.getElementById('currentPhrase');
    const currentPhraseNumber = document.getElementById('currentPhraseNumber');
    const recordingsList = document.getElementById('recordingsList');

    const micPermissionModal = document.getElementById('micPermissionModal');
    const allowMicButton = document.getElementById('allowMicButton');

    // Variables d'état
    let isRecording = false;
    let currentExampleAudio = null;
    const phrases = ['Appel_Nom', 'Decroche_L\'appel', 'Ouvre_whatsapp', 'Ouvre_galerie'];
    let currentPhraseIndex = 0;
    const recordings = new Map(); // Pour stocker les enregistrements

    // Afficher le modal de permission au démarrage
    micPermissionModal.style.display = 'block';

    // Gérer le clic sur le bouton d'autorisation
    allowMicButton.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micPermissionModal.style.display = 'none';
            
            // Initialiser le recorder avec le stream
            const initialized = await audioRecorder.init();
            if (!initialized) {
                alert('Erreur d\'initialisation du microphone. Veuillez réessayer.');
            }

            // Afficher un message temporaire de confirmation
            showMicStatus('✅ Microphone activé');
        } catch (error) {
            console.error('Erreur d\'accès au microphone:', error);
            showMicStatus('❌ Erreur d\'accès au microphone', true);
        }
    });

    // Fonction pour afficher les messages de statut du microphone
    function showMicStatus(message, isError = false) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'mic-status';
        statusDiv.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
        statusDiv.textContent = message;
        document.body.appendChild(statusDiv);
        statusDiv.style.display = 'block';

        setTimeout(() => {
            statusDiv.style.opacity = '0';
            setTimeout(() => statusDiv.remove(), 300);
        }, 3000);
    }

    // Gérer la fermeture de la page
    window.addEventListener('beforeunload', () => {
        if (audioRecorder.mediaRecorder && audioRecorder.mediaRecorder.stream) {
            audioRecorder.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            showMicStatus('🎤 Microphone désactivé');
        }
    });

    // Mettre à jour l'affichage de la phrase courante
    function updateCurrentPhrase() {
        currentPhraseElement.textContent = phrases[currentPhraseIndex];
        currentPhraseNumber.textContent = (currentPhraseIndex + 1).toString();
        submitBtn.innerHTML = `<i class="fas fa-check"></i> Valider et envoyer (${recordings.size}/4)`;
    }

    // Créer un élément d'enregistrement
    function createRecordingElement(phrase, blob) {
        const div = document.createElement('div');
        div.className = 'recording-item';
        div.innerHTML = `
            <div class="recording-info">
                <span>${phrase}</span>
                <button class="play-btn" title="Écouter">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="recording-actions">
                <button class="delete-btn" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Gérer la lecture
        const playBtn = div.querySelector('.play-btn');
        let audio = new Audio(URL.createObjectURL(blob));
        
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                playBtn.innerHTML = '<i class="fas fa-stop"></i>';
                audio.onended = () => {
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                };
            } else {
                audio.pause();
                audio.currentTime = 0;
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });

        // Gérer la suppression
        div.querySelector('.delete-btn').addEventListener('click', () => {
            recordings.delete(phrase);
            div.remove();
            updateSubmitButton();
        });

        return div;
    }

    // Mettre à jour le bouton de validation
    function updateSubmitButton() {
        submitBtn.disabled = recordings.size !== 4;
        submitBtn.innerHTML = `<i class="fas fa-check"></i> Valider et envoyer (${recordings.size}/4)`;
    }

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
        currentExampleAudio = await audioRecorder.playExample(phrases[currentPhraseIndex]);
        
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
            const started = audioRecorder.startRecording(
                (elapsed) => {
                    timerDisplay.textContent = audioRecorder.formatTime(elapsed);
                },
                (blob) => handleRecordingComplete(blob)
            );

            if (started) {
                isRecording = true;
                updateUIForRecording(true);
                stopBtn.disabled = false;
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
        if (isRecording) {
            audioRecorder.stopRecording()
                .then(blob => {
                    if (blob) {
                        handleRecordingComplete(blob);
                    }
                    isRecording = false;
                    updateUIForRecording(false);
                    stopBtn.disabled = true;
                });
        }
    });

    deleteBtn.addEventListener('click', () => {
        audioRecorder.cancelRecording();
        resetUI();
    });

    // Gestion de la fin d'enregistrement
    async function handleRecordingComplete(audioBlob) {
        if (!audioBlob) return;
        
        const currentPhrase = phrases[currentPhraseIndex];
        recordings.set(currentPhrase, audioBlob);
        
        // Ajouter l'enregistrement à la liste
        const recordingElement = createRecordingElement(currentPhrase, audioBlob);
        recordingsList.appendChild(recordingElement);
        
        // Passer à la phrase suivante si possible
        if (currentPhraseIndex < phrases.length - 1) {
            currentPhraseIndex++;
            updateCurrentPhrase();
        }
        
        // Réinitialiser l'interface
        isRecording = false;
        updateUIForRecording(false);
        stopBtn.disabled = true;
        timerDisplay.textContent = '00:00';
        updateSubmitButton();
    }

    // Écouter l'enregistrement
    playRecordingBtn.addEventListener('click', () => {
        if (audioRecorder.isPlaying) {
            audioRecorder.stopPlayback();
            playRecordingBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            audioRecorder.playRecording().then(() => {
                playRecordingBtn.innerHTML = '<i class="fas fa-stop"></i>';
                
                // Remettre le bouton play quand l'audio est terminé
                audioRecorder.audio.addEventListener('ended', () => {
                    playRecordingBtn.innerHTML = '<i class="fas fa-play"></i>';
                });
            });
        }
    });

    // Gestion de la validation et de l'envoi
    submitBtn.addEventListener('click', async () => {
        if (recordings.size !== 4) return;

        const metadata = {
            ageRange: ageSelect.value,
            environment: environmentSelect.value,
            timestamp: new Date().toISOString()
        };

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
            
            // Envoyer chaque enregistrement
            for (const [phrase, blob] of recordings) {
                await telegramService.sendAudioToTelegram(blob, { ...metadata, phrase });
            }
            
            showThankYouModal();
        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            alert('Une erreur est survenue lors de l\'envoi des enregistrements. Veuillez réessayer.');
            submitBtn.disabled = false;
        }
    });

    // Fonctions UI
    function updateUIForRecording(isRecording) {
        recordBtn.classList.toggle('recording', isRecording);
        recordBtn.innerHTML = isRecording ? 
            '<i class="fas fa-microphone-slash"></i>' : 
            '<i class="fas fa-microphone"></i>';
        
        stopBtn.disabled = !isRecording;
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
        playRecordingBtn.disabled = true;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Valider et envoyer';
    }

    // Fonctions pour gérer le modal
    function showThankYouModal() {
        const modal = document.getElementById('thankYouModal');
        modal.style.display = 'block';
    }

    window.closeThankYouModal = function() {
        const modal = document.getElementById('thankYouModal');
        modal.style.display = 'none';
        // Optionnel : recharger la page pour recommencer
        window.location.reload();
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

    // Initialisation
    updateCurrentPhrase();
});