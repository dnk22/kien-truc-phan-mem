CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'CASHIER', 'WAREHOUSE');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'LOCKED');
CREATE TABLE "users" (
 "id" UUID NOT NULL, "username" VARCHAR(40) NOT NULL, "password_hash" TEXT NOT NULL,
 "full_name" VARCHAR(120) NOT NULL, "email" VARCHAR(254), "phone" VARCHAR(20),
 "role" "Role" NOT NULL, "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE', "token_version" INTEGER NOT NULL DEFAULT 0,
 "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL, "last_login_at" TIMESTAMPTZ(3),
 CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE TABLE "refresh_sessions" (
 "id" UUID NOT NULL, "family_id" UUID NOT NULL, "user_id" UUID NOT NULL, "token_hash" VARCHAR(64) NOT NULL,
 "expires_at" TIMESTAMPTZ(3) NOT NULL, "revoked_at" TIMESTAMPTZ(3), "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "refresh_sessions_token_hash_key" ON "refresh_sessions"("token_hash");
CREATE INDEX "refresh_sessions_user_id_revoked_at_idx" ON "refresh_sessions"("user_id", "revoked_at");
CREATE INDEX "refresh_sessions_family_id_idx" ON "refresh_sessions"("family_id");
CREATE INDEX "refresh_sessions_expires_at_idx" ON "refresh_sessions"("expires_at");
