-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Pending', 'Sent', 'Delivered', 'Seen');

-- AlterTable
ALTER TABLE "Messages" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'Pending';
