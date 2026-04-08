type VoiceRequestData = {
  me: string;
  chatId: string;
  file: Express.Multer.File;
  tempId?: string;
  replyToId: string | null;
  durationSec: number;
};

type StoredVoiceFile = {
  publicUrl: string;
};