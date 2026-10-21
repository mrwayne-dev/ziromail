<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Forwarding, auto-reply, filtering and send limits live in one validated JSON column. A deleted mailbox is held (soft deleted) for 30 days before removal. */
    public function up(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->json('settings')->nullable()->after('require_password_change');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn('settings');
        });
    }
};
