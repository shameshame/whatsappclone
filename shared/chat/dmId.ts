export const deterministicId = (user1Id: string, user2Id: string) =>
  `dm:${[user1Id, user2Id].sort().join("|")}`;