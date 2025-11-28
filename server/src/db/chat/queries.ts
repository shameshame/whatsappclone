import { Prisma } from "@prisma/client";

//const for queries
export const chatWithMembersArgs = Prisma.validator<Prisma.ChatDefaultArgs>()({
  select: {
    id: true,
    type: true,
    name: true,
    lastMessageAt: true,
    createdAt: true,
    updatedAt: true,
    members: {
      select: {
        role: true,
        unreadCount: true,
        user: { select: { id: true, displayName: true, handle: true } },
      },
    },
  },
});

export const lastMessageSelect = Prisma.validator<Prisma.MessageDefaultArgs>()({
  select: {
    id: true,
    text: true,
    kind: true,
    createdAt: true,
    isDeleted: true,
    editedAt: true,
    senderId: true,
    author: { select: { id: true, displayName: true, handle: true } },
  },
});

export const memberWithUserSelect = Prisma.validator<Prisma.ChatMemberDefaultArgs>()({
  select: {
    role: true,
    unreadCount: true,
    user: { select: { id: true, displayName: true, handle: true } },
  },
});

/** Chat select that includes members and the *latest* message */
export const chatWithMembersAndLastMessageArgs = Prisma.validator<Prisma.ChatDefaultArgs>()({
  select: {
    id: true,
    type: true,
    name: true,
    createdAt: true,
    updatedAt: true,
    lastMessageAt: true,

    // members
    members: {
      select: memberWithUserSelect.select,
    },

    // last message (messages[0])
    messages: {
      orderBy: { createdAt: "desc" },
      take: 1,
      select: lastMessageSelect.select,
    },
  },
})