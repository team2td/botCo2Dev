// types/types.ts

export interface GroupStats {
  totalMessages: 0;
  totalSizeKB: 0;
  textTotalMessages: 0;
  textTotalSize: 0;
  photoTotalMessages: 0;
  photoTotalSize: 0;
  videoTotalMessages: 0;
  videoTotalSize: 0;
  voiceTotalMessages: 0;
  voiceTotalSize: 0;
  documentTotalMessages: 0;
  documentTotalSize: 0;
  pollTotalMessages: 0;
  pollTotalSize: 0;
  stickerTotalMessages: 0;
  stickerTotalSize: 0;
}

export interface ReportPayload {
  groupId: string;
  totalMessages: number;
  totalSizeKB: number;
  emissionsOneByteMethod: number;
  emissionsSWDMethod: number;
  textTotalMessages: number;
  textTotalSize: number;
  textEmissionsOneByteMethod: number;
  textEmissionsSWDMethod: number;
  photoTotalMessages: number;
  photoTotalSize: number;
  photoEmissionsOneByteMethod: number;
  photoEmissionsSWDMethod: number;
  voiceTotalMessages: number;
  voiceTotalSize: number;
  voiceEmissionsOneByteMethod: number;
  voiceEmissionsSWDMethod: number;
  videoTotalMessages: number;
  videoTotalSize: number;
  videoEmissionsOneByteMethod: number;
  videoEmissionsSWDMethod: number;
  documentTotalMessages: number;
  documentTotalSize: number;
  documentEmissionsOneByteMethod: number;
  documentEmissionsSWDMethod: number;
  pollTotalMessages: number;
  pollTotalSize: number;
  pollEmissionsOneByteMethod: number;
  pollEmissionsSWDMethod: number;
  stickerTotalMessages: number;
  stickerTotalSize: number;
  stickerEmissionsOneByteMethod: number;
  stickerEmissionsSWDMethod: number;
  groupName?: string;
  participantsCount?: number;
  adminNames: string[]; // Aggiunta di adminNames come array di stringhe
}
