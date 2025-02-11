document.addEventListener('DOMContentLoaded', () => {
    // Créer l'instance de AudioRecorder
    const audioRecorder = new AudioRecorder();

    // Éléments DOM
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const timerDisplay = document.getElementById('timer');
    const playExampleBtn = document.getElementById('playExampleBtn');
    const audioProgress = document.getElementById('audioProgress');
    const ageSelect = document.getElementById('ageSelect');
    const environmentSelect = document.getElementById('environmentSelect');
    const submitBtn = document.getElementById('submitBtn');
    const currentPhraseElement = document.getElementById('currentPhrase');
    const currentPhraseNumber = document.getElementById('currentPhraseNumber');
    const recordingsList = document.getElementById('recordingsList');

    const micPermissionModal = document.getElementById('micPermissionModal');
    const allowMicButton = document.getElementById('allowMicButton');

    // Variables d'état
    let isRecording = false;
    let currentExampleAudio = null;
    const phrases = [
        'Appel_(un de Nom votre choix)',
        'Decroche_Lappel',
        'Ouvre_Whatsap',
        'Ouvre_galerie'
    ];
    let currentPhraseIndex = 0;
    const recordings = new Map(); // Pour stocker les enregistrements

    // Afficher le modal de permission au démarrage
    micPermissionModal.style.display = 'block';

    // Gérer le clic sur le bouton d'autorisation
    allowMicButton.addEventListener('click', async () => {
        try {
            // Vérifier si c'est un iPhone/iPad
            const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            if (isiOS) {
                // Message spécifique pour iOS
                showMicStatus('⚠️ Sur iPhone : autorisez le microphone dans les paramètres du navigateur', true);
                
                // Ajouter des instructions pour iOS
                const iosInstructions = document.createElement('div');
                iosInstructions.className = 'ios-instructions';
                iosInstructions.innerHTML = `
                    <p>Sur iPhone/iPad :</p>
                    <ol>
                        <li>Cliquez sur "Autoriser" quand le navigateur demande l'accès</li>
                        <li>Si rien ne se passe, allez dans Réglages > Safari > Microphone</li>
                        <li>Activez l'accès pour ce site</li>
                        <li>Revenez et rafraîchissez la page</li>
                    </ol>
                    <button onclick="window.location.reload()" class="refresh-btn">
                        <i class="fas fa-sync"></i> Rafraîchir la page
                    </button>
                `;
                micPermissionModal.querySelector('.modal-body').appendChild(iosInstructions);
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 44100,
                    sampleSize: 16
                }
            });
            
            micPermissionModal.style.display = 'none';
            
            // Initialiser le recorder avec le stream
            const initialized = await audioRecorder.init();
            if (!initialized) {
                alert('Erreur d\'initialisation du microphone. Veuillez réessayer.');
            }

            showMicStatus('✅ Microphone activé');
        } catch (error) {
            console.error('Erreur d\'accès au microphone:', error);
            
            if (error.name === 'NotAllowedError') {
                showMicStatus('❌ Accès au microphone refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur', true);
            } else {
                showMicStatus('❌ Erreur d\'accès au microphone. Veuillez réessayer', true);
            }
        }
    });

    // Fonction pour afficher les messages de statut du microphone
    function showMicStatus(message, isError = false) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'mic-status';
        statusDiv.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
        statusDiv.style.padding = '15px';
        statusDiv.style.margin = '10px';
        statusDiv.style.borderRadius = '8px';
        statusDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        statusDiv.style.zIndex = '1000';
        statusDiv.style.position = 'fixed';
        statusDiv.style.top = '20px';
        statusDiv.style.left = '50%';
        statusDiv.style.transform = 'translateX(-50%)';
        statusDiv.style.maxWidth = '90%';
        statusDiv.style.width = 'auto';
        statusDiv.textContent = message;
        
        document.body.appendChild(statusDiv);
        
        // Laisser le message d'erreur plus longtemps visible
        setTimeout(() => {
            statusDiv.style.opacity = '0';
            setTimeout(() => statusDiv.remove(), 300);
        }, isError ? 6000 : 3000);
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
        updateSubmitButton();
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
        try {
            if (currentExampleAudio) {
                currentExampleAudio.pause();
                currentExampleAudio.currentTime = 0;
            }

            const currentPhrase = phrases[currentPhraseIndex];
            console.log('Playing example for:', currentPhrase); // Pour le débogage
            
            currentExampleAudio = await audioRecorder.playExample(currentPhrase);
            
            if (currentExampleAudio) {
                currentExampleAudio.onplay = () => {
                    playExampleBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                    audioProgress.style.width = '0%';
                };

                currentExampleAudio.onended = () => {
                    playExampleBtn.innerHTML = '<i class="fas fa-play"></i> Écouter l\'exemple';
                    audioProgress.style.width = '100%';
                };

                currentExampleAudio.ontimeupdate = () => {
                    const progress = (currentExampleAudio.currentTime / currentExampleAudio.duration) * 100;
                    audioProgress.style.width = `${progress}%`;
                };
            }
        } catch (error) {
            console.error('Erreur lors de la lecture de l\'exemple:', error);
            alert('Impossible de lire l\'exemple audio.');
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

    // Fonctions UI
    function updateUIForRecording(isRecording) {
        recordBtn.classList.toggle('recording', isRecording);
        recordBtn.innerHTML = isRecording ? 
            '<i class="fas fa-microphone-slash"></i>' : 
            '<i class="fas fa-microphone"></i>';
        
        stopBtn.disabled = !isRecording;
        playExampleBtn.disabled = isRecording;
        
        // Désactiver les sélecteurs pendant l'enregistrement
        ageSelect.disabled = isRecording;
        environmentSelect.disabled = isRecording;
    }

    // Gestion de la validation et de l'envoi
    submitBtn.addEventListener('click', async () => {
        if (recordings.size !== 4) return;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
            
            // Envoyer chaque enregistrement
            for (const [phrase, blob] of recordings) {
                const metadata = {
                    phrase: phrase,
                    ageRange: ageSelect.value,
                    environment: environmentSelect.value,
                    timestamp: new Date().toISOString()
                };

                await telegramService.sendAudioToTelegram(blob, metadata);
            }
            
            // Afficher le modal de remerciement
            showThankYouModal();
            
        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            alert('Une erreur est survenue lors de l\'envoi des enregistrements. Veuillez réessayer.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Valider et envoyer (4/4)';
        }
    });

    // Fonction pour afficher le modal de remerciement
    function showThankYouModal() {
        const modal = document.getElementById('thankYouModal');
        modal.style.display = 'block';
    }

    // Fonction pour fermer le modal de remerciement
    window.closeThankYouModal = function() {
        const modal = document.getElementById('thankYouModal');
        modal.style.display = 'none';
        // Recharger la page pour recommencer
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

    // Fonction de partage
    function shareToSocial(platform) {
        const shareText = "🎤 Participez à la création de SAGBO, le premier assistant vocal en langue Fon ! C'est rapide (12 secondes) et facile. Votre voix compte ! 🌍";
        const shareUrl = window.location.href;
        
        let shareLink;
        
        switch(platform) {
            case 'facebook':
                shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
                window.open(shareLink, '_blank', 'width=600,height=400');
                break;
            
            case 'whatsapp':
                shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
                window.open(shareLink, '_blank');
                break;
            
            case 'other':
                if (navigator.share) {
                    navigator.share({
                        title: 'SAGBO - Assistant Vocal Fon',
                        text: shareText,
                        url: shareUrl
                    }).catch(console.error);
                } else {
                    // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
                    const tempInput = document.createElement('input');
                    tempInput.value = shareUrl;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    alert('Lien copié dans le presse-papier !');
                }
                break;
        }
    }
});