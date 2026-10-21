<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Counts only. There is no column for a subject line, a body, a recipient address or anything
     * else read out of a message: the sending bot works from how much and how often, never what.
     */
    public function up(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->string('sending_state', 16)->default('normal')->after('state');
        });

        Schema::create('sending_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('mailbox_id')->constrained()->cascadeOnDelete();
            $table->dateTime('hour');
            $table->unsignedInteger('sent')->default(0);
            $table->unsignedInteger('bounced')->default(0);
            $table->unsignedInteger('complaints')->default(0);
            $table->unsignedInteger('new_recipients')->default(0);
            $table->timestamps();

            $table->unique(['mailbox_id', 'hour'], 'sending_stats_hour_uq');
            $table->index('hour', 'sending_stats_hour_idx');
        });

        Schema::create('abuse_flags', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('mailbox_id')->constrained()->cascadeOnDelete();
            $table->string('status', 12)->default('open');
            $table->string('severity', 8);
            $table->json('rules');
            $table->json('evidence');
            $table->string('auto_action', 16)->default('none');
            $table->string('outcome', 12)->nullable();
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->string('resolution_reason', 255)->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'severity'], 'abuse_flags_queue_idx');
            $table->index(['mailbox_id', 'status'], 'abuse_flags_mailbox_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abuse_flags');
        Schema::dropIfExists('sending_stats');
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->dropColumn('sending_state');
        });
    }
};
