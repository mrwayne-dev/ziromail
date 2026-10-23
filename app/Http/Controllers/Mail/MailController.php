<?php

namespace App\Http\Controllers\Mail;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mail\UpdateSettingsRequest;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\Alias;
use App\Models\Mailbox;
use App\Services\AccountContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The webmail entry points. We render each screen with the layout-level props it needs
 * ({@see shared()}): the active mailbox, its domain, and the alias addresses that land in
 * it. Message content — inbox rows, threads, search hits, contacts — needs a mail server,
 * which is still an open CEO decision, so those surfaces are flagged `demo: true` and keep
 * the fixture in the client; this controller does not fabricate messages.
 */
class MailController extends Controller
{
    public function inbox(AccountContext $account): Response|RedirectResponse
    {
        if (($shared = $this->shared($account)) instanceof RedirectResponse) {
            return $shared;
        }

        return Inertia::render('Mail/Inbox', [...$shared, 'demo' => true]);
    }

    public function compose(AccountContext $account): Response|RedirectResponse
    {
        if (($shared = $this->shared($account)) instanceof RedirectResponse) {
            return $shared;
        }

        return Inertia::render('Mail/Compose', [...$shared, 'demo' => true]);
    }

    public function search(AccountContext $account): Response|RedirectResponse
    {
        if (($shared = $this->shared($account)) instanceof RedirectResponse) {
            return $shared;
        }

        return Inertia::render('Mail/Search', [...$shared, 'demo' => true]);
    }

    public function contacts(AccountContext $account): Response|RedirectResponse
    {
        if (($shared = $this->shared($account)) instanceof RedirectResponse) {
            return $shared;
        }

        return Inertia::render('Mail/Contacts', [...$shared, 'demo' => true]);
    }

    public function settings(AccountContext $account): Response|RedirectResponse
    {
        if (($shared = $this->shared($account)) instanceof RedirectResponse) {
            return $shared;
        }

        // Settings is real: display name, quota, aliases are backed by live tables; signature,
        // auto-reply and reader preferences live under mailboxes.settings (JSON). The
        // "demonstration" flag only reaches the inbox/search/compose/contacts surfaces.
        return Inertia::render('Mail/Settings', [...$shared, 'demo' => false]);
    }

    /**
     * Save the subset of mailbox settings the mailbox owner edits from webmail. Writes the
     * display name back to its column; the rest nests under `mailboxes.settings` JSON. The
     * endpoint is scoped to the signed-in person's current mailbox (first on the current
     * domain), so another account's id simply does not exist for this request. Mail-app
     * devices and read/write preferences are not touched here on purpose: those surfaces
     * carry an honest banner and are waiting on the mail-server decision.
     */
    public function updateSettings(UpdateSettingsRequest $request, AccountContext $account, AuditLogger $audit): RedirectResponse
    {
        $domain = $account->current();
        abort_if($domain === null, 404);

        /** @var Mailbox|null $mailbox */
        $mailbox = $domain->mailboxes->sortBy('created_at')->first();
        abort_if($mailbox === null, 404);

        $data = $request->validated();

        DB::transaction(function () use ($mailbox, $data) {
            if (array_key_exists('display_name', $data)) {
                $mailbox->display_name = $data['display_name'];
            }

            $settings = (array) ($mailbox->settings ?? []);
            foreach (['signature_text', 'signature_on_replies', 'reply_to', 'block_remote_images', 'auto_reply'] as $key) {
                if (array_key_exists($key, $data)) {
                    $settings[$key] = $data[$key];
                }
            }
            $mailbox->settings = $settings;
            $mailbox->save();
        });

        $audit->account(
            AuditAction::MailboxSettingsChanged,
            $account->owner(),
            'mailboxes',
            'Settings saved for *'.$mailbox->local_part.'@'.$domain->name.'*',
            $request->user(),
            subject: $mailbox,
        );

        return back()->with('status', 'saved');
    }

    /**
     * Shared layout + page props: the active mailbox (first mailbox on the current domain
     * for now; a mailbox switcher is a later feature), its domain, and the alias addresses
     * that land in it. Redirects to onboarding if the signed-in person owns no domain yet.
     *
     * @return array{mailbox: array<string, mixed>, domain: array<string, mixed>, aliases: array<int, array<string, mixed>>}|RedirectResponse
     */
    private function shared(AccountContext $account): array|RedirectResponse
    {
        $domain = $account->current();
        if ($domain === null) {
            return redirect()->route('onboarding.domain');
        }

        $mailbox = $domain->mailboxes->sortBy('created_at')->first();
        if ($mailbox === null) {
            return redirect()->route('dashboard.mailboxes', ['domain' => $domain->id]);
        }

        $aliases = Alias::query()
            ->where('domain_id', $domain->id)
            ->whereJsonContains('destinations', $mailbox->local_part.'@'.$domain->name)
            ->orderBy('local_part')
            ->get();

        return [
            'mailbox' => $this->mailboxProps($mailbox, $domain->name),
            'domain' => [
                'id' => $domain->id,
                'name' => $domain->name,
                'poolGb' => $domain->poolGb(),
            ],
            'aliases' => $aliases
                ->map(fn (Alias $alias) => [
                    'id' => $alias->id,
                    'address' => $alias->local_part.'@'.$domain->name,
                    'destinations' => (array) $alias->destinations,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mailboxProps(Mailbox $mailbox, string $domainName): array
    {
        $settings = (array) ($mailbox->settings ?? []);

        return [
            'id' => $mailbox->id,
            'address' => $mailbox->local_part.'@'.$domainName,
            'local' => $mailbox->local_part,
            'displayName' => $mailbox->display_name ?? $mailbox->local_part,
            'quotaGb' => (float) $mailbox->quota_gb,
            'usedGb' => (float) $mailbox->used_gb,
            'settings' => [
                'signature' => (string) ($settings['signature_text'] ?? ''),
                'signatureOnReplies' => (bool) ($settings['signature_on_replies'] ?? true),
                'replyTo' => (string) ($settings['reply_to'] ?? ''),
                'blockRemoteImages' => (bool) ($settings['block_remote_images'] ?? true),
                'autoReply' => [
                    'on' => (bool) ($settings['auto_reply']['on'] ?? false),
                    'from' => (string) ($settings['auto_reply']['from'] ?? ''),
                    'until' => (string) ($settings['auto_reply']['until'] ?? ''),
                ],
            ],
        ];
    }
}
