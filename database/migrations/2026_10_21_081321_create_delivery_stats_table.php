<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Hourly outcome counts per customer domain and recipient provider (gmail.com, not a person).
     * No recipient address, no subject, no message id: the delivery log answers "is mail getting
     * through to Gmail?", never "what did this person send?".
     */
    public function up(): void
    {
        Schema::table('sending_stats', function (Blueprint $table) {
            $table->unsignedInteger('filter_flagged')->default(0)->after('new_recipients');
        });

        Schema::create('delivery_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('domain_id')->constrained()->cascadeOnDelete();
            $table->string('recipient_domain', 253);
            $table->dateTime('hour');
            $table->unsignedInteger('delivered')->default(0);
            $table->unsignedInteger('deferred')->default(0);
            $table->unsignedInteger('bounced')->default(0);
            $table->unsignedInteger('rejected')->default(0);
            $table->string('reply_code', 12)->nullable();
            $table->timestamps();

            $table->unique(['domain_id', 'recipient_domain', 'hour'], 'delivery_stats_hour_uq');
            $table->index('hour', 'delivery_stats_hour_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_stats');
        Schema::table('sending_stats', function (Blueprint $table) {
            $table->dropColumn('filter_flagged');
        });
    }
};
