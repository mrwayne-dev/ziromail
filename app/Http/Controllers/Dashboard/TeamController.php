<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\InviteTeamMemberRequest;
use App\Identity\Enums\AuditAction;
use App\Identity\Services\AuditLogger;
use App\Models\Delegation;
use App\Models\TeamMember;
use App\Notifications\TeamInvitationNotification;
use App\Services\AccountContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(AccountContext $account): Response
    {
        $owner = $account->owner();
        $isOwner = $account->isOwner();

        $people = collect([['id' => 'owner', 'name' => $owner->name, 'email' => $owner->email, 'role' => 'owner', 'locked' => true, 'kind' => 'person']])
            ->merge($owner->teamMembers()->whereNull('revoked_at')->orderBy('created_at')->get()->map(fn (TeamMember $m) => [
                'id' => $m->id, 'name' => $m->member?->name ?? explode('@', $m->email)[0], 'email' => $m->email,
                'role' => $m->role, 'locked' => false, 'kind' => 'person', 'pending' => $m->accepted_at === null,
            ]));

        return Inertia::render('Dashboard/Team', [
            'org' => ['name' => $owner->business_name ?? $owner->name],
            'domain' => $account->current()?->only(['id', 'name']),
            'people' => $people->values(),
            'delegations' => $owner->delegations()->whereNull('revoked_at')->get()->map(fn (Delegation $d) => [
                'id' => $d->id, 'granteeName' => $d->grantee_name, 'scope' => $d->scope,
                'grantedAt' => $d->created_at->toDateString(), 'expiresAt' => $d->expires_at?->toDateString(), 'revokedAt' => null,
            ])->values(),
            'canManageAccess' => $isOwner,
            'canExport' => $isOwner,
        ]);
    }

    public function invite(InviteTeamMemberRequest $request, AccountContext $account, AuditLogger $audit): RedirectResponse
    {
        abort_unless($account->isOwner(), 403);
        $owner = $account->owner();
        $email = mb_strtolower($request->string('email')->toString());

        if (mb_strtolower($owner->email) === $email) {
            throw ValidationException::withMessages(['email' => 'That is your own address. You already have full access.']);
        }

        // Inviting the same address twice, or one removed earlier, is the same quiet success: nothing is revealed.
        $member = TeamMember::query()->where('owner_id', $owner->id)->where('email', $email)->first() ?? new TeamMember(['email' => $email, 'role' => 'admin']);
        $member->owner_id = $owner->id;
        $member->revoked_at = null;
        $member->save();

        Notification::route('mail', $email)->notify(new TeamInvitationNotification($owner->business_name ?? $owner->name));
        $audit->account(AuditAction::AdminAdded, $owner, 'access', 'You invited *'.$email.'* as an administrator', $request->user(), subject: $member);

        return back()->with('status', 'invited');
    }

    public function remove(string $member, AccountContext $account, AuditLogger $audit): RedirectResponse
    {
        abort_unless($account->isOwner(), 403);
        $owner = $account->owner();
        $member = $owner->teamMembers()->whereNull('revoked_at')->findOrFail($member);
        $member->forceFill(['revoked_at' => now()])->save();
        $audit->account(AuditAction::AdminRemoved, $owner, 'access', 'You removed *'.$member->email.'* as an administrator', request()->user(), subject: $member);

        return back()->with('status', 'member-removed');
    }

    public function withdraw(string $delegation, AccountContext $account, AuditLogger $audit): RedirectResponse
    {
        abort_unless($account->isOwner(), 403);
        $owner = $account->owner();
        $delegation = $owner->delegations()->whereNull('revoked_at')->findOrFail($delegation);
        $delegation->forceFill(['revoked_at' => now()])->save();
        $audit->account(AuditAction::DelegationWithdrawn, $owner, 'access', 'You withdrew access from *'.$delegation->grantee_name.'*', request()->user(), subject: $delegation);

        return back()->with('status', 'access-withdrawn');
    }
}
