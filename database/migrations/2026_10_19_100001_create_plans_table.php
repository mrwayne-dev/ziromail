<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Plans are data so ops can change a price without a deploy. Money is integer minor units (kobo, cents). */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name', 64);
            $table->unsignedSmallInteger('pool_gb');
            $table->unsignedSmallInteger('ceiling_gb')->nullable();
            $table->unsignedInteger('price_ngn_monthly');
            $table->unsignedInteger('price_ngn_yearly');
            $table->unsignedInteger('price_usd_monthly');
            $table->unsignedInteger('price_usd_yearly');
            $table->unsignedSmallInteger('extra_block_gb')->default(10);
            $table->unsignedInteger('extra_price_ngn_yearly');
            $table->unsignedInteger('extra_price_usd_yearly');
            $table->boolean('featured')->default(false);
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
