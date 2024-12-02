/*
  Warnings:

  - You are about to drop the column `isSource` on the `MetabaseServer` table. All the data in the column will be lost.
  - Added the required column `isSource` to the `UserMetabaseServer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MetabaseServer" DROP COLUMN "isSource";

-- AlterTable
ALTER TABLE "UserMetabaseServer" ADD COLUMN     "isSource" BOOLEAN NOT NULL;
