/*
  Warnings:

  - You are about to drop the column `schoolOrCollege` on the `Education` table. All the data in the column will be lost.
  - Added the required column `institution` to the `Education` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Education" DROP COLUMN "schoolOrCollege",
ADD COLUMN     "institution" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" VARCHAR(100);
