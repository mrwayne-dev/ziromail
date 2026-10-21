#!/usr/bin/env bash
# Fires after each assistant turn. If PHP, JS, SQL, config or routes changed since
# the last BUILD_LOG.md edit, inject a reminder to append an entry. Silent otherwise.
set -u
cd "$(dirname "$0")/.."

log=docs/BUILD_LOG.md
[ -f "$log" ] || exit 0

# When was the log last touched?
log_mtime=$(stat -c %Y "$log" 2>/dev/null || echo 0)

# Any watched file touched since then?
touched=$(find \
    app routes database/migrations database/seeders config \
    resources/js/Pages resources/js/Layouts resources/js/Components \
    resources/js/Lib resources/js/Hooks resources/js/fixtures \
    -type f -newer "$log" \
    \( -name '*.php' -o -name '*.jsx' -o -name '*.js' -o -name '*.css' \) \
    2>/dev/null | head -20)

[ -z "$touched" ] && exit 0

count=$(echo "$touched" | wc -l)

# Hook stdout becomes a system reminder in the next turn.
cat <<MSG
Code changed in this turn but $log was not updated. Files touched since the log was last written:
$touched
$([ "$count" -ge 20 ] && echo "(and more)")

If what you just did was substantial (a new feature, a changed decision, a schema change, a new endpoint), append a timestamped entry at the top of $log in the usual shape (time — title, Why, What, Files). If it was only a fix or a formatting pass, skip the log entry and keep moving.
MSG
