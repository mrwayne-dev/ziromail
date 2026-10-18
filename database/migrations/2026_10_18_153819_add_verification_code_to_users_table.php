<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The 6-digit email confirmation code: only a keyed hash is stored, with when it
     * stops working and how many wrong guesses it has had.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('verification_code_hash', 64)->nullable()->after('email_verified_at');
            $table->timestamp('verification_code_expires_at')->nullable()->after('verification_code_hash');
            $table->unsignedTinyInteger('verification_code_attempts')->default(0)->after('verification_code_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['verification_code_hash', 'verification_code_expires_at', 'verification_code_attempts']);
        });
    }
};
