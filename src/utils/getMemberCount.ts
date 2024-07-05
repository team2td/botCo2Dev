const axios = require("axios");
export const getParticipantsCount = async (chatId: string) => {
  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMembersCount?chat_id=${chatId}`
    );

    // console.log("Risposta dal recupero del numero di partecipanti:", response);
    return response.data.result;
  } catch (error) {
    console.error(
      "Errore durante il recupero del numero di partecipanti:",
      error
    );
    return null;
  }
};
