/*
  Warnings:

  - You are about to drop the column `userName` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_userName_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "userName",
ADD COLUMN     "username" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
