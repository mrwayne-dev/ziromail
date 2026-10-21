<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The log now scopes by customer account (the owner's user id), carries string ids
     * (ULID subjects) and a short human summary for the activity pages. The summary is
     * written by the server from non-secret facts, never from request input.
     */
    public function up(): void
    {
        Schema::table('audit_log', function (Blueprint $table) {
            $table->renameColumn('organisation_id', 'account_id');
        });

        Schema::table('audit_log', function (Blueprint $table) {
            $table->string('subject_id', 40)->nullable()->change();
            $table->string('category', 16)->nullable()->after('action');
            $table->string('summary', 255)->nullable()->after('category');
            $table->string('detail', 255)->nullable()->after('summary');
            $table->index(['account_id', 'created_at'], 'audit_account_date_idx');
        });
    }

    public function down(): void
    {
        Schema::table('audit_log', function (Blueprint $table) {
            $table->dropIndex('audit_account_date_idx');
            $table->dropColumn(['category', 'summary', 'detail']);
            $table->renameColumn('account_id', 'organisation_id');
        });
    }
};
