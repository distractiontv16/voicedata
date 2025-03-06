class TelegramService {
    constructor() {
        // Le token de votre bot (à obtenir via @BotFather sur Telegram)
        this.BOT_TOKEN = '8180592246:AAGk3-NhJbtCf4dsCmgabEfj2gJAVVt-Kls';
        
        // Remplacer @voicedataa par l'ID numérique du canal
        // L'ID doit commencer par -100 pour les canaux
        this.CHANNEL_ID = '-1002294990066'; // Remplacez par l'ID de votre canal
    }

    async sendAudioToTelegram(audioBlob, metadata) {
        try {
            console.log('Début de l\'envoi à Telegram:', metadata);
            const formData = new FormData();
            
            // Création d'un nom de fichier formaté
            const phraseNumber = {
                'Appel_(un de Nom votre choix)': '01',
                'Decroche_Lappel': '02',
                'Ouvre_Whatsap': '03',
                'Ouvre_galerie': '04'
            };
            
            // Format: 01-Appel_Nom-21-30-Calme.wav
            const fileName = `${phraseNumber[metadata.phrase]}-${metadata.phrase}-${metadata.ageRange}-${metadata.environment}.wav`;
            
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
            console.log('Envoi de la requête à Telegram...');
            const response = await fetch(`https://api.telegram.org/bot${this.BOT_TOKEN}/sendAudio`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Réponse de Telegram:', result);

            if (!result.ok) {
                console.error('Erreur Telegram:', result);
                throw new Error(`Erreur d'envoi: ${result.description}`);
            }

            // Notifier le bot de transfert
            await transferBot.handleNewAudio(result.result.message_id);
            return true;

        } catch (error) {
            console.error('Erreur détaillée lors de l\'envoi:', error);
            throw error;
        }
    }
}

// Instance globale
const telegramService = new TelegramService();
