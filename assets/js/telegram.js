class TelegramService {
    constructor() {
        // Le token de votre bot (à obtenir via @BotFather sur Telegram)
        this.BOT_TOKEN = '7892570628:AAFhbsYidVwBSeRKp1Taab1cTCEgmuIVjF8';
        
        // L'ID de votre canal (par exemple: '@MonCanal' ou '-100xxxxxxxxxxxx')
        // Pour un canal public, utilisez le format '@nomducanal'
        // Pour un canal privé, utilisez l'ID numérique que vous pouvez obtenir en transmettant un message 
        // du canal vers @getidsbot
        this.CHANNEL_ID = '@voicedataa'; // Remplacez par votre canal
    }

    async sendAudioToTelegram(audioBlob, metadata) {
        try {
            const formData = new FormData();
            
            // Création d'un nom de fichier unique
            const timestamp = new Date().getTime();
            const fileName = `audio_${metadata.phrase}_${timestamp}.wav`;
            const audioFile = new File([audioBlob], fileName, { type: 'audio/wav' });
            
            formData.append('audio', audioFile);
            formData.append('chat_id', this.CHANNEL_ID);
            
            // Message qui accompagnera l'audio
            const caption = `
🎤 Nouvel enregistrement Siri Fon

📝 Phrase: ${metadata.phrase}
👤 Âge: ${metadata.ageRange}
🌍 Environnement: ${metadata.environment}
⏰ ${new Date().toLocaleString('fr-FR')}
            `;
            
            formData.append('caption', caption);

            // Envoi à Telegram
            const response = await fetch(`https://api.telegram.org/bot${this.BOT_TOKEN}/sendAudio`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(`Erreur d'envoi: ${result.description}`);
            }

            return true;

        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            throw error;
        }
    }
}

// Instance globale
const telegramService = new TelegramService();