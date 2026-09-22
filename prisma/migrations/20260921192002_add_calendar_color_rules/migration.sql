-- CreateTable
CREATE TABLE "CalendarColorRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "thresholdMinutes" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarColorRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarColorRule_userId_idx" ON "CalendarColorRule"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarColorRule_userId_thresholdMinutes_key" ON "CalendarColorRule"("userId", "thresholdMinutes");

-- AddForeignKey
ALTER TABLE "CalendarColorRule" ADD CONSTRAINT "CalendarColorRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
