-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'CR', 'GR', 'GUARD', 'STUDENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('GRANTED', 'REJECTED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "sap_id" TEXT NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "cnic" TEXT,
    "phone_number" TEXT,
    "gender" "Gender",
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "activation_token" TEXT,
    "password_hash" TEXT,
    "qr_secret" TEXT,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_failed_login" TIMESTAMP(3),
    "locked_until" TIMESTAMP(3),
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "profile_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "semester" TEXT,
    "section" TEXT,
    "department" TEXT,
    "profile_photo_url" TEXT,
    "university_card_url" TEXT,
    "created_by_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "scanner_id" TEXT,
    "status" "ScanStatus" NOT NULL,
    "type" "ScanType" NOT NULL,
    "gate_number" TEXT,
    "event_id" TEXT,
    "metadata" JSONB,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performer_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "venue" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "description" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "primary_color" TEXT,
    "max_capacity" INTEGER,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "ticket_price" INTEGER NOT NULL DEFAULT 2000,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_sap_id_key" ON "users"("sap_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_activation_token_key" ON "users"("activation_token");

-- CreateIndex
CREATE INDEX "users_sap_id_idx" ON "users"("sap_id");

-- CreateIndex
CREATE INDEX "users_activation_token_idx" ON "users"("activation_token");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE INDEX "users_created_by_id_idx" ON "users"("created_by_id");

-- CreateIndex
CREATE INDEX "users_is_paid_role_idx" ON "users"("is_paid", "role");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "access_logs_user_id_idx" ON "access_logs"("user_id");

-- CreateIndex
CREATE INDEX "access_logs_timestamp_idx" ON "access_logs"("timestamp");

-- CreateIndex
CREATE INDEX "access_logs_user_id_timestamp_idx" ON "access_logs"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "access_logs_event_id_timestamp_idx" ON "access_logs"("event_id", "timestamp");

-- CreateIndex
CREATE INDEX "access_logs_status_timestamp_idx" ON "access_logs"("status", "timestamp");

-- CreateIndex
CREATE INDEX "access_logs_type_timestamp_idx" ON "access_logs"("type", "timestamp");

-- CreateIndex
CREATE INDEX "access_logs_type_status_timestamp_idx" ON "access_logs"("type", "status", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_performer_id_idx" ON "audit_logs"("performer_id");

-- CreateIndex
CREATE INDEX "audit_logs_target_id_idx" ON "audit_logs"("target_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_is_default_idx" ON "events"("is_default");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_scanner_id_fkey" FOREIGN KEY ("scanner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performer_id_fkey" FOREIGN KEY ("performer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
