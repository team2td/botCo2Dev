"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const getKbSize_1 = require("./utils/getKbSize");
const getMemberCount_1 = require("./utils/getMemberCount");
const getTypeMessage_1 = require("./utils/getTypeMessage");
// import { constants } from "buffer";
console.log("Bot is running... emission text patch");
let groupStats = {};
let groupLimitGeneric = {};
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const initializeGroupStats = (chatId) => {
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
bot.start((ctx) => ctx.reply("Benvenuto a te! Usa /help per visualizzare l'elenco dei comandi."));
bot.help((ctx) => ctx.reply("Elenco dei comandi disponibili:\n/help - Mostra l'elenco dei comandi disponibili\n/stats - Visualizza le statistiche del gruppo\n/get_admins - Indica gli admin del gruppo\n/start - Saluta il bot\n/limits - Mostra il limite di dimensione impostato per il gruppo"));
const isTextualMessage = (message) => {
    if (message.text || message.caption) {
        return true;
    }
    return false;
};
// Function to check if the bot is still an administrator
const isBotAdmin = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const administrators = yield ctx.telegram.getChatAdministrators((_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.chat) === null || _b === void 0 ? void 0 : _b.id);
        const botId = ctx.botInfo.id;
        return administrators.some((admin) => admin.user.id === botId);
    }
    catch (error) {
        console.error("Errore durante il recupero degli amministratori:", error);
        return false;
    }
});
bot.command("limits", (ctx) => {
    var _a, _b;
    const chatId = (_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.chat) === null || _b === void 0 ? void 0 : _b.id;
    const genericLimit = groupLimitGeneric[chatId];
    if (!genericLimit) {
        ctx.reply("Non ci sono limiti impostati per questo gruppo.");
    }
    else {
        ctx.reply(`Limite generico: ${genericLimit} KB`);
    }
});
bot.command("stats", (ctx) => {
    var _a, _b;
    const chatId = (_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.chat) === null || _b === void 0 ? void 0 : _b.id;
    if (chatId && groupStats[chatId]) {
        const stats = groupStats[chatId];
        ctx.reply(`Statistiche del gruppo - ultimo frame:\nMessaggi totali: ${stats.totalMessages}\nDimensione totale: ${stats.totalSizeKB.toFixed(3)} KB`);
    }
    else {
        ctx.reply("Non ci sono statistiche disponibili per questo gruppo.");
    }
});
bot.command("get_admins", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = ctx.message.chat.id;
    try {
        const admins = yield ctx.telegram.getChatAdministrators(chatId);
        ctx.reply(`Gli amministratori del gruppo sono: ${admins
            .map((admin) => admin.user.username)
            .join(", ")}`);
    }
    catch (error) {
        console.error("Errore durante il recupero degli amministratori:", error);
        ctx.reply("Si è verificato un errore durante il recupero degli amministratori.");
    }
}));
// Middleware per gestire i messaggi in arrivo
bot.on("message", (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e, _f;
    const chatId = (_d = (_c = ctx.message) === null || _c === void 0 ? void 0 : _c.chat) === null || _d === void 0 ? void 0 : _d.id;
    const chatType = (_f = (_e = ctx.message) === null || _e === void 0 ? void 0 : _e.chat) === null || _f === void 0 ? void 0 : _f.type;
    if (!groupStats[chatId] && chatType === "supergroup") {
        initializeGroupStats(chatId);
    }
    const isAdmin = yield isBotAdmin(ctx);
    if (isAdmin && groupStats[chatId]) {
        const messageSizeKB = parseFloat((0, getKbSize_1.calculateMessageSizeKB)(ctx.message).toString());
        const typeOfMessage = (0, getTypeMessage_1.getTypemessages)(ctx.message);
        // Aggiornamento dei contatori
        updateStats(chatId, messageSizeKB, typeOfMessage);
        const genericLimitReached = groupLimitGeneric[chatId] &&
            messageSizeKB > groupLimitGeneric[chatId];
        // Check if generic limit is reached and delete message if necessary
        if (genericLimitReached) {
            ctx.deleteMessage();
            ctx.reply(`Il messaggio è stato rimosso perché supera il limite di dimensione generico di ${groupLimitGeneric[chatId]} impostato per il gruppo.`);
        }
    }
    else {
        console.log(`Il bot con ID ${bot.botInfo.id} non è più un amministratore.`);
    }
    next();
}));
// Funzione per aggiornare i contatori totalMessages e totalSizeKB
const updateStats = (chatId, messageSizeKB, typeOfMessage) => {
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
app.get("/test", (_req, res) => {
    console.log("test endpoint hit! wsb81");
    res.status(200).json({
        success: "Server is running and bot is active .",
    });
});
app.post("/groupLimitGeneric", (req, res) => {
    const { chatId, limit } = req.body;
    if (!chatId || !limit) {
        return res.status(400).json({ error: "chatId e limit sono richiesti." });
    }
    groupLimitGeneric[chatId] = limit;
    res.status(200).json({
        success: `Limite generico impostato per il gruppo ${chatId}: ${limit} KB`,
    });
});
app.delete("/groupLimitGeneric/:chatId", (req, res) => {
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
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server is running on port ${PORT}`);
    cron.schedule("0 * * * *", () => {
        console.log("Esecuzione del job di invio report ogni ora!");
        if (Object.keys(groupStats).length > 0) {
            sendReport();
            groupStats = {}; // Clear the object after sending report
        }
        else {
            console.log("Nessun dato da inviare.");
        }
    });
}));
let endPoint = "http://localhost:3005";
if (process.env.ENVIRONMENT === "production") {
    endPoint = process.env.REPORT_ENDPOINT || "";
}
console.log("Endpoint:", endPoint);
const finalEndPoint = endPoint + "/api/v1/reports";
const sendEmptyReport = (chatId, chatInfo) => __awaiter(void 0, void 0, void 0, function* () {
    if (!chatId) {
        console.error("Chat ID mancante.");
        return;
    }
    try {
        const payload = {
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
        const response = yield axios.post(finalEndPoint, payload, {
            headers: {
                "Content-Type": "application/json",
                Origin: "supersegretissimo", // Replace with your bot's origin
            },
        });
    }
    catch (error) {
        console.log("Errore durante l'invio del report vuoto:", error);
    }
});
const getAdminNames = (chatId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admins = yield bot.telegram.getChatAdministrators(chatId);
        return admins.map((admin) => admin.user.username);
    }
    catch (error) {
        console.error("Errore durante il recupero degli amministratori:", error);
        return [];
    }
});
const sendReport = () => __awaiter(void 0, void 0, void 0, function* () {
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
        const participantsCount = yield (0, getMemberCount_1.getParticipantsCount)(chatId);
        // Ottieni i nomi degli amministratori del gruppo
        const adminNames = yield getAdminNames(chatId);
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
        let documentEmissionsOneByte = isNaN(parseFloat(documentEmissionsOneByteMethod))
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
        let stickerEmissionsOneByte = isNaN(parseFloat(stickerEmissionsOneByteMethod))
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
            const chatInfo = yield bot.telegram.getChat(chatId);
            const payload = {
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
            console.log(payload, "payload **********************************************************+");
            const response = yield axios.post(finalEndPoint, payload, // Specifica il tipo di payload come ReportPayload,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Custom-Origin": "supersegretissimo", // Intestazione personalizzata
                },
            });
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
        }
        catch (error) {
            if (error.response && error.response.status === 403) {
                console.error("Il bot non può inviare messaggi al gruppo. È stato rimosso?");
            }
            else {
                console.error("Errore durante l'invio del report:", error);
            }
        }
    }
    // Se non ci sono messaggi in nessun gruppo, invia report vuoto per ogni gruppo
    if (Object.keys(groupStats).length === 0) {
        const allChats = yield bot.telegram.getMyCommands();
        for (const chat of allChats) {
            const chatId = chat.chat.id;
            const chatInfo = yield bot.telegram.getChat(chatId);
            yield sendEmptyReport(chatId, chatInfo);
        }
    }
});
