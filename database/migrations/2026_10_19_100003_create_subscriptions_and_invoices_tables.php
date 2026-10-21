<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('domain_id')->unique('subscriptions_domain_uq')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained();
            $table->string('term', 8)->default('annual');
            $table->string('status', 16)->default('active');
            $table->date('renews_at')->nullable();
            $table->date('grace_ends_at')->nullable();
            $table->string('paid_by', 16)->nullable();
            $table->unsignedSmallInteger('extra_storage_gb')->default(0);
            $table->string('currency', 3)->default('NGN');
            $table->unsignedInteger('price_net');
            $table->unsignedInteger('vat');
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('domain_id')->nullable()->constrained()->nullOnDelete();
            $table->string('number', 32)->unique('invoices_number_uq');
            $table->date('issued_at');
            $table->string('description', 160);
            $table->string('currency', 3)->default('NGN');
            $table->unsignedInteger('net');
            $table->unsignedInteger('vat');
            $table->unsignedInteger('total');
            $table->string('status', 16)->default('paid');
            $table->timestamps();

            $table->index(['user_id', 'issued_at'], 'invoices_owner_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('subscriptions');
    }
};
