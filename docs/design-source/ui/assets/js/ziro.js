/* Ziro Email — shared behaviour for the UI prototypes.
   Deliberately dependency-free: these pages are design references that must
   open from the file system with no build step. */
(function () {
  'use strict';

  /* ---- header gains a scrim once the page scrolls ---- */
  var hdr = document.querySelector('.hdr');
  if (hdr) {
    var onScroll = function () {
      hdr.classList.toggle('is-stuck', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- reveal-on-scroll for sections ---- */
  var targets = document.querySelectorAll(
    '[data-reveal], [data-stagger], .underline-draw, [data-meter], [data-pool-anim]');
  if (targets.length && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Only now hide them — before this line the content is visible, so a blocked
    // or failed script leaves a readable page rather than an empty one.
    document.documentElement.classList.add('reveal-on');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .05 });
    targets.forEach(function (el) { io.observe(el); });
    // Safety net: if anything is still hidden shortly after load, show it.
    setTimeout(function () {
      targets.forEach(function (el) { el.classList.add('in'); });
    }, 2500);
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- hero entry ----
     Opt in immediately (not on DOMContentLoaded) so the class lands before the
     first paint and the hero does not flash in unanimated. */
  if (!reduced && document.querySelector('[data-hero]')) {
    document.documentElement.classList.add('hero-anim');
  }

  /* ---- counters: animate to the target once visible ---- */
  function runCounters() {
    var els = document.querySelectorAll('[data-count-to]');
    if (!els.length) return;
    els.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count-to'));
      var suffix = el.getAttribute('data-count-suffix') || '';
      if (reduced || !('IntersectionObserver' in window)) {
        el.textContent = target.toLocaleString('en-NG') + suffix;
        return;
      }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          var dur = 1100, t0 = performance.now();
          (function step(now) {
            // Something else may have claimed this element mid-count — the
            // domain switcher drops the attribute when it repaints a figure.
            if (!el.hasAttribute('data-count-to')) return;
            var p = Math.min(1, (now - t0) / dur);
            var eased = 1 - Math.pow(1 - p, 3);          // easeOutCubic
            el.textContent = Math.round(target * eased).toLocaleString('en-NG') + suffix;
            if (p < 1) requestAnimationFrame(step);
          })(t0);
        });
      }, { threshold: .4 });
      io.observe(el);
    });
  }

  /* ---- scroll rail: fill a vertical line as its section passes ---- */
  function runRails() {
    var rails = document.querySelectorAll('.rail');
    if (!rails.length || reduced) return;
    var tick = function () {
      rails.forEach(function (r) {
        var b = r.getBoundingClientRect();
        var vh = window.innerHeight;
        // 0% when the top reaches 80% of the viewport, 100% when the bottom passes 40%
        var p = (vh * 0.8 - b.top) / (b.height + vh * 0.4);
        r.style.setProperty('--fill', Math.max(0, Math.min(1, p)) * 100 + '%');
      });
    };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* ---- staggered word rise: set per-word delay from markup order ---- */
  function runRise() {
    document.querySelectorAll('.rise > i').forEach(function (w, i) {
      w.style.animationDelay = (reduced ? 0 : 0.06 * i + 0.1) + 's';
    });
  }

  /* ---- word cycler: swap one phrase for the next in place ---- */
  function runCyclers() {
    document.querySelectorAll('[data-cycle]').forEach(function (el) {
      var items = Array.prototype.slice.call(el.children);
      if (items.length < 2) return;
      var i = 0;
      items.forEach(function (s, n) { s.classList.toggle('on', n === 0); });
      if (reduced) return;                      // show the first, never rotate
      var hold = parseInt(el.getAttribute('data-cycle'), 10) || 2200;
      setInterval(function () {
        var cur = items[i], nxt = items[(i + 1) % items.length];
        cur.classList.remove('on');
        cur.classList.add('out');
        nxt.classList.remove('out');
        nxt.classList.add('on');
        setTimeout(function () { cur.classList.remove('out'); }, 460);
        i = (i + 1) % items.length;
      }, hold);
    });
  }

  /* ---- storage allocator ----
     Quota inputs share one pool. Recompute the bar, the remaining figure and
     the over-allocation state whenever any of them changes. */
  function recalcPool(root) {
    var poolGb = parseFloat(root.getAttribute('data-pool')) || 0;
    var rows = root.querySelectorAll('[data-quota-row]');
    var bar = root.querySelector('[data-pool-bar]');
    var used = 0;

    rows.forEach(function (r) {
      var inp = r.querySelector('[data-quota]');
      var v = Math.max(0, parseFloat(inp.value) || 0);
      used += v;
    });

    var left = Math.round((poolGb - used) * 10) / 10;
    var over = left < 0;

    // rebuild the bar: one segment per mailbox, plus the remainder
    if (bar) {
      bar.innerHTML = '';
      rows.forEach(function (r, i) {
        var v = Math.max(0, parseFloat(r.querySelector('[data-quota]').value) || 0);
        if (!v) return;
        var seg = document.createElement('span');
        seg.className = 'pool-seg s' + ((i % 4) + 1);
        seg.style.flex = v;
        seg.textContent = v + ' GB';
        bar.appendChild(seg);
      });
      if (left > 0) {
        var free = document.createElement('span');
        free.className = 'pool-seg free';
        free.style.flex = left;
        free.textContent = left + ' free';
        bar.appendChild(free);
      }
      bar.setAttribute('aria-label',
        used + ' of ' + poolGb + ' GB assigned, ' + (over ? 'over by ' + Math.abs(left) : left + ' GB free'));
    }

    root.querySelectorAll('[data-pool-used]').forEach(function (el) { el.textContent = Math.round(used * 10) / 10; });
    // "still free" never goes negative — the overage is reported by the warning,
    // which uses its own [data-pool-over].
    root.querySelectorAll('[data-pool-left]').forEach(function (el) { el.textContent = Math.max(0, left); });
    root.querySelectorAll('[data-pool-over]').forEach(function (el) { el.textContent = Math.abs(Math.min(0, left)); });
    root.classList.toggle('is-over', over);

    var warn = root.querySelector('[data-pool-warn]');
    if (warn) warn.hidden = !over;
    var submit = root.querySelector('[data-pool-submit]');
    if (submit) submit.toggleAttribute('aria-disabled', over);
  }

  document.addEventListener('input', function (e) {
    if (!e.target.matches('[data-quota]')) return;
    var root = e.target.closest('[data-pool]');
    if (root) recalcPool(root);
  });

  /* give the rest of the pool to one mailbox */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-give-rest]');
    if (!b) return;
    var root = b.closest('[data-pool]');
    var row = b.closest('[data-quota-row]');
    if (!root || !row) return;
    var poolGb = parseFloat(root.getAttribute('data-pool')) || 0;
    var others = 0;
    root.querySelectorAll('[data-quota-row]').forEach(function (r) {
      if (r !== row) others += Math.max(0, parseFloat(r.querySelector('[data-quota]').value) || 0);
    });
    row.querySelector('[data-quota]').value = Math.max(0, Math.round((poolGb - others) * 10) / 10);
    recalcPool(root);
  });

  /* ---- mobile navigation ----
     The panel animates max-height, which needs a real number, so its height is
     measured on every open — the menu is taller on pages that add links.
     The header carries .nav-open so the wordmark and close icon can go dark
     against the white sheet. */
  function setNav(nav, btn, open) {
    var hdr = nav.closest('.hdr');
    // max-height is written in pixels rather than through a custom property:
    // a var() set on the same element during the same recalc resolves to its
    // fallback, and the panel stays shut.
    if (open) {
      // Measure with .open applied but height still clamped, so the panel's
      // open padding is included — measuring first under-reads by 42px.
      nav.classList.add('open');
      nav.style.maxHeight = 'none';
      var h = nav.scrollHeight;
      nav.style.maxHeight = '0px';
      void nav.offsetHeight;            // flush, so the change animates
      nav.style.maxHeight = h + 'px';
      // Once open, stop clamping. scrollHeight rounds down and misses late
      // layout shifts (a webfont swapping in), which clips the last button.
      nav.addEventListener('transitionend', function once(ev) {
        if (ev.propertyName !== 'max-height') return;
        nav.removeEventListener('transitionend', once);
        if (nav.classList.contains('open')) nav.style.maxHeight = 'none';
      });
    } else {
      // Pin the current height before collapsing — a transition out of
      // max-height:none has nothing to interpolate from.
      nav.style.maxHeight = nav.scrollHeight + 'px';
      void nav.offsetHeight;
      nav.style.maxHeight = '0px';
      nav.classList.remove('open');
    }
    if (hdr) hdr.classList.toggle('nav-open', open);
    document.body.classList.toggle('nav-locked', open);
    if (btn) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  }

  function navFor(btn) {
    return document.getElementById(btn.getAttribute('aria-controls') || 'mnav');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-nav-toggle]');
    if (t) {
      var nav = navFor(t);
      if (nav) setNav(nav, t, !nav.classList.contains('open'));
      return;
    }
    // A tap outside an open sheet closes it. Links inside it are left alone so
    // the navigation still happens.
    var openNav = document.querySelector('.mnav.open');
    if (openNav && !e.target.closest('.mnav') && !e.target.closest('[data-nav-toggle]')) {
      setNav(openNav, document.querySelector('[data-nav-toggle]'), false);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openNav = document.querySelector('.mnav.open');
    if (!openNav) return;
    var btn = document.querySelector('[data-nav-toggle]');
    setNav(openNav, btn, false);
    if (btn) btn.focus();
  });

  // Crossing into the desktop layout leaves the body locked otherwise.
  window.addEventListener('resize', function () {
    if (window.innerWidth < 1000) return;
    var openNav = document.querySelector('.mnav.open');
    if (openNav) setNav(openNav, document.querySelector('[data-nav-toggle]'), false);
  });

  /* ---- copy to clipboard ----
     Falls back to a hidden textarea because file:// pages have no
     clipboard permission in some browsers. */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var sel = btn.getAttribute('data-copy');
    var src = sel && sel.charAt(0) === '#' ? document.querySelector(sel) : btn.previousElementSibling;
    var text = btn.getAttribute('data-copy-text') || (src ? src.textContent.trim() : '');
    if (!text) return;

    var done = function () {
      var old = btn.textContent;
      btn.textContent = 'Copied';
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-ghost');
      setTimeout(function () {
        btn.textContent = old;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-ghost');
      }, 1400);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();

    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:absolute;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { /* nothing to do */ }
      document.body.removeChild(ta);
    }
  });

  /* ---- currency + billing-term switching ----
     Elements carry data-ngn / data-usd (and optionally data-ngn-annual etc.);
     the toggles rewrite their text. Verdict: build the switch because it is
     cheap and looks professional — do not market abroad. */
  var state = { cur: 'ngn', term: 'annual' };

  function money(el) {
    var key = state.cur + (state.term === 'annual' ? '-annual' : '');
    return el.getAttribute('data-' + key) || el.getAttribute('data-' + state.cur) || el.textContent;
  }

  function applyPricing() {
    document.querySelectorAll('[data-ngn]').forEach(function (el) { el.textContent = money(el); });
    document.querySelectorAll('[data-show-when]').forEach(function (el) {
      var want = el.getAttribute('data-show-when');
      el.hidden = !(want === state.cur || want === state.term);
    });
    document.querySelectorAll('[data-cur-symbol]').forEach(function (el) {
      el.textContent = state.cur === 'ngn' ? '₦' : '$';
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-set-currency], [data-set-term]');
    if (!b) return;
    var group = b.parentElement;
    if (b.hasAttribute('data-set-currency')) state.cur = b.getAttribute('data-set-currency');
    if (b.hasAttribute('data-set-term')) state.term = b.getAttribute('data-set-term');
    if (group) {
      group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
    }
    applyPricing();
  });

  /* ---- seat calculator ---- */
  function recalcSeats(root) {
    var input = root.querySelector('[data-seats]');
    if (!input) return;
    var seats = Math.max(1, parseInt(input.value, 10) || 1);
    input.value = seats;
    root.querySelectorAll('[data-seat-total]').forEach(function (el) {
      var unit = parseFloat(el.getAttribute('data-unit') || '0');
      var sub = unit * seats;
      var vat = sub * 0.075;                       // scope §10: VAT shown clearly at 7.5%
      var which = el.getAttribute('data-seat-total');
      var val = which === 'vat' ? vat : which === 'total' ? sub + vat : sub;
      el.textContent = (state.cur === 'ngn' ? '₦' : '$') + val.toLocaleString('en-NG', {
        minimumFractionDigits: state.cur === 'ngn' ? 0 : 2,
        maximumFractionDigits: state.cur === 'ngn' ? 0 : 2,
      });
    });
    root.querySelectorAll('[data-seat-count]').forEach(function (el) { el.textContent = seats; });
  }

  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-step-seats]');
    if (!s) return;
    var root = s.closest('[data-calc]') || document;
    var input = root.querySelector('[data-seats]');
    if (!input) return;
    input.value = (parseInt(input.value, 10) || 1) + parseInt(s.getAttribute('data-step-seats'), 10);
    recalcSeats(root);
  });
  document.addEventListener('input', function (e) {
    if (!e.target.matches('[data-seats]')) return;
    recalcSeats(e.target.closest('[data-calc]') || document);
  });

  /* ---- demo-only forms ----
     Nothing is ever sent. A form carrying data-next walks to the next screen
     so the whole journey can be clicked through; one without it shows its note
     and stays put. The brief pause is the submit button's busy state, which is
     what the real thing will do while the request is in flight. */
  document.addEventListener('submit', function (e) {
    if (!e.target.matches('[data-demo-form]')) return;
    e.preventDefault();

    var next = e.target.getAttribute('data-next');
    if (!next) {
      var note = e.target.querySelector('[data-demo-note]');
      if (note) { note.hidden = false; note.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      return;
    }

    var btn = e.target.querySelector('[type="submit"]');
    if (btn) btn.setAttribute('data-busy', '');
    var wait = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420;
    setTimeout(function () { window.location.href = next; }, wait);
  });

  /* ---- add an administrator ----
     Address, then a code, then done. There is no invitation to accept: the
     person being added confirms with a code, which works whether they are
     sitting beside you or on the phone. */
  function aaStep(n) {
    document.querySelectorAll('[data-aa-step]').forEach(function (s) {
      s.hidden = s.getAttribute('data-aa-step') !== String(n);
    });
  }

  document.addEventListener('click', function (e) {
    var panel = document.querySelector('[data-addadm]');
    if (!panel) return;

    if (e.target.closest('[data-add-admin]')) {
      panel.hidden = false;
      aaStep(1);
      panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      var f = panel.querySelector('#adm');
      if (f) f.focus();
      return;
    }

    if (e.target.closest('[data-aa-cancel]')) {
      panel.hidden = true;
      var input = panel.querySelector('#adm');
      var otp = panel.querySelector('#otp');
      if (input) input.value = '';
      if (otp) otp.value = '';
      aaStep(1);
      return;
    }

    if (e.target.closest('[data-aa-send]') || e.target.closest('[data-aa-resend]')) {
      var addr = panel.querySelector('#adm');
      var value = addr && addr.value.trim() ? addr.value.trim() : 'ngozi@adaobifoods.com';
      panel.querySelectorAll('[data-aa-addr], [data-aa-addr2]').forEach(function (el) {
        el.textContent = value;
      });
      aaStep(2);
      var code = panel.querySelector('#otp');
      if (code) { code.value = ''; code.focus(); }
      return;
    }

    if (e.target.closest('[data-aa-confirm]')) {
      aaStep(3);
      return;
    }
  });

  /* ---- change plan ----
     Three rules, stated before anything is confirmed:
       an upgrade takes effect immediately and is charged pro rata;
       a downgrade takes effect at the next billing date, never mid-term;
       extra storage is attached to the old plan and must be bought again.
     The panel says which of these apply rather than leaving the customer to
     discover them on the invoice. */
  var STORAGE_GB = 10;        // extra storage currently on the account
  var STORAGE_COST = 6000;    // naira per 10 GB per year
  var ASSIGNED_GB = 26;       // quota handed out across mailboxes today

  function naira(n) {
    return '₦' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function describePlanChange() {
    var pick = document.querySelector('[name="chgplan"]:checked');
    var out = document.querySelector('[data-plan-out]');
    if (!pick || !out) return;

    var dir = pick.getAttribute('data-dir');
    if (dir === 'same') { out.hidden = true; return; }
    out.hidden = false;

    var name = pick.getAttribute('data-name');
    var pool = parseInt(pick.getAttribute('data-pool'), 10);
    var net = parseInt(pick.getAttribute('data-net'), 10);
    var up = dir === 'up';

    var when = document.querySelector('[data-plan-when]');
    when.className = 'chg-when ' + (up ? 'now' : 'later');
    when.textContent = up ? 'Takes effect immediately' : 'Takes effect 4 March 2027';

    var items = [];
    if (up) {
      items.push('Your pool becomes <b>' + pool + ' GB</b> as soon as payment clears.');
      items.push('You pay the difference for the rest of this term, pro rata &mdash; ' +
                 'not a full year again.');
    } else {
      items.push('You stay on Business until <b>4 March 2027</b> and keep 30 GB until then. ' +
                 'Downgrades never take effect mid-term.');
      items.push('From that date your pool is <b>' + pool + ' GB</b> and you are billed ' +
                 naira(net) + ' a year.');
      if (ASSIGNED_GB > pool) {
        items.push('<b>You have ' + ASSIGNED_GB + ' GB assigned across your mailboxes.</b> ' +
                   'That is more than ' + name + ' holds, so you must lower quotas by at least ' +
                   (ASSIGNED_GB - pool) + ' GB before the change date or it will not go through.');
      }
    }

    // the storage rule applies to any change, in either direction
    items.push({
      warn: true,
      html: 'Your <b>' + STORAGE_GB + ' GB of extra storage is released</b> and not carried ' +
            'across. To keep it on ' + name + ' you would buy it again at ' +
            naira(STORAGE_COST) + ' a year.'
    });

    var list = document.querySelector('[data-plan-list]');
    list.innerHTML = items.map(function (it) {
      if (typeof it === 'string') return '<li>' + it + '</li>';
      return '<li class="warn">' + it.html + '</li>';
    }).join('');

    var cta = document.querySelector('[data-plan-cta]');
    if (cta) {
      cta.textContent = up
        ? 'Upgrade to ' + name + ' now'
        : 'Schedule ' + name + ' for 4 March 2027';
    }
  }

  document.addEventListener('change', function (e) {
    if (e.target.matches('[name="chgplan"]')) describePlanChange();
  });

  document.addEventListener('click', function (e) {
    var open = e.target.closest('[data-change-plan]');
    var close = e.target.closest('[data-plan-cancel]');
    if (!open && !close) return;
    var panel = document.querySelector('[data-plan-panel]');
    var note = document.querySelector('[data-plan-note]');
    if (!panel) return;
    panel.hidden = !open;
    if (note) note.hidden = !!open;      // the standing note is redundant while the panel is up
    if (open) {
      describePlanChange();
      panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  /* ---- add a domain: the charge follows the plan chosen ---- */
  document.addEventListener('change', function (e) {
    if (!e.target.matches('[name="newplan"]')) return;
    var out = document.querySelector('[data-add-total]');
    if (!out) return;
    var net = parseInt(e.target.getAttribute('data-net'), 10) || 0;
    var gross = net + Math.round(net * 0.075);
    out.textContent = '₦' + gross.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  });

  /* ---- add a domain: open the modal, keep its total honest ----
     A native <dialog>, so the browser handles focus trapping, Esc and the
     inert background. We add: opening, closing, a click on the backdrop,
     and locking the page behind so it cannot scroll under the sheet. */
  (function () {
    var dlg = document.querySelector('[data-add-modal]');
    if (!dlg) return;

    var opener = null;      // the control that opened it, so focus can go back
    var scrollY = 0;

    function openModal(trigger) {
      if (dlg.open) return;
      opener = trigger || null;

      // Hold the page still behind the modal. position:fixed is the only
      // approach iOS Safari honours.
      scrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.top = '-' + scrollY + 'px';
      document.body.classList.add('modal-locked');

      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');   // very old browsers: inline fallback

      // Focus the first field, but not on a phone — the keyboard would cover
      // the dialog before it has finished opening.
      if (window.matchMedia('(min-width: 720px)').matches) {
        var first = dlg.querySelector('input[type="text"]');
        if (first) first.focus();
      }
    }

    function closeModal() {
      if (!dlg.open) return;
      if (typeof dlg.close === 'function') dlg.close();
      else dlg.removeAttribute('open');
    }

    // Restore the page on close, however the close happened (button or Esc).
    dlg.addEventListener('close', function () {
      document.body.classList.remove('modal-locked');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
      if (opener && document.contains(opener)) opener.focus();
      opener = null;
    });

    document.addEventListener('click', function (e) {
      var open = e.target.closest('[data-add-domain]');
      if (open) { e.preventDefault(); openModal(open); return; }
      if (e.target.closest('[data-cancel-add]')) { closeModal(); return; }
      // A click landing on the dialog itself is outside the card, because the
      // card sits in .modal-pos and stops its own clicks.
      if (e.target === dlg) closeModal();
    });

    // Let other pages link here with #add and have the modal already open.
    // hashchange matters too: arriving from this same page only changes the
    // hash, so there is no load for the check above to run on.
    function openFromHash() { if (location.hash === '#add') openModal(null); }
    window.addEventListener('hashchange', openFromHash);
    openFromHash();
  })();


  /* ---- ACCOUNT MENU ---- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-acct] > .avatar");
    var open = document.querySelector('[data-acct] > .avatar[aria-expanded="true"]');

    if (btn) {
      var was = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", was ? "false" : "true");
      var menu = btn.parentNode.querySelector(".acct-menu");
      if (menu) menu.hidden = was;
      return;
    }
    if (open && !e.target.closest(".acct-menu")) {
      open.setAttribute("aria-expanded", "false");
      var m = open.parentNode.querySelector(".acct-menu");
      if (m) m.hidden = true;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = document.querySelector('[data-acct] > .avatar[aria-expanded="true"]');
    if (!open) return;
    open.setAttribute("aria-expanded", "false");
    var m = open.parentNode.querySelector(".acct-menu");
    if (m) m.hidden = true;
    open.focus();
  });

  /* ---- display name preview ----
     Typing a name updates the sample straight away, so nobody has to save and
     send a test message to find out what it changes. */
  document.addEventListener("input", function (e) {
    if (!e.target.matches("[data-pv-src]")) return;
    var out = document.querySelector("[data-pv-name]");
    if (out) out.textContent = e.target.value.trim() || "(no name)";
  });

  /* ============================================================
     DOMAIN SCOPE  —  one active domain across the whole mail admin
     ------------------------------------------------------------
     The switcher in the header is the single source of truth. Picking a
     domain repaints every figure, the mailbox list and the plan, and the
     choice is remembered across pages, because in the built product this
     is a page load scoped to that domain.

     Each domain is a genuinely separate tenant: its own plan, its own
     storage pool, its own mailboxes, its own record health. Nothing is
     shared, which is what the product actually promises.
     ============================================================ */
  var ZIRO_DOMAINS = {
    /* The settled domain: every record passes, nothing to chase. This is what
       a healthy domain looks like once onboarding is finished. */
    'adaobifoods.com': {
      name: 'adaobifoods.com',
      org: 'Adaobi Foods Ltd',
      plan: 'Business',
      planPrice: '₦30,000',
      planNote: '40 GB pool, unlimited mailboxes',
      poolGb: 40,
      ceil: '100 GB',
      assigned: 26,
      used: '13.5 GB',
      usedPct: 34,
      renew: 'renews 4 Mar 2027',
      renewDate: '4 March 2027',
      health: '4 of 4',
      healthNote: 'all records passing',
      healthState: 'ok',
      warn: null,
      records: {
        spf:   { state: 'ok',  note: 'Passing' },
        mx:    { state: 'ok',  note: 'Passing' },
        dkim:  { state: 'ok',  note: 'Passing' },
        dmarc: { state: 'ok',  note: 'Passing' }
      },
      placement: { gmail: '99%', outlook: '98%', yahoo: '99%' },
      reputation: { bounce: '0.4%', complaint: '0.02%',
                    note: 'Both well inside safe limits. We alert you before they become a problem.' },
      alerts: [
        { kind: 'warn', title: 'emeka@adaobifoods.com is nearly full',
          body: 'He is using 1.4 GB of 2 GB. At 100% he stops receiving mail — queued mail is held, not discarded.',
          cta: 'Raise his quota', href: 'admin-mailbox.html' }
      ],
      activity: [
        { when: '3 days',  what: '<b>You</b> created emeka@adaobifoods.com' },
        { when: '12 days', what: 'Quota for <b>sales@</b> raised from 6 GB to 8 GB' },
        { when: '4 Mar',   what: '<b>adaobifoods.com</b> finished setup — all records passing' }
      ],
      mailboxes: [
        { user: 'victory',  role: 'Owner',              gb: 12, used: 4.2, seen: 'Today, 08:14', state: 'ok' },
        { user: 'sales',    role: 'Shared · 2 people',  gb: 8,  used: 6.1, seen: 'Today, 09:02', state: 'warn' },
        { user: 'ngozi',    role: 'Staff',              gb: 4,  used: 1.8, seen: 'Yesterday',    state: 'ok' },
        { user: 'emeka',    role: 'Staff',              gb: 2,  used: 1.4, seen: 'Never',        state: 'new' }
      ]
    },

    /* The unfinished domain: DKIM was never added, so mail from it is not
       signed. Kept deliberately incomplete — the admin needs to see what a
       domain that still needs work looks like. */
    'adaobiexport.ng': {
      name: 'adaobiexport.ng',
      org: 'Adaobi Foods Ltd',
      plan: 'Starter',
      planPrice: '₦12,000',
      planNote: '10 GB pool, unlimited mailboxes',
      poolGb: 10,
      ceil: '25 GB',
      assigned: 4,
      used: '1.2 GB',
      usedPct: 12,
      renew: 'renews 18 Aug 2027',
      renewDate: '18 August 2027',
      health: '3 of 4',
      healthNote: 'DKIM missing',
      healthState: 'warn',
      warn: 'DKIM is not signing on this domain',
      records: {
        spf:   { state: 'ok',  note: 'Passing' },
        mx:    { state: 'ok',  note: 'Passing' },
        dkim:  { state: 'bad', note: 'Not found' },
        dmarc: { state: 'ok',  note: 'Passing' }
      },
      placement: { gmail: '82%', outlook: '71%', yahoo: '88%' },
      reputation: { bounce: '1.1%', complaint: '0.09%',
                    note: 'Higher than we like. Unsigned mail is treated with more suspicion, which is why the DKIM record above matters.' },
      alerts: [
        { kind: 'bad', title: 'DKIM has never been added for this domain',
          body: 'Without it your messages are unsigned, and Gmail and Outlook are placing some of them in spam. This is the one record still missing.',
          cta: 'Add the record', href: 'admin-domain.html' }
      ],
      activity: [
        { when: '2 days',  what: 'Inbox placement on <b>Outlook</b> fell to 71%' },
        { when: '18 Aug',  what: '<b>You</b> created export@adaobiexport.ng' },
        { when: '18 Aug',  what: '<b>adaobiexport.ng</b> added — DKIM step not completed' }
      ],
      mailboxes: [
        { user: 'victory', role: 'Owner',             gb: 2.5, used: 0.9, seen: 'Today, 07:51', state: 'ok' },
        { user: 'export',  role: 'Shared · 2 people', gb: 1.5, used: 0.3, seen: '3 days ago',   state: 'ok' }
      ]
    }
  };

  var ZIRO_DOM_KEY = 'ziro.activeDomain';

  function ziroActiveDomain() {
    var saved = null;
    try { saved = sessionStorage.getItem(ZIRO_DOM_KEY); } catch (err) { /* private mode */ }
    if (saved && ZIRO_DOMAINS[saved]) return saved;
    // fall back to whichever the markup marks current, else the first
    var cur = document.querySelector('[data-dom-pick][aria-current="true"]');
    var name = cur && cur.getAttribute('data-name');
    return ZIRO_DOMAINS[name] ? name : Object.keys(ZIRO_DOMAINS)[0];
  }

  function ziroEsc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function ziroInitials(user, org) {
    if (/^[a-z]+$/i.test(user) && user.length >= 2) return user.slice(0, 2).toUpperCase();
    return (org || 'ZE').slice(0, 2).toUpperCase();
  }

  /* ---- paint everything the active domain owns ---- */
  function ziroPaintDomain(key) {
    var d = ZIRO_DOMAINS[key];
    if (!d) return;

    var set = function (attr, value) {
      document.querySelectorAll('[data-dom-' + attr + ']').forEach(function (el) {
        el.removeAttribute('data-count-to');   // a count-up would overwrite this
        el.textContent = value;
      });
    };

    set('name', d.name);
    set('side', d.name);
    set('org', d.org);
    set('plan', d.plan);
    set('planprice', d.planPrice);
    set('pool', 'of a ' + d.poolGb + ' GB pool');
    set('poolgb', d.poolGb);
    set('assigned', d.assigned);
    set('ceil', d.ceil);
    set('used', d.used);
    set('renew', d.renew);
    set('renewdate', d.renewDate);
    set('health', d.health);
    set('healthnote', d.healthNote);
    set('mb', d.mailboxes.length);

    document.querySelectorAll('.dom-switch .cur').forEach(function (el) { el.textContent = d.name; });

    // keep the menu's own current marker honest
    document.querySelectorAll('[data-dom-pick]').forEach(function (a) {
      if (a.getAttribute('data-name') === key) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });

    // records warning, only where there is one
    document.querySelectorAll('[data-dom-warn]').forEach(function (el) {
      el.hidden = !d.warn;
      if (d.warn) {
        var t = el.querySelector('[data-dom-warntitle]');
        if (t) t.textContent = d.warn;
      }
    });

    set('planprice', d.planPrice);
    set('plannote', d.planNote);
    set('usedpct', d.usedPct + '%');

    // health pill colour follows the state, not just the words
    document.querySelectorAll('[data-dom-healthpill]').forEach(function (el) {
      el.className = 'pill pill-' + (d.healthState === 'ok' ? 'ok' : 'warn');
      el.textContent = d.health + ' passing';
    });

    ziroPaintPool(d);
    ziroPaintRows(d);
    ziroPaintMiniRows(d);
    ziroPaintRecords(d);
    ziroPaintAlerts(d);
    ziroPaintPlacement(d);
    ziroPaintReputation(d);
    ziroPaintActivity(d);
  }

  /* ---- the dashboard's short mailbox list ---- */
  function ziroPaintMiniRows(d) {
    var host = document.querySelector('[data-dom-minirows]');
    if (!host) return;
    host.innerHTML = d.mailboxes.map(function (m, i) {
      var pct = Math.round((m.used / m.gb) * 100);
      var pill = m.state === 'new'
        ? '<span class="pill pill-mut">Not set up</span>'
        : (pct >= 75 ? '<span class="pill pill-warn">' + pct + '% full</span>'
                     : '<span class="pill pill-ok">Active</span>');
      return '<div class="mini-row">' +
        '<div class="who">' +
          '<span class="mini-av' + (i === 0 ? ' g' : '') + '" aria-hidden="true">' + ziroInitials(m.user, d.org) + '</span>' +
          '<div style="min-width:0">' +
            '<b>' + ziroEsc(m.user) + '@' + ziroEsc(d.name) + '</b>' +
            '<span class="sub">' + ziroEsc(m.role.split(' · ')[0]) + ' &middot; ' + m.used + ' GB used</span>' +
          '</div>' +
        '</div>' + pill +
      '</div>';
    }).join('');
  }

  /* ---- authentication records ---- */
  function ziroPaintRecords(d) {
    if (!d.records) return;
    Object.keys(d.records).forEach(function (k) {
      var r = d.records[k];
      document.querySelectorAll('[data-rec="' + k + '"]').forEach(function (row) {
        var pill = row.querySelector('[data-rec-pill]');
        if (pill) {
          pill.className = 'pill pill-' + (r.state === 'ok' ? 'ok' : r.state === 'bad' ? 'bad' : 'warn');
          pill.textContent = r.state === 'ok' ? 'Passing' : (r.state === 'bad' ? 'Needs a fix' : r.note);
        }
        // the tick/cross badge beside the record name
        var ic = row.querySelector('.ic');
        if (ic) {
          ic.className = 'ic ic-' + (r.state === 'ok' ? 'ok' : 'bad');
          ic.innerHTML = r.state === 'ok'
            ? '<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="m3.6 8.4 2.8 2.8 6-6.4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
        }
        // the line under the record name
        var sub = row.querySelector('.nm > span');
        if (sub) sub.textContent = r.state === 'ok' ? 'Checked a few minutes ago' : r.note;

        // only a broken record opens itself and shows its fix
        row.open = r.state !== 'ok';
        row.setAttribute('data-state', r.state);
      });
    });
  }

  /* ---- the alerts that sit at the top of the dashboard ---- */
  function ziroPaintAlerts(d) {
    var host = document.querySelector('[data-dom-alerts]');
    if (!host) return;
    var list = d.alerts || [];
    if (!list.length) {
      host.innerHTML =
        '<div class="banner banner-ok">' +
        '<svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true" style="flex:none;margin-top:1px"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="m5 8.2 2 2 4-4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<span class="bd"><b>Nothing needs your attention</b>' +
        '<p>Every record passes and no mailbox is near its limit.</p></span></div>';
      return;
    }
    host.innerHTML = list.map(function (a) {
      var icon = a.kind === 'bad'
        ? '<path d="M8 2.6 14.4 13H1.6L8 2.6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6.6v2.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.1" r=".9" fill="currentColor"/>'
        : '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.6v4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.4" r=".9" fill="currentColor"/>';
      return '<div class="banner banner-' + (a.kind === 'bad' ? 'bad' : 'warn') + '">' +
        '<svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true" style="flex:none;margin-top:1px">' + icon + '</svg>' +
        '<span class="bd"><b>' + ziroEsc(a.title) + '</b><p>' + ziroEsc(a.body) + '</p>' +
        (a.cta ? '<a class="btn btn-line btn-sm mt-s" href="' + a.href + '">' + ziroEsc(a.cta) + '</a>' : '') +
        '</span></div>';
    }).join('');
  }

  /* ---- inbox placement figures ---- */
  function ziroPaintPlacement(d) {
    if (!d.placement) return;
    Object.keys(d.placement).forEach(function (k) {
      document.querySelectorAll('[data-place="' + k + '"]').forEach(function (el) {
        el.textContent = d.placement[k];
        var n = parseInt(d.placement[k], 10);
        el.classList.toggle('is-low', n < 95);
      });
    });
  }

  /* ---- sending reputation ---- */
  function ziroPaintReputation(d) {
    if (!d.reputation) return;
    var set = function (sel, v) {
      document.querySelectorAll(sel).forEach(function (el) { el.textContent = v; });
    };
    set('[data-dom-bounce]', d.reputation.bounce);
    set('[data-dom-complaint]', d.reputation.complaint);
    set('[data-dom-repnote]', d.reputation.note);
  }

  /* ---- recent activity ---- */
  function ziroPaintActivity(d) {
    var host = document.querySelector('[data-dom-activity]');
    if (!host || !d.activity) return;
    host.innerHTML = d.activity.map(function (a) {
      return '<div class="act"><span class="when">' + ziroEsc(a.when) + '</span>' +
             '<span class="what">' + a.what + '</span></div>';
    }).join('');
  }

  /* ---- the pool bar, one segment per mailbox then the free remainder ---- */
  function ziroPaintPool(d) {
    var bar = document.querySelector('[data-dom-poolbar]');
    var key = document.querySelector('[data-dom-poolkey]');
    if (!bar) return;

    var free = Math.max(0, d.poolGb - d.assigned);
    var segs = d.mailboxes.map(function (m, i) {
      return '<span class="pool-seg s' + (i + 1) + '" style="flex:' + m.gb + '">' + m.gb + ' GB</span>';
    });
    if (free > 0) segs.push('<span class="pool-seg free" style="flex:' + free + '">' + free + ' free</span>');
    bar.innerHTML = segs.join('');
    bar.setAttribute('aria-label',
      d.poolGb + ' GB pool: ' +
      d.mailboxes.map(function (m) { return m.user + ' ' + m.gb + ' GB'; }).join(', ') +
      (free > 0 ? ', ' + free + ' GB unassigned' : ''));

    if (key) {
      var shades = ['var(--blue)', 'var(--blue-600)', 'var(--blue-700)', 'var(--blue-800)', 'var(--blue-900)'];
      var items = d.mailboxes.map(function (m, i) {
        return '<span><i style="background:' + shades[i % shades.length] + '"></i> ' + ziroEsc(m.user) + '@</span>';
      });
      if (free > 0) items.push('<span><i style="background:#E2E8F0"></i> unassigned</span>');
      key.innerHTML = items.join('');
    }
  }

  /* ---- the mailbox rows ---- */
  function ziroPaintRows(d) {
    var body = document.querySelector('[data-dom-rows]');
    if (!body) return;

    body.innerHTML = d.mailboxes.map(function (m, i) {
      var pct = Math.round((m.used / m.gb) * 100);
      var full = pct >= 75;
      var addr = ziroEsc(m.user) + '@' + ziroEsc(d.name);

      var status, action, seenStyle = '';
      if (m.state === 'new') {
        status = '<span class="pill pill-mut">Not set up</span>';
        action = '<a class="btn btn-pri btn-sm" href="../setup-device.html">Send setup link</a>';
        seenStyle = ' style="color:var(--warn)"';
      } else {
        status = full
          ? '<span class="pill pill-warn">' + pct + '% full</span>'
          : '<span class="pill pill-ok">Active</span>';
        action = '<a class="btn btn-line btn-sm" href="admin-mailbox.html">Manage</a>';
      }

      return '' +
        '<tr>' +
          '<td>' +
            '<span class="mb-row">' +
              '<span class="mb-av' + (i === 0 ? ' b' : '') + '" aria-hidden="true">' + ziroInitials(m.user, d.org) + '</span>' +
              '<span class="who"><b>' + addr + '</b><span>' + ziroEsc(m.role) + '</span></span>' +
            '</span>' +
          '</td>' +
          '<td>' +
            '<span class="quota">' +
              '<span class="n">' + m.used + ' of ' + m.gb + ' GB</span>' +
              '<span class="bar' + (full ? ' warn' : '') + '"><i style="width:' + pct + '%"></i></span>' +
            '</span>' +
          '</td>' +
          '<td class="sm mut"' + seenStyle + '>' + ziroEsc(m.seen) + '</td>' +
          '<td>' + status + '</td>' +
          '<td><span class="act-btns">' + action + '</span></td>' +
        '</tr>';
    }).join('');
  }

  /* ---- switching ---- */
  function ziroSetDomain(key, animate) {
    if (!ZIRO_DOMAINS[key]) return;
    try { sessionStorage.setItem(ZIRO_DOM_KEY, key); } catch (err) { /* private mode */ }

    var band = document.querySelector('[data-dom-scope]');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (band && animate && !reduced) {
      band.classList.add('is-swapping');
      setTimeout(function () { ziroPaintDomain(key); band.classList.remove('is-swapping'); }, 180);
    } else {
      ziroPaintDomain(key);
    }
  }

  document.addEventListener('click', function (e) {
    var pick = e.target.closest('[data-dom-pick]');
    if (!pick) return;
    e.preventDefault();
    ziroSetDomain(pick.getAttribute('data-name'), true);

    var b = document.querySelector('[data-dom-switch] > button');
    if (b) {
      b.setAttribute('aria-expanded', 'false');
      var mm = b.parentNode.querySelector('.dom-menu');
      if (mm) mm.hidden = true;
    }
  });

  // paint on load, so the choice survives moving between pages
  if (document.querySelector('[data-dom-switch]')) {
    ziroPaintDomain(ziroActiveDomain());
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-dom-switch] > button');
    var open = document.querySelector('[data-dom-switch] > button[aria-expanded="true"]');

    if (btn) {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      var menu = btn.parentNode.querySelector('.dom-menu');
      if (menu) menu.hidden = isOpen;
      return;
    }
    // a click anywhere else closes it, except inside the menu itself
    if (open && !e.target.closest('.dom-menu')) {
      open.setAttribute('aria-expanded', 'false');
      var m = open.parentNode.querySelector('.dom-menu');
      if (m) m.hidden = true;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('[data-dom-switch] > button[aria-expanded="true"]');
    if (!open) return;
    open.setAttribute('aria-expanded', 'false');
    var m = open.parentNode.querySelector('.dom-menu');
    if (m) m.hidden = true;
    open.focus();
  });

  /* ---- onboarding: add and remove mailboxes ----
     A new card is cloned from the last one so it always carries whatever
     markup that row has. Ids are re-issued because labels point at them, and
     the pool is recalculated because the quota total has changed. */

  function renumberMailboxes(list) {
    list.querySelectorAll('[data-quota-row]').forEach(function (row, i) {
      var addr = row.querySelector('.addr-field .input');
      var quota = row.querySelector('[data-quota]');
      var aLab = row.querySelector('label[for^="a"]');
      var qLab = row.querySelector('label[for^="q"]');
      if (addr && aLab) { addr.id = 'a' + (i + 1); aLab.setAttribute('for', addr.id); }
      if (quota && qLab) { quota.id = 'q' + (i + 1); qLab.setAttribute('for', quota.id); }
    });
  }

  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-mb-add]');
    if (add) {
      var list = document.querySelector('[data-mb-list]');
      if (!list) return;
      var rows = list.querySelectorAll('[data-quota-row]');
      var last = rows[rows.length - 1];
      if (!last) return;

      var row = last.cloneNode(true);
      var addr = row.querySelector('.addr-field .input');
      if (addr) addr.value = '';
      var quota = row.querySelector('[data-quota]');
      if (quota) quota.value = 0;

      // a cloned owner row would carry the owner pill and no Remove button
      var foot = row.querySelector('.mb-foot');
      if (foot && !foot.querySelector('[data-mb-remove]')) {
        foot.innerHTML = '<span class="sm mut">We will send a setup link when you finish</span>' +
          '<button class="btn btn-quiet btn-sm" type="button" data-mb-remove>Remove</button>';
      }

      list.appendChild(row);
      renumberMailboxes(list);
      var root = row.closest('[data-pool]');
      if (root) recalcPool(root);
      if (addr) addr.focus();
      return;
    }

    var rm = e.target.closest('[data-mb-remove]');
    if (rm) {
      var target = rm.closest('[data-quota-row]');
      if (!target) return;
      var owner = document.querySelector('[data-mb-list]');
      var pool = target.closest('[data-pool]');

      // Returning the quota to the pool before removal is the whole point —
      // otherwise the freed storage silently disappears.
      target.remove();
      if (owner) renumberMailboxes(owner);
      if (pool) recalcPool(pool);
      return;
    }
  });

  /* ---- onboarding: plan choice drives every price on the page ----
     Prices live on each radio as data-year / data-month, so the markup stays
     the single source of truth and the summary can never drift from the card
     the customer actually picked. */
  /* Named apart from money() above, which reads a price off an element.
     Two `function money` declarations in one scope hoisted over each other,
     so every price on the pricing page rendered as 0. */
  function moneyNum(str) {
    return parseInt(String(str).replace(/,/g, ''), 10) || 0;
  }
  function comma(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function recalcPlan() {
    var picked = document.querySelector('[name="plan"]:checked');
    if (!picked) return;
    var termBtn = document.querySelector('[data-term][aria-pressed="true"]');
    var term = termBtn ? termBtn.getAttribute('data-term') : 'year';

    // every card shows its own price for the chosen term
    document.querySelectorAll('[name="plan"]').forEach(function (r) {
      var card = r.closest('.plan-opt');
      if (!card) return;
      var p = card.querySelector('[data-price]');
      var per = card.querySelector('[data-per]');
      if (p) p.textContent = '₦' + r.getAttribute('data-' + term);
      if (per) per.textContent = term === 'year' ? ' / year' : ' / month';
    });

    var net = moneyNum(picked.getAttribute('data-' + term));
    var vat = Math.round(net * 0.075);
    var set = function (sel, val) {
      var el = document.querySelector(sel);
      if (el) el.textContent = val;
    };
    var label = picked.closest('.plan-opt').querySelector('.nm');
    set('[data-sum-plan]', label ? label.firstChild.textContent.trim() : picked.value);
    set('[data-sum-pool]', picked.getAttribute('data-pool'));
    set('[data-sum-term]', term === 'year' ? 'Yearly' : 'Monthly');
    set('[data-sum-vat]', '₦' + comma(vat));
    set('[data-sum-total]', '₦' + comma(net + vat));
  }

  document.addEventListener('change', function (e) {
    if (e.target.matches('[name="plan"]')) recalcPlan();
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-term]');
    if (!t) return;
    document.querySelectorAll('[data-term]').forEach(function (b) {
      b.setAttribute('aria-pressed', b === t ? 'true' : 'false');
    });
    recalcPlan();
  });
  if (document.querySelector('[name="plan"]')) recalcPlan();

  /* ---- onboarding: externally-managed domain reveals the manager field ---- */
  document.addEventListener('change', function (e) {
    if (!e.target.matches('[name="domkind"]')) return;
    var ext = document.querySelector('[data-ext-only]');
    if (ext) ext.hidden = e.target.value !== 'external';
  });


  /* ---- registrar picker on the automatic-setup step ----
     Some registrars let us add the records through their API; the rest get
     the values with copy buttons. Either way nobody waits on a person. */
  var ONE_CLICK = { cloudflare: "Cloudflare", godaddy: "GoDaddy", namecheap: "Namecheap" };
  var REG_NAME = {
    whogohost: "Whogohost", qservers: "Qservers", godaddy: "GoDaddy",
    namecheap: "Namecheap", domainking: "DomainKing", truehost: "Truehost",
    cloudflare: "Cloudflare", other: "your registrar"
  };

  document.addEventListener("click", function (e) {
    var reg = e.target.closest("[data-reg]");
    if (!reg) return;

    document.querySelectorAll("[data-reg]").forEach(function (b) {
      b.setAttribute("aria-pressed", b === reg ? "true" : "false");
    });

    var key = reg.getAttribute("data-reg");
    var one = document.querySelector("[data-auto-one]");
    var man = document.querySelector("[data-auto-manual]");
    if (!one || !man) return;

    var isOne = !!ONE_CLICK[key];
    one.hidden = !isOne;
    man.hidden = isOne;

    var label = REG_NAME[key] || "your registrar";
    document.querySelectorAll("[data-reg-name], [data-reg-name2]").forEach(function (el) {
      el.textContent = label;
    });
  });
  /* ---- onboarding: re-check DNS records ----
     Resolves every record to passing and unlocks Continue. The real thing
     queries DNS; this walks the same states so the journey can be clicked
     through end to end. */
  var TICK = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none">' +
    '<path d="M13 4.8 6.4 11.4 3 8" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-check-records]');
    if (!btn) return;

    btn.setAttribute('data-busy', '');
    var wait = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900;

    setTimeout(function () {
      document.querySelectorAll('.rec').forEach(function (rec) {
        var ic = rec.querySelector('.ic');
        if (ic) { ic.className = 'ic ic-ok'; ic.innerHTML = TICK; }
        var pill = rec.querySelector('.pill');
        if (pill) { pill.className = 'pill pill-ok'; pill.textContent = 'Passing'; }
        var sub = rec.querySelector('.nm span');
        if (sub) sub.textContent = 'Verified just now';
        rec.open = false;
      });

      btn.hidden = true;
      var cont = document.querySelector('[data-continue]');
      if (cont) {
        cont.hidden = false;
        cont.removeAttribute('aria-disabled');
        cont.focus();
      }
      var hint = document.querySelector('[data-check-hint]');
      if (hint) hint.textContent = 'All four records are live. Mail will start arriving immediately.';
    }, wait);
  });

  /* ==========================================================================
     WEBMAIL
     Folders filter the list, rows can be selected, and anything that removes
     a message offers an undo — a mailbox where actions cannot be taken back
     is one people are afraid to use.
     ========================================================================== */

  var FOLDER_LABEL = {
    inbox: 'Inbox', sent: 'Sent', drafts: 'Drafts', archive: 'Archive',
    spam: 'Spam', trash: 'Trash', invoices: 'Invoices',
    suppliers: 'Suppliers', orders: 'Orders'
  };

  function rows() { return Array.prototype.slice.call(document.querySelectorAll('[data-msg]')); }
  function picked() { return rows().filter(function (r) { return r.querySelector('[data-pick]').checked; }); }
  function currentFolder() {
    var a = document.querySelector('[data-folder][aria-current="page"]');
    return a ? a.getAttribute('data-folder') : 'inbox';
  }

  /* counts come from the rows themselves, so a badge can never disagree
     with what the list shows */
  function refreshCounts() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var f = el.getAttribute('data-count');
      var unread = rows().filter(function (r) {
        return r.getAttribute('data-in') === f && r.classList.contains('unread');
      }).length;
      var all = rows().filter(function (r) { return r.getAttribute('data-in') === f; }).length;
      // Drafts and Spam count everything in them; the rest count unread.
      // A folder with no rows in this prototype keeps its seeded number
      // rather than blanking, so the sidebar still reads as a real mailbox.
      var n = (f === 'drafts' || f === 'spam') ? all : unread;
      if (all === 0 && el.dataset.seed) { el.textContent = el.dataset.seed; el.hidden = false; return; }
      el.textContent = n;
      el.hidden = n === 0;
    });
  }

  function showFolder(name) {
    var shown = 0;
    rows().forEach(function (r) {
      var match = r.getAttribute('data-in') === name;
      r.hidden = !match;
      if (match) shown++;
      var box = r.querySelector('[data-pick]');
      if (box) { box.checked = false; }
      r.classList.remove('is-picked');
    });

    document.querySelectorAll('[data-folder]').forEach(function (a) {
      if (a.getAttribute('data-folder') === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    var title = document.querySelector('[data-folder-name]');
    if (title) title.textContent = FOLDER_LABEL[name] || name;

    var note = document.querySelector('[data-folder-note]');
    if (note) {
      var unread = rows().filter(function (r) {
        return r.getAttribute('data-in') === name && r.classList.contains('unread');
      }).length;
      note.textContent = unread ? unread + ' unread' : shown + (shown === 1 ? ' message' : ' messages');
      note.hidden = shown === 0;
    }

    var empty = document.querySelector('[data-empty]');
    if (empty) {
      empty.hidden = shown > 0;
      var what = empty.querySelector('[data-empty-folder]');
      if (what) what.textContent = (FOLDER_LABEL[name] || name).toLowerCase();
    }

    syncSelection();
    refreshCounts();
  }

  function syncSelection() {
    var sel = picked();
    var bar = document.querySelector('[data-sel-bar]');
    var count = document.querySelector('[data-sel-count]');
    if (count) count.textContent = sel.length;
    if (bar) bar.hidden = sel.length === 0;

    rows().forEach(function (r) {
      r.classList.toggle('is-picked', r.querySelector('[data-pick]').checked);
    });

    var all = document.querySelector('[data-select-all]');
    if (all) {
      var visible = rows().filter(function (r) { return !r.hidden; });
      all.checked = visible.length > 0 && sel.length === visible.length;
      all.indeterminate = sel.length > 0 && sel.length < visible.length;
    }
  }

  /* ---- undo ---- */
  var undoTimer = null;
  function showUndo(text, revert) {
    var bar = document.querySelector('[data-undo]');
    if (!bar) return;
    bar.querySelector('[data-undo-text]').textContent = text;
    bar.classList.add('show');
    clearTimeout(undoTimer);

    var btn = bar.querySelector('[data-undo-go]');
    var fresh = btn.cloneNode(true);          // drop any previous handler
    btn.parentNode.replaceChild(fresh, btn);
    fresh.addEventListener('click', function () {
      revert();
      bar.classList.remove('show');
      clearTimeout(undoTimer);
    });

    undoTimer = setTimeout(function () { bar.classList.remove('show'); }, 6000);
  }

  function moveMessages(list, dest, verb) {
    if (!list.length) return;
    var was = list.map(function (r) { return { row: r, from: r.getAttribute('data-in') }; });
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    list.forEach(function (r) {
      r.querySelector('[data-pick]').checked = false;
      if (reduced) { r.setAttribute('data-in', dest); r.hidden = true; return; }
      r.style.maxHeight = r.scrollHeight + 'px';
      void r.offsetHeight;
      r.classList.add('is-going');
      setTimeout(function () {
        r.classList.remove('is-going');
        r.style.maxHeight = '';
        r.setAttribute('data-in', dest);
        r.hidden = true;
        syncSelection();
        refreshCounts();
      }, 280);
    });

    syncSelection();
    refreshCounts();

    var n = list.length;
    showUndo(n + (n === 1 ? ' message ' : ' messages ') + verb, function () {
      was.forEach(function (w) {
        w.row.setAttribute('data-in', w.from);
        w.row.hidden = w.from !== currentFolder();
        w.row.classList.remove('is-going');
        w.row.style.maxHeight = '';
      });
      showFolder(currentFolder());
    });
  }


  /* Each row has a matching <template data-body="…"> carrying that message.
     Opening a row copies its content into the reading pane, so the pane is
     never showing one message while the list highlights another. */
  function renderMessage(id) {
    var tpl = document.querySelector('[data-body="' + id + '"]');
    if (!tpl) return;
    var set = function (sel, val) {
      var el = document.querySelector(sel);
      if (el && val != null) el.textContent = val;
    };
    set("[data-r-subject]", tpl.dataset.subject ? tpl.dataset.subject.replace(/&mdash;/g, "\u2014").replace(/&#8358;/g, "\u20A6") : "");
    set("[data-r-from]", tpl.dataset.from);
    set("[data-r-addr]", tpl.dataset.addr);
    set("[data-r-when]", tpl.dataset.when);

    var av = document.querySelector("[data-r-av]");
    if (av) {
      av.textContent = tpl.dataset.initials || "";
      av.className = "msg-av " + (tpl.dataset.av || "");
    }

    // only some senders block images
    var img = document.querySelector("[data-r-images]");
    if (img) img.hidden = tpl.dataset.images !== "true";

    // and only mail you sent carries a receipt
    showReceipt(tpl);

    var slot = document.querySelector("[data-r-content]");
    if (slot) slot.innerHTML = tpl.innerHTML;

    // a reply goes to whoever sent this one
    var chip = document.querySelector("[data-quick-reply] .chip");
    if (chip) chip.textContent = tpl.dataset.from || "";
    var qr = document.querySelector("[data-quick-reply]");
    if (qr) qr.hidden = true;
  }
  /* ---- clicks ---- */
  document.addEventListener('click', function (e) {
    // folder
    var fol = e.target.closest('[data-folder]');
    if (fol) { e.preventDefault(); showFolder(fol.getAttribute('data-folder')); return; }

    // open a message
    var hit = e.target.closest('[data-open-message]');
    if (hit) {
      var pane = document.querySelector('[data-reading-pane]');
      if (!pane) return;
      var row = hit.closest('[data-msg]') || hit;
      rows().forEach(function (r) { r.classList.remove('is-active'); });
      row.classList.add('is-active');
      row.classList.remove('unread');           // reading it marks it read
      renderMessage(row.getAttribute('data-id'));
      document.body.classList.add('reading');
      pane.scrollTop = 0;
      refreshCounts();
      return;
    }

    if (e.target.closest('[data-close-message]')) {
      document.body.classList.remove('reading');
      return;
    }

    // bulk action
    var bulk = e.target.closest('[data-bulk]');
    if (bulk) {
      var what = bulk.getAttribute('data-bulk');
      var sel = picked();
      if (what === 'read') {
        sel.forEach(function (r) {
          r.classList.remove('unread');
          r.querySelector('[data-pick]').checked = false;
        });
        syncSelection();
        refreshCounts();
        return;
      }
      moveMessages(sel, what,
        what === 'archive' ? 'archived' : what === 'trash' ? 'moved to Trash' : 'reported as spam');
      return;
    }

    // single-message action from the reading pane
    var one = e.target.closest('[data-act]');
    if (one) {
      var act = one.getAttribute('data-act');
      var active = document.querySelector('[data-msg].is-active');
      if (!active) return;
      document.body.classList.remove('reading');
      moveMessages([active], act,
        act === 'archive' ? 'archived' : act === 'trash' ? 'moved to Trash' : 'reported as spam');
      return;
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.matches('[data-pick]')) { syncSelection(); return; }
    if (e.target.matches('[data-select-all]')) {
      var on = e.target.checked;
      rows().forEach(function (r) {
        if (r.hidden) return;
        r.querySelector('[data-pick]').checked = on;
      });
      syncSelection();
    }
  });

  /* ---- keyboard: the shortcuts people already know from other clients ---- */
  document.addEventListener('keydown', function (e) {
    if (!document.querySelector('[data-msg]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

    var visible = rows().filter(function (r) { return !r.hidden; });
    if (!visible.length) return;
    var active = document.querySelector('[data-msg].is-active');
    var i = visible.indexOf(active);

    function open(row) {
      if (!row) return;
      var hit = row.querySelector('[data-open-message]');
      if (hit) hit.click();
      row.scrollIntoView({ block: 'nearest' });
    }

    if (e.key === 'j') { e.preventDefault(); open(visible[Math.min(visible.length - 1, i + 1)] || visible[0]); }
    else if (e.key === 'k') { e.preventDefault(); open(visible[Math.max(0, i - 1)] || visible[0]); }
    else if (e.key === 'e' && active) { e.preventDefault(); document.body.classList.remove('reading'); moveMessages([active], 'archive', 'archived'); }
    else if (e.key === '#' && active) { e.preventDefault(); document.body.classList.remove('reading'); moveMessages([active], 'trash', 'moved to Trash'); }
    else if (e.key === 'Escape') { document.body.classList.remove('reading'); }
  });



  /* ---- read receipts on sent mail ----
     Opening something you sent tells you whether it has been read. Nothing
     is asked of you when reading mail others sent — a receipt is the
     sender's answer, not the reader's chore. */
  var RR_ICON = {
    read: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1.3 8.2c1.9-3 4.1-4.5 6.7-4.5s4.8 1.5 6.7 4.5c-1.9 2.9-4.1 4.4-6.7 4.4S3.2 11.1 1.3 8.2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="8" cy="8.2" r="1.9" stroke="currentColor" stroke-width="1.5"/></svg>',
    sent: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5 6 11.5l7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function showReceipt(tpl) {
    var line = document.querySelector("[data-rr-line]");
    if (!line) return;
    var state = tpl && tpl.dataset.rr;

    // only sent mail carries one, and only if a receipt was asked for
    if (!state || state === "off") { line.hidden = true; return; }

    line.hidden = false;
    line.classList.toggle("is-read", state === "read");
    var icon = line.querySelector("[data-rr-icon]");
    if (icon) icon.innerHTML = RR_ICON[state] || "";
    var text = line.querySelector("[data-rr-text]");
    if (text) text.textContent = tpl.dataset.rrWhen || "";
  }

  /* sending from the popup files the message in Sent, with its receipt state */
  function sendFromPopup(pop, wantsReceipt) {
    var to = pop.querySelector(".chip-to");
    var name = to ? to.textContent.trim() : (pop.querySelector("#pop-to").value || "someone");
    var subj = pop.querySelector("#pop-subject").value || "(no subject)";

    closeCompose();
    showUndo("Message sent to " + name, function () { openCompose({ to: name, subject: subj }); });

    // it appears in Sent, waiting to be opened
    var list = document.querySelector("[data-mb-list], [data-empty]");
    if (!list) return;
    var id = "s" + (document.querySelectorAll('[data-in="sent"]').length + 1);
    var row = document.createElement("div");
    row.className = "msg";
    row.setAttribute("data-msg", "");
    row.setAttribute("data-in", "sent");
    row.setAttribute("data-id", id);
    row.innerHTML =
      '<label class="pick" onclick="event.stopPropagation()">' +
      '<input type="checkbox" data-pick><span class="sr-only">Select this message</span></label>' +
      '<button class="msg-hit" data-open-message>' +
      '<span class="msg-av" aria-hidden="true">' + name.slice(0, 2).toUpperCase() + '</span>' +
      '<span class="msg-main"><span class="msg-line"><span class="from">To ' + name +
      '</span><span class="when">Just now</span></span><span class="subj">' + subj +
      '</span><span class="prev">Sent from Ziroemail…</span>' +
      (wantsReceipt ? '<span class="msg-flags"><span class="rr-state sent">' + RR_ICON.sent +
        'Not opened yet</span></span>' : "") +
      '</span></button>';
    row.hidden = currentFolder() !== "sent";
    list.parentNode.insertBefore(row, list);
    refreshCounts();
  }
  /* ---- compose: formatting, chips, attachments ---- */
  document.addEventListener('mousedown', function (e) {
    // mousedown, not click: the editor must keep its selection
    var fmt = e.target.closest('[data-fmt]');
    if (!fmt) return;
    e.preventDefault();
    var cmd = fmt.getAttribute('data-fmt');
    var body = document.querySelector('[contenteditable="true"]');
    if (body) body.focus();
    try {
      if (cmd === 'createLink') {
        var url = window.prompt('Link address', 'https://');
        if (url) document.execCommand(cmd, false, url);
      } else {
        document.execCommand(cmd, false, null);
      }
    } catch (err) { /* execCommand is deprecated but still the simplest here */ }
    fmt.setAttribute('aria-pressed', fmt.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  });

  document.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-chip-remove]');
    if (chip) { var c = chip.closest('.chip-to, .chip, .rcpt'); if (c) c.remove(); return; }

    var att = e.target.closest('[data-attach]');
    if (att) {
      var picker = document.querySelector('[data-attach-input]');
      if (picker) picker.click();
      return;
    }

    var draft = e.target.closest('[data-draft]');
    if (draft) {
      var note = document.querySelector('[data-saved]');
      if (note) { note.textContent = 'Draft saved just now'; }
      return;
    }

    var kill = e.target.closest('[data-discard]');
    if (kill) {
      if (window.confirm('Discard this message? It will not be saved.')) {
        window.location.href = 'mail.html';
      }
      return;
    }

    /* search scope chips */
    var scope = e.target.closest('[data-scope]');
    if (scope) {
      var group = scope.parentNode;
      group.querySelectorAll('[data-scope]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === scope ? 'true' : 'false');
      });
      return;
    }

    /* settings switches */
    var sw = e.target.closest('[data-switch]');
    if (sw) {
      var on = sw.getAttribute('aria-checked') === 'true';
      sw.setAttribute('aria-checked', on ? 'false' : 'true');
      return;
    }

    var save = e.target.closest('[data-save]');
    if (save) {
      var ok = save.parentNode.querySelector('[data-save-note]');
      if (ok) ok.hidden = false;
      return;
    }
  });


  /* attachments chosen from the picker join the list */
  document.addEventListener("change", function (e) {
    if (!e.target.matches("[data-attach-input]")) return;
    var list = document.querySelector("[data-att-list]");
    if (!list || !e.target.files) return;
    Array.prototype.forEach.call(e.target.files, function (f) {
      var size = f.size < 1048576 ? Math.round(f.size / 1024) + " KB"
                                  : (f.size / 1048576).toFixed(1) + " MB";
      var ext = (f.name.split(".").pop() || "FILE").toUpperCase().slice(0, 4);
      var safe = f.name.replace(/[<>&"]/g, "");
      var el = document.createElement("span");
      el.className = "att";
      el.innerHTML =
        '<span class="ic" aria-hidden="true">' + ext + '</span>' +
        '<span><b>' + safe + '</b><span class="tiny muted">' + size + '</span></span>' +
        '<button class="x" type="button" data-att-remove aria-label="Remove ' + safe + '">\u00D7</button>';
      list.appendChild(el);
    });
  });

  document.addEventListener("click", function (e) {
    var rm = e.target.closest("[data-att-remove]");
    if (rm) { var a = rm.closest(".att"); if (a) a.remove(); }
  });


  /* ==========================================================================
     COMPOSE POPUP
     A panel in the corner rather than a page, so the mailbox stays visible —
     you often need to check another message half way through a reply.
     ========================================================================== */
  function popup() { return document.querySelector("[data-compose-pop]"); }

  function openCompose(opts) {
    var pop = popup();
    if (!pop) return;
    opts = opts || {};

    pop.hidden = false;
    pop.classList.remove("is-min");
    void pop.offsetHeight;                 // flush, so the entry animates
    pop.classList.add("is-open");

    var title = pop.querySelector("[data-cp-title]");
    if (title) title.textContent = opts.title || "New message";

    var subj = pop.querySelector("#pop-subject");
    if (subj) subj.value = opts.subject || "";

    var chips = pop.querySelector("[data-cp-chips]");
    if (chips) {
      chips.querySelectorAll(".chip-to").forEach(function (c) { c.remove(); });
      if (opts.to) {
        var chip = document.createElement("span");
        chip.className = "chip-to";
        chip.innerHTML = opts.to.replace(/[<>&]/g, "") +
          '<button type="button" data-chip-remove aria-label="Remove ' +
          opts.to.replace(/["<>&]/g, "") + '">' +
          '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
          '<path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>';
        chips.insertBefore(chip, chips.querySelector("input"));
      }
    }

    var saved = pop.querySelector("[data-cp-saved]");
    if (saved) saved.hidden = true;

    // focus the first thing still empty
    var first = opts.to ? pop.querySelector("#pop-subject") : pop.querySelector("#pop-to");
    if (opts.to && opts.subject) first = pop.querySelector("[data-cp-body]");
    if (first) first.focus();
  }

  function closeCompose() {
    var pop = popup();
    if (!pop) return;
    pop.classList.remove("is-open", "is-max", "is-min");
    setTimeout(function () { pop.hidden = true; }, 200);
  }

  document.addEventListener("click", function (e) {
    var pop = popup();

    if (e.target.closest("[data-compose]")) { openCompose(); return; }
    if (!pop) return;

    if (e.target.closest("[data-cp-close]")) { closeCompose(); return; }

    if (e.target.closest("[data-cp-discard]")) {
      if (window.confirm("Discard this message? It will not be saved.")) closeCompose();
      return;
    }

    if (e.target.closest("[data-cp-min]")) {
      pop.classList.toggle("is-min");
      pop.classList.remove("is-max");
      return;
    }

    if (e.target.closest("[data-cp-max]")) {
      pop.classList.toggle("is-max");
      pop.classList.remove("is-min");
      return;
    }

    if (e.target.closest("[data-cp-cc]")) {
      var cc = pop.querySelector("[data-cp-ccfield]");
      if (cc) { cc.hidden = !cc.hidden; if (!cc.hidden) cc.querySelector("input").focus(); }
      return;
    }

    if (e.target.closest("[data-cp-send]")) {
      var wants = pop.querySelector("[data-receipt]");
      sendFromPopup(pop, wants && wants.checked);
      return;
    }
  });

  /* a minimised popup rolls back down when its bar is clicked */
  document.addEventListener("click", function (e) {
    var bar = e.target.closest(".cp-pop.is-min .cp-bar");
    if (!bar || e.target.closest(".win")) return;
    bar.closest(".cp-pop").classList.remove("is-min");
  });

  /* typing marks the draft saved, the way a real client does */
  document.addEventListener("input", function (e) {
    if (!e.target.closest("[data-compose-pop]")) return;
    var saved = document.querySelector("[data-cp-saved]");
    if (saved) saved.hidden = false;
  });
  /* ---- quick reply ---- */
  document.addEventListener('click', function (e) {
    var open = e.target.closest('[data-reply]');
    var shut = e.target.closest('[data-qr-close]');
    var send = e.target.closest('[data-qr-send]');
    var panel = document.querySelector('[data-quick-reply]');
    if (!panel) return;

    if (open) {
      panel.hidden = false;
      var sent = panel.querySelector('[data-qr-sent]');
      if (sent) sent.hidden = true;
      var ta = panel.querySelector('textarea');
      if (ta) { ta.value = ''; ta.focus(); }
      panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (shut) {
      panel.hidden = true;
    } else if (send) {
      var s2 = panel.querySelector('[data-qr-sent]');
      if (s2) s2.hidden = false;
      var t2 = panel.querySelector('textarea');
      if (t2) t2.value = '';
    }
  });

  if (document.querySelector('[data-msg]')) { showFolder('inbox'); }


  /* ---- add a mailbox ----
     The same native <dialog> as the add-domain modal. What it has to get right
     is the two things that can actually fail: an address already in use on this
     domain, and a quota larger than the pool has left. Both are checked as the
     admin types, because finding out after pressing Create means re-entering
     everything. */
  (function () {
    var dlg = document.querySelector('[data-mb-modal]');
    if (!dlg) return;

    var user = dlg.querySelector('[data-mb-user]');
    var quota = dlg.querySelector('[data-mb-quota]');
    var hint = dlg.querySelector('[data-mb-hint]');
    var poolNote = dlg.querySelector('[data-mb-pool]');
    var submit = dlg.querySelector('[data-mb-submit]');
    var pwField = dlg.querySelector('[data-mb-pwfield]');

    var opener = null, scrollY = 0;

    function domain() {
      var d = (typeof ziroActiveDomain === 'function') && ZIRO_DOMAINS[ziroActiveDomain()];
      return d || null;
    }
    function freeGb() {
      var d = domain();
      if (!d) return 0;
      var assigned = d.mailboxes.reduce(function (s, m) { return s + m.gb; }, 0);
      return Math.round((d.poolGb - assigned) * 10) / 10;
    }
    function taken(name) {
      var d = domain();
      if (!d) return false;
      return d.mailboxes.some(function (m) { return m.user.toLowerCase() === name.toLowerCase(); });
    }

    function validate() {
      var d = domain();
      if (!d) return false;

      var name = (user.value || '').trim();
      var free = freeGb();
      var want = parseFloat(quota.value);

      // address
      var nameBad = '';
      if (!name) nameBad = '';                                    // not an error until they try
      else if (!/^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/i.test(name))
        nameBad = 'Use letters, numbers, dots and hyphens, starting and ending with a letter or number.';
      else if (taken(name))
        nameBad = name + '@' + d.name + ' already exists on this domain.';

      user.setAttribute('aria-invalid', nameBad ? 'true' : 'false');
      if (hint) {
        hint.classList.toggle('is-bad', !!nameBad);
        hint.textContent = nameBad ||
          'Letters, numbers, dots and hyphens. This becomes the sign-in name.';
      }

      // quota
      var qBad = '';
      if (isNaN(want) || want <= 0) qBad = 'Give this mailbox some storage.';
      else if (want > free) qBad = 'Only ' + free + ' GB is unassigned. Lower this, free space from another mailbox, or add storage.';

      quota.setAttribute('aria-invalid', qBad ? 'true' : 'false');
      quota.max = free;
      if (poolNote) {
        poolNote.classList.toggle('is-bad', !!qBad);
        poolNote.innerHTML = qBad
          ? ziroEsc(qBad)
          : 'There is <b>' + free + ' GB</b> unassigned in the pool.';
      }

      var okNow = !!name && !nameBad && !qBad;
      if (submit) submit.disabled = !okNow;
      return okNow;
    }

    function openModal(trigger) {
      if (dlg.open) return;
      opener = trigger || null;
      scrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.top = '-' + scrollY + 'px';
      document.body.classList.add('modal-locked');

      // start clean each time, sized to what the pool can spare
      user.value = '';
      var free = freeGb();
      quota.value = free >= 2 ? 2 : (free > 0 ? free : 1);
      var first = dlg.querySelector('[name="mbpw"][value="link"]');
      if (first) first.checked = true;
      if (pwField) pwField.hidden = true;
      var note = dlg.querySelector('[data-demo-note]');
      if (note) note.hidden = true;
      validate();

      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');

      if (window.matchMedia('(min-width: 720px)').matches) user.focus();
    }

    function closeModal() {
      if (!dlg.open) return;
      if (typeof dlg.close === 'function') dlg.close();
      else dlg.removeAttribute('open');
    }

    dlg.addEventListener('close', function () {
      document.body.classList.remove('modal-locked');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
      if (opener && document.contains(opener)) opener.focus();
      opener = null;
    });

    document.addEventListener('click', function (e) {
      var open = e.target.closest('[data-add-mb]');
      if (open) { e.preventDefault(); openModal(open); return; }
      if (e.target.closest('[data-mb-cancel]')) { closeModal(); return; }
      if (e.target === dlg) closeModal();
    });

    // the password choice reveals its field
    dlg.addEventListener('change', function (e) {
      if (!e.target.matches('[name="mbpw"]')) return;
      if (pwField) pwField.hidden = e.target.value !== 'set';
    });

    dlg.addEventListener('input', function (e) {
      if (e.target === user || e.target === quota) validate();
    });

    // creating it: add to the dataset and let the renderer repaint the table
    dlg.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var d = domain();
      var sendLink = (dlg.querySelector('[name="mbpw"]:checked') || {}).value === 'link';

      d.mailboxes.push({
        user: user.value.trim(),
        role: 'Staff',
        gb: parseFloat(quota.value),
        used: 0,
        seen: 'Never',
        state: sendLink ? 'new' : 'ok'
      });
      d.assigned = d.mailboxes.reduce(function (s, m) { return s + m.gb; }, 0);

      closeModal();
      if (typeof ziroPaintDomain === 'function') ziroPaintDomain(ziroActiveDomain());
    }, true);

    // the pool moves when the domain does
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-dom-pick]')) setTimeout(validate, 260);
    });
  })();


  document.addEventListener('DOMContentLoaded', function () {
    runRise();
    runCounters();
    runRails();
    runCyclers();
    document.querySelectorAll('[data-pool]').forEach(recalcPool);
    applyPricing();
    document.querySelectorAll('[data-calc]').forEach(recalcSeats);
  });
})();

  /* ---- add storage: a typed amount, held inside the plan's ceiling ----
     The customer says how much they want rather than picking from blocks.
     The ceiling is stated beside the field and enforced as they type, so an
     amount the plan cannot carry is refused at the point of entry instead of
     at checkout. Price is per GB, pro rata from the 10 GB block price. */
  (function () {
    var field = document.querySelector('[data-st-gb]');
    if (!field) return;

    var PER_GB = 100;          // ₦100 a GB a year. Extra storage is a recurring
                               // charge that renews with the plan — it is not bought
                               // once and kept. Buying late in a term still renews on
                               // the plan's own renewal date.
    var VAT = 0.075;

    var naira = function (n) {
      return '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    var gbOf = function (s) { return parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0; };

    function pool() {
      var el = document.querySelector('[data-dom-poolgb]');
      return el ? gbOf(el.textContent) : 0;
    }
    function ceiling() {
      var el = document.querySelector('[data-dom-ceil]');
      if (!el) return 0;
      // Premium has no ceiling; the dataset says so in words
      if (/no limit|unlimited|no ceiling/i.test(el.textContent)) return Infinity;
      return gbOf(el.textContent);
    }
    function room() {
      var c = ceiling();
      return c === Infinity ? Infinity : Math.max(0, c - pool());
    }

    function setText(sel, v) {
      document.querySelectorAll(sel).forEach(function (el) { el.textContent = v; });
    }

    function recalc() {
      var max = room();
      var raw = parseInt(field.value, 10);
      var gb = isNaN(raw) ? 0 : raw;

      // the field knows its own limit
      field.max = max === Infinity ? '' : String(max);

      var note = document.querySelector('[data-st-note]');
      var tooBig = max !== Infinity && gb > max;
      var tooSmall = gb < 1;

      field.setAttribute('aria-invalid', (tooBig || (raw !== undefined && !isNaN(raw) && tooSmall)) ? 'true' : 'false');

      if (note) {
        note.className = 'gb-note' + (tooBig ? ' is-bad' : ' is-ok');
        if (tooBig) {
          var planEl = document.querySelector('[data-dom-plan]');
          var plan = planEl ? planEl.textContent : 'this';
          note.textContent = 'That is more than your ' + plan + ' plan can carry. ' +
            'The most you can add here is ' + max + ' GB — move to a larger plan for more.';
        } else if (tooSmall) {
          note.textContent = 'Enter how many gigabytes to add.';
        } else if (gb > 0) {
          note.textContent = 'Your pool becomes ' + (pool() + gb) + ' GB.';
        } else {
          note.textContent = '';
        }
      }

      // the room figure beside the limit sentence
      setText('[data-st-room]', max === Infinity ? 'as much as you need' : max + ' GB');

      // money: only on a usable figure
      var charge = (tooBig || tooSmall) ? 0 : gb;
      var net = charge * PER_GB;
      var vat = Math.round(net * VAT);
      setText('[data-sum-gb]', charge + ' GB');
      setText('[data-sum-net]', naira(net));
      setText('[data-sum-vat]', naira(vat));
      setText('[data-sum-tot]', naira(net + vat));

      // the submit is refused rather than quietly priced at zero
      var submit = document.querySelector('[data-st-sum] [type="submit"]');
      if (submit) submit.disabled = (tooBig || tooSmall);

      // the ceiling meter shows what is being added
      var adding = document.querySelector('[data-st-adding]');
      var c = ceiling();
      if (adding) {
        adding.style.width = (c === Infinity || c === 0)
          ? '0%' : Math.min(100, (charge / c) * 100) + '%';
      }
      var mark = document.querySelector('[data-st-mark]');
      if (mark) mark.textContent = pool() + ' GB now · ' + charge + ' GB being added';
      var cm = document.querySelector('[data-st-ceilmark]');
      if (cm) cm.textContent = c === Infinity ? 'no ceiling' : c + ' GB ceiling';
    }

    field.addEventListener('input', recalc);
    field.addEventListener('change', recalc);

    // the quick amounts beside the field
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-st-set]');
      if (!b) return;
      var want = b.getAttribute('data-st-set');
      var max = room();
      if (want === 'max') field.value = (max === Infinity ? 100 : max);
      else field.value = Math.min(parseInt(want, 10), max === Infinity ? parseInt(want, 10) : max);
      recalc();
      field.focus();
    });

    // repaint after a domain switch, since pool and ceiling both move
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-dom-pick]')) setTimeout(recalc, 260);
    });

    recalc();
  })();

  /* ---- mailbox sub-nav: mark the section you are reading ----
     An observer rather than a scroll handler, so it costs nothing while idle.
     Clicking still works without it; this only keeps the marker honest. */
  (function () {
    var nav = document.querySelector('.mb-nav');
    if (!nav || !('IntersectionObserver' in window)) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;

    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    var sections = links
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);

    var mark = function (id) {
      links.forEach(function (a) {
        if (a === byId[id]) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };

    // A click wins over the observer until the smooth scroll has settled,
    // otherwise the sections passing under the viewport on the way there
    // would overwrite the choice the reader just made.
    var lockUntil = 0;

    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
      if (Date.now() < lockUntil) return;
      // the topmost section currently on screen wins
      var best = null, bestTop = Infinity;
      sections.forEach(function (s) {
        if (!seen[s.id]) return;
        var top = s.getBoundingClientRect().top;
        if (top < bestTop) { bestTop = top; best = s.id; }
      });
      if (best) mark(best);
    }, { rootMargin: '-96px 0px -55% 0px', threshold: [0, 0.1, 0.5] });

    sections.forEach(function (s) { io.observe(s); });

    // clicking a link marks it at once, rather than waiting for the scroll
    nav.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      lockUntil = Date.now() + 900;
      mark(a.getAttribute('href').slice(1));
    });
  })();
