<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('two_factor_recovery_codes', function (Blueprint $table) {
            $table->id();
            $table->morphs('authenticatable', 'recovery_codes_owner');
            $table->string('code_hash', 64);
            $table->timestamp('used_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['authenticatable_type', 'authenticatable_id', 'used_at'], 'recovery_codes_owner_used');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('two_factor_recovery_codes');
    }
};
