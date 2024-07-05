export const getTypemessages = (message: any) => {
  // Controlla se il messaggio è una migrazione da un altro chat
  if (message.migrate_to_chat_id || message.migrate_from_chat_id) {
    return ""; // Ignora i messaggi di migrazione
  }

  // Controlla il tipo di messaggio
  if (message.text) {
    return "text";
  } else if (message.photo) {
    return "photo";
  } else if (message.voice) {
    return "voice";
  } else if (message.video) {
    return "video";
  } else if (message.document) {
    return "document";
  } else if (message.poll) {
    // Gestisci i messaggi di tipo poll
    return "poll"; // Imposta un valore minimo per i poll (2.5 KB, media tra 2 e 5 KB)
  } else if (message.sticker) {
    // Gestisci i messaggi di tipo sticker
    return "sticker"; // Imposta un valore fisso per gli sticker (25 KB, media tra 20 e 30 KB)
  } else {
    return "Tipo di messaggio non supportato";
  }
};
