import { Prisma, type AuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditPayload = {
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  details?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAuditEvent(payload: AuditPayload) {
  await prisma.auditLog.create({
    data: {
      userId: payload.userId ?? undefined,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId ?? undefined,
      details: payload.details,
      ipAddress: payload.ipAddress ?? undefined,
      userAgent: payload.userAgent ?? undefined,
    },
  });
}
