document.addEventListener('DOMContentLoaded', () => {
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

    // Ajouter un objet pour les instructions spécifiques
    const phraseInstructions = {
        'Appel_(un de Nom votre choix)': '📢 Instructions : Placez le micro près de votre bouche (15-20cm). Utilisez un ton naturel et prononcez clairement un nom de votre choix (ex: Koffi, Jacques...)',
        'Decroche_Lappel': '📢 Instructions : Soyez précis et clair ! Dites naturellement "décroche l\'appel" en Fon comme dans l\'exemple.',
        'Ouvre_Whatsap': '📢 Instructions : Gardez une distance de 35cm entre vous et le micro. Prononcez "ouvre WhatsApp" en Fon avec un ton commandant mais votre ton naturel ',
        'Ouvre_galerie': '📢 Instructions : Faites une brève pause avant de prononcer "galerie". Dites "ouvre la galerie" en Fon comme si vous parliez à un assistant vocal'
    };

    // Fonction de gestion de la permission du microphone
    async function handleMicrophonePermission() {
        const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const modalContent = micPermissionModal.querySelector('.modal-content');

        if (isiOS) {
            modalContent.innerHTML = `
                <h2 style="color: #6200ee; font-size: 1.8rem; margin-bottom: 20px;">
                    🎤 Instructions pour iPhone/iPad
                </h2>
                <div class="modal-body ios-permission-instructions">
                    <p style="font-size: 1.2rem; font-weight: bold; color: #333; margin-bottom: 20px;">
                        Pour activer le microphone sur iOS :
                    </p>
                    <ol class="ios-permission-steps">
                        <li>
                            <span class="ios-step-number">1</span>
                            <strong>Appuyez sur le bouton "Autoriser"</strong> quand il apparaît
                        </li>
                        <li>
                            <span class="ios-step-number">2</span>
                            Si rien ne se passe, suivez ces étapes :
                            <ol class="ios-permission-substeps">
                                <li>Ouvrez les <strong>Réglages</strong> de votre iPhone</li>
                                <li>Faites défiler jusqu'à <strong>Safari</strong></li>
                                <li>Appuyez sur <strong>Réglages du site</strong></li>
                                <li>Trouvez <strong>Microphone</strong></li>
                                <li>Sélectionnez <strong>Autoriser</strong></li>
                            </ol>
                        </li>
                        <li>
                            <span class="ios-step-number">3</span>
                            Revenez à cette page et appuyez sur <strong>Recharger</strong>
                        </li>
                    </ol>
                    <div class="ios-button-container">
                        <button id="allowMicButton" class="ios-primary-btn">
                            <i class="fas fa-microphone"></i> Autoriser le microphone
                        </button>
                        <button class="ios-refresh-btn" onclick="window.location.reload()">
                            <i class="fas fa-sync"></i> Recharger la page
                        </button>
                    </div>
                </div>
            `;
        }

        const allowMicButton = document.getElementById('allowMicButton');
        allowMicButton.addEventListener('click', async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const initialized = await audioRecorder.init();
                
                if (initialized) {
                    micPermissionModal.style.display = 'none';
                    showMicStatus('✅ Microphone activé et prêt à enregistrer');
                } else {
                    throw new Error('Échec de l\'initialisation');
                }
            } catch (error) {
                console.error('Erreur d\'accès au microphone:', error);
                
                if (isiOS) {
                    showMicStatus('⚠️ Veuillez vérifier les permissions du microphone dans les réglages Safari', true);
                } else {
                    showMicStatus('❌ Erreur d\'accès au microphone. Veuillez réessayer', true);
                }
            }
        });
    }

    // Afficher le modal de permission au démarrage
    micPermissionModal.style.display = 'block';
    handleMicrophonePermission();

    // Ajouter le CSS correspondant
    const style = document.createElement('style');
    style.textContent = `
        .ios-permission-instructions {
            background-color: #ffffff;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .ios-permission-steps {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .ios-permission-steps > li {
            margin: 25px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 10px;
            position: relative;
            font-size: 1.1rem;
            line-height: 1.6;
        }

        .ios-step-number {
            background-color: #6200ee;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-right: 10px;
            font-weight: bold;
        }

        .ios-permission-substeps {
            margin: 15px 0 15px 35px;
            padding: 15px;
            background-color: #fff;
            border-radius: 8px;
            border-left: 3px solid #6200ee;
        }

        .ios-permission-substeps li {
            margin: 12px 0;
            color: #333;
            font-size: 1rem;
        }

        .ios-button-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 25px;
        }

        .ios-primary-btn {
            background-color: #6200ee;
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.3s;
        }

        .ios-primary-btn:hover {
            background-color: #5000ca;
        }

        .ios-refresh-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.3s;
        }

        .ios-refresh-btn:hover {
            background-color: #45a049;
        }

        @media (max-width: 768px) {
            .ios-permission-instructions {
                padding: 15px;
                margin: 10px 0;
            }

            .ios-permission-steps > li {
                font-size: 1rem;
                padding: 12px;
            }

            .ios-permission-substeps {
                margin-left: 25px;
                padding: 12px;
            }

            .ios-permission-substeps li {
                font-size: 0.95rem;
            }
        }
    `;
    document.head.appendChild(style);

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
            setTimeout(() => statusDiv.remove(), 3000);
        }, isError ? 6000 : 3000);
    }

    // Gérer la fermeture de la page
    window.addEventListener('beforeunload', () => {
        if (audioRecorder.mediaRecorder && audioRecorder.mediaRecorder.stream) {
            audioRecorder.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            showMicStatus('🎤 Microphone désactivé');
        }
    });

    // Modifier la fonction updateCurrentPhrase pour inclure les instructions spécifiques
    function updateCurrentPhrase() {
        const currentPhrase = phrases[currentPhraseIndex];
        currentPhraseElement.textContent = currentPhrase;
        currentPhraseNumber.textContent = (currentPhraseIndex + 1).toString();
        
        // Mettre à jour les instructions spécifiques
        const instructionsElement = document.querySelector('.recording-instructions');
        instructionsElement.textContent = phraseInstructions[currentPhrase];
        
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
            
            // Revenir à la phrase correspondante
            currentPhraseIndex = phrases.indexOf(phrase);
            updateCurrentPhrase();
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
            const started = await audioRecorder.startRecording(
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