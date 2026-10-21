<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Several accounts may start claiming one name, but only one can ever hold it live:
     * `live_name` is filled only while a domain is live and is unique, so the database
     * itself refuses a second live owner. MySQL allows many NULLs in a unique index.
     */
    public function up(): void
    {
        Schema::create('domains', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 253)->index('domains_name_idx');
            $table->string('live_name', 253)->nullable()->unique('domains_live_name_uq');
            $table->string('state', 16)->default('pending');
            $table->string('registrar', 64)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'state'], 'domains_owner_state_idx');
        });

        Schema::create('domain_records', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('domain_id')->constrained()->cascadeOnDelete();
            $table->string('type', 8);
            $table->string('status', 16)->default('waiting');
            $table->json('expected');
            $table->json('observed')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('broken_since')->nullable();
            $table->timestamps();

            $table->unique(['domain_id', 'type'], 'domain_records_type_uq');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_records');
        Schema::dropIfExists('domains');
    }
};
