class TelegramTransferBot {
    constructor() {
        // Configuration du bot
        this.BOT_TOKEN = '7768723582:AAGxjrD2zpj0fV_ulMVO8IXOz2ZQkYG49gI';
        this.SOURCE_CHANNEL_ID = '-1002294990066'; // Canal source actuel
        this.TARGET_CHANNEL_ID = '-1002224708044'; // Nouveau canal destination
        
        // Compteur et stockage
        this.audioCount = 0;
        this.audioMessages = [];
        this.BATCH_SIZE = 16; // Nombre de vocaux avant transfert
    }

    async initialize() {
        try {
            // Vérifier la connexion du bot
            const response = await fetch(`https://api.telegram.org/bot${this.BOT_TOKEN}/getMe`);
            const data = await response.json();
            
            if (data.ok) {
                console.log('Bot initialisé avec succès:', data.result.username);
                return true;
            } else {
                console.error('Erreur d\'initialisation du bot:', data.description);
                return false;
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            return false;
        }
    }

    // Cette méthode sera appelée à chaque nouveau message vocal reçu
    async handleNewAudio(messageId) {
        this.audioMessages.push(messageId);
        this.audioCount++;

        console.log(`Audio reçu. Total: ${this.audioCount}/${this.BATCH_SIZE}`);

        if (this.audioCount >= this.BATCH_SIZE) {
            await this.transferBatch();
        }
    }

    async transferBatch() {
        try {
            console.log('Début du transfert du lot...');
            
            for (const messageId of this.audioMessages) {
                await this.forwardMessage(messageId);
            }

            // Réinitialiser après transfert réussi
            this.audioCount = 0;
            this.audioMessages = [];
            
            console.log('Transfert du lot terminé avec succès');
        } catch (error) {
            console.error('Erreur lors du transfert du lot:', error);
        }
    }

    async forwardMessage(messageId) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${this.BOT_TOKEN}/forwardMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.TARGET_CHANNEL_ID,
                    from_chat_id: this.SOURCE_CHANNEL_ID,
                    message_id: messageId
                })
            });

            const data = await response.json();
            
            if (!data.ok) {
                console.error('Erreur lors du transfert:', data.description);
                return false;
            }

            console.log(`Message ${messageId} transféré avec succès`);
            return true;

        } catch (error) {
            console.error('Erreur lors du transfert du message:', error);
            return false;
        }
    }
}

// Instance globale
const transferBot = new TelegramTransferBot();

// Initialisation du bot au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    await transferBot.initialize();
});
