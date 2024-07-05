export const calculateMessageSizeKB = (message: any) => {
  // Controlla se il messaggio è una migrazione da un altro chat
  if (message.migrate_to_chat_id || message.migrate_from_chat_id) {
    return 0; // Ignora i messaggi di migrazione
  }

  // Controlla il tipo di messaggio
  if (message.text) {
    const messageSizeBytes = Buffer.byteLength(message.text, "utf8");
    return (messageSizeBytes / 1024).toFixed(3);
  } else if (message.photo) {
    const photoSizeBytes = message.photo[message.photo.length - 1].file_size;
    return (photoSizeBytes / 1024).toFixed(3);
  } else if (message.voice) {
    const voiceSizeBytes = message.voice.file_size;
    return (voiceSizeBytes / 1024).toFixed(3);
  } else if (message.video) {
    const videoSizeBytes = message.video.file_size;
    return (videoSizeBytes / 1024).toFixed(3);
  } else if (message.document) {
    const documentSizeBytes = message.document.file_size;
    return (documentSizeBytes / 1024).toFixed(3);
  } else if (message.poll) {
    // Gestisci i messaggi di tipo poll
    return "2.5"; // Imposta un valore minimo per i poll (2.5 KB, media tra 2 e 5 KB)
  } else if (message.sticker) {
    // Gestisci i messaggi di tipo sticker
    return "25"; // Imposta un valore fisso per gli sticker (25 KB, media tra 20 e 30 KB)
  } else {
    return "Tipo di messaggio non supportato";
  }
};
