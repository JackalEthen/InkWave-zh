// Map diorama overlay. While the map is held, the camera rig swoops the RENDERED view up into a tilted overhead shot of
// the real stage (the live scene with its live ink — nothing is rebuilt; see CameraRig.mapK / _diorama). This layer
// pins the people and places onto that view, Splatoon-style:
//   · you (arrow = facing), your three teammates (weapon badge, name, [1]–[3]; greyed with a countdown while splatted),
//     your base ([4]) — enemies are not shown
//   · a virtual map cursor (pointer stays locked: mouse deltas / right stick) that snaps to pins and tilts the diorama a
//     touch toward itself; click / A on a pin, or the number keys, to Super Jump — an ink arc previews the jump
//   · a miniature finish: tilt-shift blur bands, a soft vignette, the stage name
// Per frame it only projects a handful of points and writes transforms / CSS vars when they change.
import { h, clamp } from './ui-util.js';
import { keycap, weaponIcon, richText } from './ui-icons.js';
import { t } from '../i18n/i18n.js';
import { G } from '../core/ctx.js';
import * as THREE from 'three';

const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const K = '#15121c';
const HOME_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="46" rx="22" ry="8.5" fill="none" stroke="${K}" stroke-width="8"/><ellipse cx="32" cy="46" rx="22" ry="8.5" fill="none" stroke="#fff" stroke-width="4"/><path d="M32 8 L32 34 M21 24 L32 36 L43 24" fill="none" stroke="${K}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 8 L32 34 M21 24 L32 36 L43 24" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ARROW = `<svg viewBox="-16 -16 32 32" aria-hidden="true"><path d="M0 -12 L10 10 L0 5 L-10 10 Z" fill="${K}" stroke="${K}" stroke-width="5" stroke-linejoin="round"/><path d="M0 -12 L10 10 L0 5 L-10 10 Z" fill="#fff"/></svg>`;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export class DioramaOverlay {
  constructor(root) {
    this.pins = [0, 1, 2, 3, 4].map((i) => this._pin(i));        // 0–2 allies, 3 base, 4 you
    this.arc = h('svg', { class: 'iw-dio__arc', 'aria-hidden': 'true' });
    this.arc.innerHTML = '<path class="o"/><path class="i"/>';
    this.cursor = h('div', { class: 'iw-dio__cur' }, h('i'));
    this.title = h('b', { class: 'iw-dio__name iw-display' }, '');
    this.when = h('small', { class: 'iw-dio__when' }, '');
    this.foot = h('div', { class: 'iw-dio__foot' });
    this.el = h('div', { class: 'iw-dio', 'aria-hidden': 'true' },
      h('div', { class: 'iw-dio__tilt iw-dio__tilt--top' }), h('div', { class: 'iw-dio__tilt iw-dio__tilt--bot' }),
      h('div', { class: 'iw-dio__vig' }),
      this.arc,
      h('div', { class: 'iw-dio__pins' }, this.pins.map((p) => p.el)),
      this.cursor,
      h('div', { class: 'iw-dio__head' }, h('small', { class: 'iw-dio__kicker' }, t('stage.map')), this.title, this.when),
      this.foot);
    root.prepend(this.el);
    this.k = 0; this.on = false;
    this.cx = 0.5; this.cy = 0.62; this.hover = -1; this.hasCursor = false;
    this._last = {};
  }

  _pin(i) {
    const self = i === 4, home = i === 3;
    const icon = h('span', { class: 'iw-pin__icon', html: self ? ARROW : home ? HOME_ICON : '' });
    const name = h('span', { class: 'iw-pin__name' }, self ? 'YOU' : home ? 'BASE' : '');
    const state = h('span', { class: 'iw-pin__state' });
    const el = h('div', { class: 'iw-pin' + (self ? ' iw-pin--self' : '') + (home ? ' iw-pin--home' : '') },
      h('span', { class: 'iw-pin__ground' }), h('span', { class: 'iw-pin__stem' }),
      h('span', { class: 'iw-pin__badge' }, icon, h('span', { class: 'iw-pin__pulse' })),
      self ? null : h('span', { class: 'iw-pin__key', html: keycap(String(i + 1)) }),
      name, state);
    return { el, icon, name, state, x: 0, y: 0, vis: false, key: '', weapon: null, target: null, ok: false };
  }

  update(dt, k) {
    const was = this.on;
    this.k = k;
    this.on = k > 0.002;
    if (this.on !== was) {
      this.el.classList.toggle('is-on', this.on);
      document.body.classList.toggle('iw-dio-on', this.on);
      if (this.on) { this.cx = 0.5; this.cy = 0.62; this.hover = -1; G.audio?.play?.('ui_toggle', { volume: 0.4, pitch: 0.85 }); this._head(); }
      else if (G.rig) { G.rig.dioLook.x = 0; G.rig.dioLook.y = 0; }
    }
    if (!this.on) return;
    const a = smooth(0.3, 0.95, k);
    if (Math.abs(a - (this._last.a ?? -1)) > 0.004) { this._last.a = a; this.el.style.opacity = a.toFixed(3); this.el.style.setProperty('--pinK', smooth(0.62, 1, k).toFixed(3)); }
    const me = G.match?.local;
    const cam = G.camera, W = innerWidth, H = innerHeight;
    if (!me || !cam) return;
    const allies = (G.actors || []).filter((o) => o.team === me.team && o !== me);
    const col = G.teamHex?.[me.team] || '#ff8a14';
    if (col !== this._last.col) { this._last.col = col; this.el.style.setProperty('--c', col); }
    const canJump = !!(me.alive && me.canSuperJump && me.canSuperJump());
    // ---- pins
    for (let i = 0; i < 5; i++) {
      const p = this.pins[i];
      let tgt = null, ok = false, label = '', st = '', dead = false, weapon = null;
      if (i < 3) {
        const o = allies[i];
        if (o) {
          tgt = o.pos; ok = !!(o.alive && !o.superJumpState); label = o.name; weapon = o.weaponId || o.weapon?.kind || 'shooter';
          dead = !o.alive; if (dead) st = String(Math.max(1, Math.ceil(o.respawnTimer || 0)));
          else if (o.superJumpState) st = '↑';
        }
      } else if (i === 3) { tgt = G.level?.spawnPads?.[me.team] || null; ok = !!tgt; }
      else { tgt = me.visualPos ? me.visualPos(_v2) : me.pos; ok = true; dead = !me.alive; }
      p.target = i < 3 ? allies[i] || null : null; p.ok = ok && canJump && i !== 4;
      if (!tgt) { if (p.vis) { p.vis = false; p.el.style.display = 'none'; } continue; }
      _v.set(tgt.x, tgt.y + 0.1, tgt.z).project(cam);
      const behind = _v.z > 1;
      const x = (_v.x * 0.5 + 0.5) * W, y = (0.5 - _v.y * 0.5) * H;
      p.x = x; p.y = y;
      if (behind) { if (p.vis) { p.vis = false; p.el.style.display = 'none'; } continue; }
      if (!p.vis) { p.vis = true; p.el.style.display = ''; }
      p.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      if (i === 4) {
        // facing arrow: screen-space direction of the player's forward
        const f = me.yaw || 0;
        _v2.set(tgt.x + Math.sin(f) * 3, tgt.y + 0.1, tgt.z + Math.cos(f) * 3).project(cam);
        const sx = (_v2.x - _v.x) * W, sy = -(_v2.y - _v.y) * H;   // screen space, y down
        p.icon.style.transform = `rotate(${Math.atan2(sx, -sy).toFixed(3)}rad)`;   // the arrow art points up
      }
      const key = `${label}|${st}|${dead ? 1 : 0}|${p.ok ? 1 : 0}|${this.hover === i ? 1 : 0}|${weapon}`;
      if (key !== p.key) {
        p.key = key;
        if (i < 3) {
          p.name.textContent = label;
          if (weapon !== p.weapon) { p.weapon = weapon; p.icon.innerHTML = weaponIcon(weapon); }
        }
        p.state.textContent = st;
        p.el.classList.toggle('is-dead', dead);
        p.el.classList.toggle('is-ok', p.ok);
        p.el.classList.toggle('is-hover', this.hover === i);
      }
    }
    // ---- map cursor (pointer stays locked in play: steer with mouse deltas / right stick; snaps to pins)
    const inp = G.input;
    let moved = false;
    if (inp) {
      const mdx = inp.locked ? inp.mouse.dx || 0 : 0, mdy = inp.locked ? inp.mouse.dy || 0 : 0;
      let sx = 0, sy = 0;
      if (inp.pad && inp.padAxis) { sx = inp.padAxis(2) || 0; sy = inp.padAxis(3) || 0; if (Math.hypot(sx, sy) < 0.15) sx = sy = 0; }
      if (mdx || mdy || sx || sy) {
        this.cx = clamp(this.cx + mdx / W * 1.1 + sx * dt * 0.75, 0.02, 0.98);
        this.cy = clamp(this.cy + mdy / H * 1.1 + sy * dt * 0.75, 0.04, 0.96);
        moved = true; this.hasCursor = true;
      }
    }
    // snap: nearest jumpable pin within reach
    let best = -1, bd = 72;
    for (let i = 0; i < 4; i++) {
      const p = this.pins[i];
      if (!p.vis) continue;
      const d = Math.hypot(p.x - this.cx * W, p.y - 34 - this.cy * H);
      if (d < bd) { bd = d; best = i; }
    }
    if (best !== this.hover) {
      this.hover = best;
      if (best >= 0 && this.k > 0.7) G.audio?.play?.('ui_hover', { volume: 0.4 });
    }
    const cxp = this.cx * W, cyp = this.cy * H;
    if (this.hasCursor !== this._last.hc) { this._last.hc = this.hasCursor; this.cursor.classList.toggle('is-on', this.hasCursor); }
    this.cursor.style.transform = `translate3d(${cxp.toFixed(1)}px,${cyp.toFixed(1)}px,0)`;
    this.cursor.classList.toggle('is-snap', this.hover >= 0);
    // parallax: the diorama leans a touch toward where you point
    if (G.rig) { G.rig.dioLook.x = (this.cx - 0.5) * 2; G.rig.dioLook.y = (this.cy - 0.55) * 2; }
    // click / A on a pin → super jump (number keys are handled by the player controller; flash their pin)
    if (inp && this.k > 0.7) {
      const click = (inp.locked && inp.mouse.leftPressed) || inp.padPressed?.has?.(0);
      if (click && this.hover >= 0) this._jump(this.hover, me);
      for (let i = 0; i < 4; i++) if (inp.wasPressed?.('Digit' + (i + 1))) this._flash(i);
    }
    // ---- jump arc preview
    const sp = this.pins[4], hp = this.hover >= 0 ? this.pins[this.hover] : null;
    const showArc = !!(hp && hp.vis && sp.vis && canJump && (this.hover === 3 || hp.ok));
    if (showArc !== this._last.arc) { this._last.arc = showArc; this.arc.classList.toggle('is-on', showArc); }
    if (showArc) {
      const x0 = sp.x, y0 = sp.y, x1 = hp.x, y1 = hp.y;
      const lift = Math.min(220, Math.hypot(x1 - x0, y1 - y0) * 0.55 + 40);
      const d = `M${x0.toFixed(1)} ${y0.toFixed(1)} Q${((x0 + x1) / 2).toFixed(1)} ${(Math.min(y0, y1) - lift).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      if (d !== this._last.d) { this._last.d = d; for (const path of this.arc.children) path.setAttribute('d', d); }
    }
    if (moved) this._last.mv = 1;
  }

  _jump(i, me) {
    const p = this.pins[i];
    if (!me || !me.canSuperJump || !me.canSuperJump()) { G.audio?.play?.('ui_error', { volume: 0.5 }); return; }
    let ok = false;
    if (i === 3) { const pad = G.level?.spawnPads?.[me.team]; ok = pad ? me.superJump(pad.clone()) : false; }
    else if (p.target && p.target.alive && !p.target.superJumpState) ok = me.superJump(p.target);
    this._flash(i);
    G.audio?.play?.(ok ? 'ui_confirm' : 'ui_error', { volume: 0.55 });
  }

  _flash(i) {
    const el = this.pins[i]?.el; if (!el) return;
    el.classList.remove('is-press'); void el.offsetWidth; el.classList.add('is-press');
  }

  _head() {
    const m = G.game?.mapDef;
    this.title.textContent = (m?.name || t('stage.unknown')).toUpperCase();
    this.when.textContent = G.game?.time === 'dusk' ? t('stage.dusk') : t('stage.day');
    const pad = G.input?.lastDevice === 'pad';
    this.foot.innerHTML = pad
      ? richText(t('map.foot.pad'))
      : `${keycap('1')}${keycap('2')}${keycap('3')} <span>${t('map.jump')}</span> ${keycap('4')} <span>${t('hud.base')}</span> <em>·</em> <span>${t('map.point')}</span> <em>·</em> <span>${t('map.release')}</span> ${keycap('TAB')}`;
  }
}
