<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('business_name')->nullable()->after('name');
            $table->string('phone', 32)->nullable()->after('email');
            $table->text('two_factor_secret')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->timestamp('two_factor_pending_until')->nullable();
            $table->unsignedBigInteger('two_factor_last_used_step')->nullable();
            $table->timestamp('two_factor_prompt_snoozed_until')->nullable();
            $table->timestamp('password_changed_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamp('terms_accepted_at')->nullable();
            $table->string('terms_version', 16)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'business_name', 'phone', 'two_factor_secret', 'two_factor_confirmed_at', 'two_factor_pending_until',
                'two_factor_last_used_step', 'two_factor_prompt_snoozed_until', 'password_changed_at', 'last_login_at',
                'terms_accepted_at', 'terms_version',
            ]);
        });
    }
};
