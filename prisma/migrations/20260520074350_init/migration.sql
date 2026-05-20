-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "balance_history" ADD CONSTRAINT "balance_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
