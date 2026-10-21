<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Someone the owner has given their own login to. `member_id` fills in when the invitation is accepted.
        Schema::create('team_members', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('member_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('email', 254);
            $table->string('role', 16)->default('admin');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->unique(['owner_id', 'email'], 'team_members_email_uq');
        });

        // An agency's limited, expiring, withdrawable access.
        Schema::create('delegations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('grantee_name', 120);
            $table->string('scope', 160);
            $table->date('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delegations');
        Schema::dropIfExists('team_members');
    }
};
