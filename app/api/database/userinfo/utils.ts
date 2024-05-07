// HASH THE PASSWORD!!!!

// app/api/metabaseInstance/utils.ts
import { prisma } from "../../_base";

export async function createMetabaseInstance(
  host: string,
  email: string,
  password: string,
  databaseId: number,
  collectionId: number
) {
  return await prisma.metabaseInstance.create({
    data: {
      host,
      email,
      password, // Remember to hash the password before storing it
      databaseId,
      collectionId,
    },
  });
}

export async function updateMetabaseInstance(
  id: number,
  host: string,
  email: string,
  password: string,
  databaseId: number,
  collectionId: number
) {
  return await prisma.metabaseInstance.update({
    where: {
      id,
    },
    data: {
      host,
      email,
      password, // Remember to hash the password before storing it
      databaseId,
      collectionId,
    },
  });
}

export async function getAllMetabaseInstances() {
  return await prisma.metabaseInstance.findMany();
}

export async function getMetabaseInstanceById(id: number) {
  return await prisma.metabaseInstance.findUnique({
    where: {
      id,
    },
  });
}

export async function deleteMetabaseInstance(id: number) {
  return await prisma.metabaseInstance.delete({
    where: {
      id,
    },
  });
}

// Add any additional helper functions as needed for your application's requirements