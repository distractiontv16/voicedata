class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.isPaused = false;
        this.maxDuration = 5000; // 5 secondes en millisecondes
        this.timer = null;
    }

    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            return true;
        } catch (error) {
            console.error('Erreur d\'initialisation du recorder:', error);
            return false;
        }
    }

    startRecording(onTimerUpdate, onRecordingComplete) {
        if (!this.mediaRecorder) {
            console.error('Le recorder n\'est pas initialisé');
            return false;
        }

        this.audioChunks = [];
        this.isRecording = true;
        this.isPaused = false;
        this.mediaRecorder.start(10); // Capture les données toutes les 10ms

        // Démarrer le timer
        let startTime = Date.now();
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                const elapsed = Date.now() - startTime;
                onTimerUpdate(elapsed);

                // Arrêter automatiquement après 5 secondes
                if (elapsed >= this.maxDuration) {
                    this.stopRecording(onRecordingComplete);
                }
            }
        }, 100);

        return true;
    }

    pauseRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.pause();
            this.isPaused = true;
        }
    }

    resumeRecording() {
        if (this.mediaRecorder && this.isRecording && this.isPaused) {
            this.mediaRecorder.resume();
            this.isPaused = false;
        }
    }

    async stopRecording(onComplete) {
        if (!this.mediaRecorder || !this.isRecording) {
            return null;
        }

        return new Promise((resolve) => {
            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                
                if (onComplete) {
                    onComplete(audioBlob);
                }
                
                resolve(audioBlob);
            };

            this.mediaRecorder.stop();
            this.isRecording = false;
            this.isPaused = false;
            clearInterval(this.timer);
        });
    }

    cancelRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.isPaused = false;
            this.audioChunks = [];
            clearInterval(this.timer);
        }
    }

    // Fonction pour jouer l'exemple audio
    async playExample(phrase) {
        try {
            const audio = new Audio(`assets/audio/${phrase}.wav`);
            await audio.play();
            return audio;
        } catch (error) {
            console.error('Erreur lors de la lecture de l\'exemple:', error);
            return null;
        }
    }

    // Convertir le blob en base64 pour l'envoi à Telegram
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Formater la durée pour l'affichage
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
    }
}

// Créer une instance globale du recorder
const audioRecorder = new AudioRecorder();