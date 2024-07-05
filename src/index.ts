const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const express = require("express");
const app = express();
const axios = require("axios");
const cron = require("node-cron");
const { Telegraf, Context } = require("telegraf");
const { co2 } = require("@tgwf/co2");
const oneByte = new co2({ model: "1byte" });
const swd = new co2({ model: "swd" });
const bot = new Telegraf(process.env.BOT_TOKEN);
console.log("Bot is running... new");
console.log("bot", bot);

import { calculateMessageSizeKB } from "./utils/getKbSize";
import { GroupStats, ReportPayload } from "./types/types";
import { getParticipantsCount } from "./utils/getMemberCount";
import { getTypemessages } from "./utils/getTypeMessage";
// import { constants } from "buffer";

console.log("Bot is running... emission text patch");

let groupStats: Record<string, GroupStats> = {};
let groupLimitGeneric: Record<string, number> = {};

const bodyParser = require("body-parser");

app.use(bodyParser.json());

const initializeGroupStats = (chatId: string) => {
  groupStats[chatId] = {
    totalMessages: 0,
    totalSizeKB: 0,
    textTotalMessages: 0,
    textTotalSize: 0,
    photoTotalMessages: 0,
    photoTotalSize: 0,
    videoTotalMessages: 0,
    videoTotalSize: 0,
    documentTotalMessages: 0,
    documentTotalSize: 0,
    pollTotalMessages: 0,
    pollTotalSize: 0,
    stickerTotalMessages: 0,
    stickerTotalSize: 0,
    voiceTotalMessages: 0,
    voiceTotalSize: 0,
  };
};

bot.start((ctx: { reply: (arg0: string) => any }) =>
  ctx.reply("Benvenuto a te! Usa /help per visualizzare l'elenco dei comandi.")
);

bot.help((ctx: { reply: (arg0: string) => any }) =>
  ctx.reply(
    "Elenco dei comandi disponibili:\n/help - Mostra l'elenco dei comandi disponibili\n/stats - Visualizza le statistiche del gruppo\n/get_admins - Indica gli admin del gruppo\n/start - Saluta il bot\n/limits - Mostra il limite di dimensione impostato per il gruppo"
  )
);

const isTextualMessage = (message: any): boolean => {
  if (message.text || message.caption) {
    return true;
  }
  return false;
};

// Function to check if the bot is still an administrator
const isBotAdmin = async (ctx: typeof Context): Promise<boolean> => {
  try {
    const administrators = await ctx.telegram.getChatAdministrators(
      ctx.message?.chat?.id
    );
    const botId = ctx.botInfo.id;
    return administrators.some(
      (admin: { user: { id: any } }) => admin.user.id === botId
    );
  } catch (error) {
    console.error("Errore durante il recupero degli amministratori:", error);
    return false;
  }
};

bot.command("limits", (ctx: typeof Context) => {
  const chatId = ctx.message?.chat?.id;
  const genericLimit = groupLimitGeneric[chatId];

  if (!genericLimit) {
    ctx.reply("Non ci sono limiti impostati per questo gruppo.");
  } else {
    ctx.reply(`Limite generico: ${genericLimit} KB`);
  }
});

bot.command("stats", (ctx: typeof Context) => {
  const chatId = ctx.message?.chat?.id;
  if (chatId && groupStats[chatId]) {
    const stats = groupStats[chatId];
    ctx.reply(
      `Statistiche del gruppo - ultimo frame:\nMessaggi totali: ${
        stats.totalMessages
      }\nDimensione totale: ${stats.totalSizeKB.toFixed(3)} KB`
    );
  } else {
    ctx.reply("Non ci sono statistiche disponibili per questo gruppo.");
  }
});

bot.command("get_admins", async (ctx: typeof Context) => {
  const chatId = ctx.message.chat.id;
  try {
    const admins = await ctx.telegram.getChatAdministrators(chatId);
    ctx.reply(
      `Gli amministratori del gruppo sono: ${admins
        .map((admin: { user: { username: any } }) => admin.user.username)
        .join(", ")}`
    );
  } catch (error) {
    console.error("Errore durante il recupero degli amministratori:", error);
    ctx.reply(
      "Si è verificato un errore durante il recupero degli amministratori."
    );
  }
});

// Middleware per gestire i messaggi in arrivo
bot.on("message", async (ctx: typeof Context, next: () => void) => {
  const chatId = ctx.message?.chat?.id;
  const chatType = ctx.message?.chat?.type;

  if (!groupStats[chatId as string] && chatType === "supergroup") {
    initializeGroupStats(chatId as string);
  }

  const isAdmin = await isBotAdmin(ctx);

  if (isAdmin && groupStats[chatId as string]) {
    const messageSizeKB = parseFloat(
      calculateMessageSizeKB(ctx.message).toString()
    );

    const typeOfMessage = getTypemessages(ctx.message);

    // Aggiornamento dei contatori
    updateStats(chatId as string, messageSizeKB, typeOfMessage);

    const genericLimitReached =
      groupLimitGeneric[chatId as string] &&
      messageSizeKB > groupLimitGeneric[chatId as string];

    // Check if generic limit is reached and delete message if necessary
    if (genericLimitReached) {
      ctx.deleteMessage();
      ctx.reply(
        `Il messaggio è stato rimosso perché supera il limite di dimensione generico di ${groupLimitGeneric[chatId]} impostato per il gruppo.`
      );
    }
  } else {
    console.log(`Il bot con ID ${bot.botInfo.id} non è più un amministratore.`);
  }

  next();
});

// Funzione per aggiornare i contatori totalMessages e totalSizeKB
const updateStats = (
  chatId: string,
  messageSizeKB: number,
  typeOfMessage: string
) => {
  if (groupStats[chatId]) {
    groupStats[chatId].totalMessages++;
    groupStats[chatId].totalSizeKB += messageSizeKB;
    if (typeOfMessage === "text") {
      groupStats[chatId].textTotalMessages++;
      groupStats[chatId].textTotalSize += messageSizeKB;
    }
    if (typeOfMessage === "photo") {
      groupStats[chatId].photoTotalMessages++;
      groupStats[chatId].photoTotalSize += messageSizeKB;
    }
    if (typeOfMessage === "video") {
      groupStats[chatId].videoTotalMessages++;
      groupStats[chatId].videoTotalSize += messageSizeKB;
    }
    if (typeOfMessage === "document") {
      groupStats[chatId].documentTotalMessages++;
      groupStats[chatId].documentTotalSize += messageSizeKB;
    }
    if (typeOfMessage === "poll") {
      groupStats[chatId].pollTotalMessages++;
      groupStats[chatId].pollTotalSize += messageSizeKB;
    }
    if (typeOfMessage === "sticker") {
      groupStats[chatId].stickerTotalMessages++;
      groupStats[chatId].stickerTotalSize += messageSizeKB;
    }
  }
};

bot.launch();

app.get("/test", (_req: any, res: any) => {
  console.log("test endpoint hit! wsb81");
  res.status(200).json({
    success: "Server is running and bot is active .",
  });
});

app.post("/groupLimitGeneric", (req: any, res: any) => {
  const { chatId, limit } = req.body;
  if (!chatId || !limit) {
    return res.status(400).json({ error: "chatId e limit sono richiesti." });
  }

  groupLimitGeneric[chatId] = limit;
  res.status(200).json({
    success: `Limite generico impostato per il gruppo ${chatId}: ${limit} KB`,
  });
});

app.delete("/groupLimitGeneric/:chatId", (req: any, res: any) => {
  const { chatId } = req.params;

  if (!groupLimitGeneric[chatId]) {
    return res.status(404).json({
      error: "Limite generico non trovato per il gruppo specificato.",
    });
  }

  delete groupLimitGeneric[chatId];
  res.status(200).json({
    success: `Limite generico rimosso per il gruppo ${chatId}`,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  cron.schedule("0 * * * *", () => {
    console.log("Esecuzione del job di invio report ogni ora!");
    if (Object.keys(groupStats).length > 0) {
      sendReport();
      groupStats = {}; // Clear the object after sending report
    } else {
      console.log("Nessun dato da inviare.");
    }
  });
});

let endPoint = "http://localhost:3005";
if (process.env.ENVIRONMENT === "production") {
  endPoint = process.env.REPORT_ENDPOINT || "";
}
console.log("Endpoint:", endPoint);
const finalEndPoint = endPoint + "/api/v1/reports";

const sendEmptyReport = async (chatId: string | undefined, chatInfo: any) => {
  if (!chatId) {
    console.error("Chat ID mancante.");
    return;
  }

  try {
    const payload: ReportPayload = {
      groupId: chatId,
      totalMessages: 0,
      totalSizeKB: 0,
      emissionsOneByteMethod: 0,
      emissionsSWDMethod: 0,
      textTotalMessages: 0,
      textTotalSize: 0,
      textEmissionsOneByteMethod: 0,
      textEmissionsSWDMethod: 0,
      photoTotalMessages: 0,
      photoTotalSize: 0,
      photoEmissionsOneByteMethod: 0,
      photoEmissionsSWDMethod: 0,
      videoTotalMessages: 0,
      videoTotalSize: 0,
      videoEmissionsOneByteMethod: 0,
      videoEmissionsSWDMethod: 0,
      voiceTotalMessages: 0,
      voiceTotalSize: 0,
      voiceEmissionsOneByteMethod: 0,
      voiceEmissionsSWDMethod: 0,
      documentTotalMessages: 0,
      documentTotalSize: 0,
      documentEmissionsOneByteMethod: 0,
      documentEmissionsSWDMethod: 0,
      pollTotalMessages: 0,
      pollTotalSize: 0,
      pollEmissionsOneByteMethod: 0,
      pollEmissionsSWDMethod: 0,
      stickerTotalMessages: 0,
      stickerTotalSize: 0,
      stickerEmissionsOneByteMethod: 0,
      stickerEmissionsSWDMethod: 0,
      groupName: chatInfo.title,
      participantsCount: chatInfo.membersCount,
      adminNames: [], // Campi adminNames vuoti nel report vuoto
    };

    const response = await axios.post(finalEndPoint, payload as ReportPayload, {
      headers: {
        "Content-Type": "application/json",
        Origin: "supersegretissimo", // Replace with your bot's origin
      },
    });
  } catch (error) {
    console.log("Errore durante l'invio del report vuoto:", error);
  }
};

const getAdminNames = async (chatId: string) => {
  try {
    const admins = await bot.telegram.getChatAdministrators(chatId);
    return admins.map(
      (admin: { user: { username: any } }) => admin.user.username
    );
  } catch (error) {
    console.error("Errore durante il recupero degli amministratori:", error);
    return [];
  }
};

const sendReport = async () => {
  for (const [chatId, stats] of Object.entries(groupStats)) {
    const totalSizeBytes = stats.totalSizeKB * 1024;
    const textTotalSizeBytes = stats.textTotalSize * 1024;
    const photoTotalSizeBytes = stats.photoTotalSize * 1024;
    const videoTotalSizeBytes = stats.videoTotalSize * 1024;
    const documentTotalSizeBytes = stats.documentTotalSize * 1024;
    const voiceTotalSizeBytes = stats.voiceTotalSize * 1024;
    const stickerTotalSizeBytes = stats.stickerTotalSize * 1024;
    const emissionsOneByteMethod = oneByte.perByte(totalSizeBytes).toFixed(7);
    const emissionsSWDMethod = swd.perByte(totalSizeBytes).toFixed(7);
    const textEmissionsOneByteMethod = oneByte
      .perByte(textTotalSizeBytes)
      .toFixed(7);
    const textEmissionsSWDMethod = swd.perByte(textTotalSizeBytes).toFixed(7);
    const photoEmissionsOneByteMethod = oneByte
      .perByte(photoTotalSizeBytes)
      .toFixed(7);
    const photoEmissionsSWDMethod = swd.perByte(photoTotalSizeBytes).toFixed(7);
    const videoEmissionsOneByteMethod = oneByte
      .perByte(videoTotalSizeBytes)
      .toFixed(7);
    const videoEmissionsSWDMethod = swd.perByte(videoTotalSizeBytes).toFixed(7);
    const documentEmissionsOneByteMethod = oneByte
      .perByte(documentTotalSizeBytes)
      .toFixed(7);
    const documentEmissionsSWDMethod = swd
      .perByte(documentTotalSizeBytes)
      .toFixed(7);
    const voiceEmissionsOneByteMethod = oneByte
      .perByte(voiceTotalSizeBytes)
      .toFixed(7);
    const voiceEmissionsSWDMethod = swd.perByte(voiceTotalSizeBytes).toFixed(7);
    const stickerEmissionsOneByteMethod = oneByte
      .perByte(stickerTotalSizeBytes)
      .toFixed(7);
    const stickerEmissionsSWDMethod = swd
      .perByte(stickerTotalSizeBytes)
      .toFixed(7);
    const pollEmissionsOneByteMethod = oneByte.perByte(0).toFixed(7);
    const pollEmissionsSWDMethod = swd.perByte(0).toFixed(7);

    // Ottieni il numero di partecipanti del gruppo
    const participantsCount = await getParticipantsCount(chatId);

    // Ottieni i nomi degli amministratori del gruppo
    const adminNames = await getAdminNames(chatId);
    console.log(adminNames, "adminNames ********************");

    // Verifica se ci sono stati messaggi nel lasso di tempo del report
    let totalMessages = stats.totalMessages || 0;
    let totalSizeKB = stats.totalSizeKB || 0;
    let emissionsOneByte = isNaN(parseFloat(emissionsOneByteMethod))
      ? 0
      : parseFloat(emissionsOneByteMethod);
    let emissionsSWD = isNaN(parseFloat(emissionsSWDMethod))
      ? 0
      : parseFloat(emissionsSWDMethod);

    let textTotalMessages = stats.textTotalMessages || 0;
    let textTotalSize = stats.textTotalSize || 0;
    let textEmissionsOneByte = isNaN(parseFloat(textEmissionsOneByteMethod))
      ? 0
      : parseFloat(textEmissionsOneByteMethod);
    let textEmissionsSWD = isNaN(parseFloat(textEmissionsSWDMethod))
      ? 0
      : parseFloat(textEmissionsSWDMethod);

    let photoTotalMessages = stats.photoTotalMessages || 0;
    let photoTotalSize = stats.photoTotalSize || 0;
    let photoEmissionsOneByte = isNaN(parseFloat(photoEmissionsOneByteMethod))
      ? 0
      : parseFloat(photoEmissionsOneByteMethod);
    let photoEmissionsSWD = isNaN(parseFloat(photoEmissionsSWDMethod))
      ? 0
      : parseFloat(photoEmissionsSWDMethod);

    let videoTotalMessages = stats.videoTotalMessages || 0;
    let videoTotalSize = stats.videoTotalSize || 0;
    let videoEmissionsOneByte = isNaN(parseFloat(videoEmissionsOneByteMethod))
      ? 0
      : parseFloat(videoEmissionsOneByteMethod);
    let videoEmissionsSWD = isNaN(parseFloat(videoEmissionsSWDMethod))
      ? 0
      : parseFloat(videoEmissionsSWDMethod);

    let documentTotalMessages = stats.documentTotalMessages || 0;
    let documentTotalSize = stats.documentTotalSize || 0;
    let documentEmissionsOneByte = isNaN(
      parseFloat(documentEmissionsOneByteMethod)
    )
      ? 0
      : parseFloat(documentEmissionsOneByteMethod);
    let documentEmissionsSWD = isNaN(parseFloat(documentEmissionsSWDMethod))
      ? 0
      : parseFloat(documentEmissionsSWDMethod);

    let pollTotalMessages = stats.pollTotalMessages || 0;
    let pollTotalSize = stats.pollTotalSize || 0;
    let pollEmissionsOneByte = isNaN(parseFloat(pollEmissionsOneByteMethod))
      ? 0
      : parseFloat(pollEmissionsOneByteMethod);
    let pollEmissionsSWD = isNaN(parseFloat(pollEmissionsSWDMethod))
      ? 0
      : parseFloat(pollEmissionsSWDMethod);

    let stickerTotalMessages = stats.stickerTotalMessages || 0;
    let stickerTotalSize = stats.stickerTotalSize || 0;
    let stickerEmissionsOneByte = isNaN(
      parseFloat(stickerEmissionsOneByteMethod)
    )
      ? 0
      : parseFloat(stickerEmissionsOneByteMethod);
    let stickerEmissionsSWD = isNaN(parseFloat(stickerEmissionsSWDMethod))
      ? 0
      : parseFloat(stickerEmissionsSWDMethod);

    let voiceTotalMessages = stats.voiceTotalMessages || 0;
    let voiceTotalSize = stats.voiceTotalSize || 0;
    let voiceEmissionsOneByte = isNaN(parseFloat(voiceEmissionsOneByteMethod))
      ? 0
      : parseFloat(voiceEmissionsOneByteMethod);
    let voiceEmissionsSWD = isNaN(parseFloat(voiceEmissionsSWDMethod))
      ? 0
      : parseFloat(voiceEmissionsSWDMethod);

    try {
      const chatInfo = await bot.telegram.getChat(chatId);

      const payload: ReportPayload = {
        groupId: chatId,
        totalMessages,
        totalSizeKB,
        emissionsOneByteMethod: emissionsOneByte,
        emissionsSWDMethod: emissionsSWD,
        textTotalMessages,
        textTotalSize,
        textEmissionsOneByteMethod: textEmissionsOneByte,
        textEmissionsSWDMethod: textEmissionsSWD,
        photoTotalMessages,
        photoTotalSize,
        photoEmissionsOneByteMethod: photoEmissionsOneByte,
        photoEmissionsSWDMethod: photoEmissionsSWD,
        videoTotalMessages,
        videoTotalSize,
        videoEmissionsOneByteMethod: videoEmissionsOneByte,
        videoEmissionsSWDMethod: videoEmissionsSWD,
        voiceTotalMessages: voiceTotalMessages,
        voiceTotalSize: voiceTotalSize,
        voiceEmissionsOneByteMethod: voiceEmissionsOneByte,
        voiceEmissionsSWDMethod: voiceEmissionsSWD,
        documentTotalMessages,
        documentTotalSize,
        documentEmissionsOneByteMethod: documentEmissionsOneByte,
        documentEmissionsSWDMethod: documentEmissionsSWD,
        pollTotalMessages,
        pollTotalSize,
        pollEmissionsOneByteMethod: pollEmissionsOneByte,
        pollEmissionsSWDMethod: pollEmissionsSWD,
        stickerTotalMessages,
        stickerTotalSize,
        stickerEmissionsOneByteMethod: stickerEmissionsOneByte,
        stickerEmissionsSWDMethod: stickerEmissionsSWD,
        groupName: chatInfo.title,
        participantsCount, // Aggiungi il numero di partecipanti al payload
        adminNames, // Aggiungi i nomi degli amministratori al payload
      };
      console.log(
        payload,
        "payload **********************************************************+"
      );
      const response = await axios.post(
        finalEndPoint,
        payload as ReportPayload, // Specifica il tipo di payload come ReportPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Custom-Origin": "supersegretissimo", // Intestazione personalizzata
          },
        }
      );

      // Azzeriamo solo i contatori dopo l'invio del report
      groupStats[chatId] = {
        totalMessages: 0,
        totalSizeKB: 0,
        textTotalMessages: 0,
        textTotalSize: 0,
        photoTotalMessages: 0,
        photoTotalSize: 0,
        videoTotalMessages: 0,
        videoTotalSize: 0,
        voiceTotalMessages: 0,
        voiceTotalSize: 0,
        documentTotalMessages: 0,
        documentTotalSize: 0,
        pollTotalMessages: 0,
        pollTotalSize: 0,
        stickerTotalMessages: 0,
        stickerTotalSize: 0,
      };
    } catch (error) {
      if ((error as any).response && (error as any).response.status === 403) {
        console.error(
          "Il bot non può inviare messaggi al gruppo. È stato rimosso?"
        );
      } else {
        console.error("Errore durante l'invio del report:", error);
      }
    }
  }

  // Se non ci sono messaggi in nessun gruppo, invia report vuoto per ogni gruppo
  if (Object.keys(groupStats).length === 0) {
    const allChats = await bot.telegram.getMyCommands();
    for (const chat of allChats) {
      const chatId = chat.chat.id;
      const chatInfo = await bot.telegram.getChat(chatId);
      await sendEmptyReport(chatId, chatInfo);
    }
  }
};
