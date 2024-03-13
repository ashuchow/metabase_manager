import { prisma } from "../../_base";

export async function createSyncLog(
  status: string,
  detailedRecords: any, // This should match the type of the detailedRecords field in your Prisma schema
  sourceEmail: string,
  sourceHost: string,
  destinationHost: string
) {
  return await prisma.syncLog.create({
    data: {
      status,
      detailedRecords,
      sourceEmail,
      sourceHost,
      destinationHost,
    },
  });
}

export async function updateSyncLog(
  id: number,
  status: string,
  detailedRecords: any, // This should match the type of the detailedRecords field in your Prisma schema
) {
  return await prisma.syncLog.update({
    where: {
      id,
    },
    data: {
      status,
      detailedRecords,
    },
  });
}

export async function getAllSyncLogs() {
  return await prisma.syncLog.findMany();
}

export async function getSyncLogById(id: number) {
  return await prisma.syncLog.findUnique({
    where: {
      id,
    },
  });
}

// Add any additional helper functions as needed for your application's requirements