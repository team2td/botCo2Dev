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
exports.getParticipantsCount = void 0;
const axios = require("axios");
const getParticipantsCount = (chatId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMembersCount?chat_id=${chatId}`);
        // console.log("Risposta dal recupero del numero di partecipanti:", response);
        return response.data.result;
    }
    catch (error) {
        console.error("Errore durante il recupero del numero di partecipanti:", error);
        return null;
    }
});
exports.getParticipantsCount = getParticipantsCount;
