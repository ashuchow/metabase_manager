/*
  Warnings:

  - You are about to drop the column `email` on the `MetabaseServer` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `MetabaseServer` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MetabaseServer" DROP COLUMN "email",
DROP COLUMN "password";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
,
ALTER COLUMN "role" DROP DEFAULT;

-- CreateTable
CREATE TABLE "UserMetabaseServer" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "serverId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMetabaseServer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMetabaseServer_userId_serverId_key" ON "UserMetabaseServer"("userId", "serverId");

-- AddForeignKey
ALTER TABLE "UserMetabaseServer" ADD CONSTRAINT "UserMetabaseServer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMetabaseServer" ADD CONSTRAINT "UserMetabaseServer_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "MetabaseServer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
