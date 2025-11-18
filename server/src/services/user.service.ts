import { RequestHandler } from "express"
import { PrismaClient,Prisma } from "@prisma/client";
          


const prisma= new PrismaClient();

// GET /api/users?q=alex&limit=20&cursor=<lastId>
export const getAllUsers:RequestHandler = async (req, res) => {
  // Simulate fetching users from a database
  
  const me = (req as any).user.id as string;

  const query = (req.query.q as string | undefined)?.trim() || "";
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const cursor = req.query.cursor as string | undefined;

  const where: Prisma.UserWhereInput = {
    id: { not: me }, // exclude the caller
    ...(query
      ? {
          OR: [
            { displayName: { contains: query, mode: "insensitive" } },
            { handle: { contains: query, mode: "insensitive" } },
            
          ],
        }
      : {}),
  };

  // Using a simple id-desc order to keep cursor logic trivial.
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      displayName: true,
      handle: true,
      createdAt: true,
    },
    orderBy: { id: "desc" },
    take: limit + 1,                     // fetch one extra to know if there’s a next page
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = users.length > limit;
  const items = hasMore ? users.slice(0, limit) : users;
  const nextCursor = hasMore ? items[items.length - 1]?.id  : null;

  res.json({ users: items, nextCursor });       

 }