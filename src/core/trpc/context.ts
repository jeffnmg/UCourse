import { type NextRequest } from "next/server";
import { db } from "@/core/db";
import { auth } from "@/core/auth";
import type { User } from "@prisma/client";

export type TRPCContext = {
  db: typeof db;
  user: User | null;
  req: NextRequest;
};

export async function createTRPCContext(req: NextRequest): Promise<TRPCContext> {
  let user: User | null = null;

  try {
    const session = await auth();
    if (session?.user?.id) {
      user = await db.user.findUnique({ where: { id: session.user.id } });
    }
  } catch {
    // Sin sesión activa
  }

  return { db, user, req };
}
