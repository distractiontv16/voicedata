class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.isPaused = false;
        this.maxDuration = 3150; // 3 secondes
        this.timer = null;
        this.stream = null;
    }

    async init() {
        try {
            // Vérifier si c'est un iPhone/iPad
            const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            // Configuration spécifique pour iOS
            const constraints = {
                audio: isiOS ? true : {
                    channelCount: 1,
                    sampleRate: 44100,
                    sampleSize: 16
                }
            };

            // Obtenir le flux audio
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Configuration spécifique pour iOS
            if (isiOS) {
                this.mediaRecorder = new MediaRecorder(this.stream);
            } else {
                this.mediaRecorder = new MediaRecorder(this.stream, {
                    mimeType: 'audio/webm;codecs=opus',
                    audioBitsPerSecond: 128000
                });
            }
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // Vérifier si le MediaRecorder est bien initialisé
            if (!this.mediaRecorder) {
                throw new Error('MediaRecorder non initialisé');
            }

            return true;
        } catch (error) {
            console.error('Erreur détaillée d\'initialisation:', error);
            
            // Nettoyer le stream si une erreur survient
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            
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
        
        // Demander des données plus fréquemment
        this.mediaRecorder.start(100); // Capture toutes les 100ms

        // Démarrer le timer
        let startTime = Date.now();
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                const elapsed = Date.now() - startTime;
                onTimerUpdate(elapsed);

                // Arrêter automatiquement après 3 secondes
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
                // Convertir en WAV avec la bonne durée
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                
                // Convertir WebM en WAV
                const wavBlob = await this.convertToWAV(audioBlob);
                
                if (onComplete) {
                    onComplete(wavBlob);
                }
                
                resolve(wavBlob);
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

    // Nouvelle méthode pour convertir en WAV
    async convertToWAV(webmBlob) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await webmBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const numberOfChannels = 1;
        const length = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;
        const wavBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);
        
        // Copier les données audio
        const channelData = audioBuffer.getChannelData(0);
        wavBuffer.copyToChannel(channelData, 0);
        
        // Convertir en WAV
        const wavBlob = await this.bufferToWAV(wavBuffer);
        return wavBlob;
    }

    // Méthode pour créer un fichier WAV
    bufferToWAV(buffer) {
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numberOfChannels * bytesPerSample;
        
        const wavBuffer = new ArrayBuffer(44 + buffer.length * bytesPerSample);
        const view = new DataView(wavBuffer);
        
        // WAV Header
        const writeString = (view, offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + buffer.length * bytesPerSample, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(view, 36, 'data');
        view.setUint32(40, buffer.length * bytesPerSample, true);
        
        const samples = new Float32Array(buffer.length);
        buffer.copyFromChannel(samples, 0, 0);
        
        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            const sample = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
        
        return new Blob([wavBuffer], { type: 'audio/wav' });
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