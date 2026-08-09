-- CreateTable
CREATE TABLE "BlogPostDailyView" (
    "id" SERIAL NOT NULL,
    "blogPostId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BlogPostDailyView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostDailyView_blogPostId_date_key" ON "BlogPostDailyView"("blogPostId", "date");

-- AddForeignKey
ALTER TABLE "BlogPostDailyView" ADD CONSTRAINT "BlogPostDailyView_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
