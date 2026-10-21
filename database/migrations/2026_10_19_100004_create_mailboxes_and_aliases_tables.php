<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** There is deliberately no table for message bodies, subjects or addresses mailed: the platform never stores mail content. */
    public function up(): void
    {
        Schema::create('mailboxes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('domain_id')->constrained()->cascadeOnDelete();
            $table->string('local_part', 64);
            $table->string('display_name', 120)->nullable();
            $table->string('role_label', 24)->default('Staff');
            $table->decimal('quota_gb', 6, 1);
            $table->decimal('used_gb', 8, 2)->default(0);
            $table->string('state', 16)->default('not_set_up');
            $table->string('provisioning_state', 16)->default('pending');
            $table->boolean('require_two_factor')->default(false);
            $table->boolean('require_password_change')->default(false);
            $table->timestamp('last_login_at')->nullable();
            $table->timestamp('setup_completed_at')->nullable();
            $table->timestamps();

            $table->unique(['domain_id', 'local_part'], 'mailboxes_address_uq');
        });

        Schema::create('aliases', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('domain_id')->constrained()->cascadeOnDelete();
            $table->string('local_part', 64);
            $table->json('destinations');
            $table->timestamps();

            $table->unique(['domain_id', 'local_part'], 'aliases_address_uq');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aliases');
        Schema::dropIfExists('mailboxes');
    }
};
