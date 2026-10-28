/* Transparent Frosted Theme 透明磨砂主题 — client module.
 *
 * A master switch plus two mutually exclusive modes, both painted strictly on
 * the background layer:
 *   transparent – page fills fade to nothing, so the window (and the desktop
 *                 wallpaper behind it) is what you see; no blur at all.
 *   glass       – acrylic: page and functional boxes share one recipe of
 *                 alpha, milk tint, backdrop blur and saturation boost.
 *
 * One page slider moves the WHOLE app: the shell frame paints the single page
 * layer, the theme's page tokens are cleared for every consumer, and every
 * functional box (cards, bubbles, menus, dialogs, tagged drawers / expanded
 * pages and the boxes inside them) paints that same page fill. The settings
 * page is the only exception — it keeps its own --dtg-settings-fill slider.
 * Text, icons, borders, buttons, inputs and every control keep untouched.
 */

window.__ModuleLoader__.load({
  id: '@local/dsh-transparent-frosted',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const ATTR = 'data-dtg-glass'
    const SHELL_ATTR = 'data-dtg-shell'
    /* dsh desktop (Windows/macOS) is Electron; dsh web is any browser */
    const IN_DESKTOP = navigator.userAgent.indexOf('Electron') >= 0
    const PANEL_ATTR = 'data-dtg-page'
    const SETTINGS_ATTR = 'data-dtg-settings'
    const VERSION = '1.0.1'
    const STORE_KEY = 'dsh-transparent-frosted-theme:settings:v1'
    const LEGACY_KEYS = [
      /* settings written by the earlier "transparent glass" builds */
      'dsh-transparent-glass-theme:settings:v6',
      'dsh-transparent-glass-theme:settings:v5',
      'dsh-transparent-glass-theme:settings:v4',
      'dsh-transparent-glass-theme:settings:v3',
      'dsh-transparent-glass-theme:settings:v2',
      'dsh-transparent-glass-theme:settings:v1',
    ]
    /* one continuum per surface: 0 = heavy frost, 100 = fully clear */
    const DEFAULTS = {
      enabled: true,
      page: 72,
      settings: 62,
      particles: true,
    }
    const ZH = /^zh/i.test((navigator.language || '').toLowerCase())
    const L = (zh, en) => (ZH ? zh : en)

    /* ------------------------------------------------------------------ */
    /* settings                                                           */
    /* ------------------------------------------------------------------ */

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
    const num = (v, fallback) => (Number.isFinite(v) ? clamp(v, 0, 100) : fallback)

    function readSettings() {
      try {
        let raw = localStorage.getItem(STORE_KEY)
        if (!raw) {
          for (const key of LEGACY_KEYS) {
            raw = localStorage.getItem(key)
            if (raw) break
          }
        }
        const v = raw ? JSON.parse(raw) || {} : {}
        /* older versions had a mode switch and a separate transparency /
           frost slider per surface; keep the user's numbers by ignoring the
           mode and picking whichever value exists */
        const pick = (list, fallback) => {
          for (const key of list) {
            if (v[key] !== undefined) return num(v[key], fallback)
          }
          return fallback
        }
        return {
          enabled: v.enabled !== false,
          page: pick(['page', 'pageT', 'pageF'], DEFAULTS.page),
          settings: pick(['settings', 'cardT', 'cardF'], DEFAULTS.settings),
        }
      } catch (err) {
        return Object.assign({}, DEFAULTS)
      }
    }

    function writeSettings(s) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(s))
      } catch (err) {
        /* storage disabled: keep running with the in-memory settings */
      }
    }

    /* ------------------------------------------------------------------ */
    /* colour helpers                                                     */
    /* ------------------------------------------------------------------ */

    let probeCtx = null
    function parseColor(input) {
      if (!input) return null
      const s = String(input).trim()
      if (!s || s === 'transparent' || s === 'none') return null
      let m = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
      if (m) return [Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3])]
      m = s.match(/^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i)
      if (m) return [Math.round(+m[1] * 255), Math.round(+m[2] * 255), Math.round(+m[3] * 255)]
      try {
        if (!probeCtx) {
          const c = document.createElement('canvas')
          c.width = 1
          c.height = 1
          probeCtx = c.getContext('2d')
        }
        probeCtx.fillStyle = '#010203'
        probeCtx.fillStyle = s
        const norm = String(probeCtx.fillStyle || '')
        const hex = norm.match(/^#([0-9a-f]{6})$/i)
        if (hex) {
          const n = parseInt(hex[1], 16)
          return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
        }
        return parseColor(norm)
      } catch (err) {
        return null
      }
    }

    const rgba = (c, a) => {
      const col = c || [30, 32, 38]
      const alpha = Math.round(clamp(a, 0, 1) * 1000) / 1000
      return 'rgba(' + col[0] + ', ' + col[1] + ', ' + col[2] + ', ' + alpha + ')'
    }

    const mix = (c, target, k) => [
      Math.round(c[0] + (target[0] - c[0]) * k),
      Math.round(c[1] + (target[1] - c[1]) * k),
      Math.round(c[2] + (target[2] - c[2]) * k),
    ]


    /* The two page tokens the shell paints its columns with. Cards are NOT
       repainted through tokens: they are flattened onto the single sheet. */
    /* every surface colour the theme exposes. The page ones are cleared so the
       shell paints the sheet exactly once; the rest are cleared too, otherwise
       a list row, a chip or an input would paint its own opaque patch on top of
       the sheet and read as "independently frosted". Floating windows are
       re-painted by their own rule, so menus and tooltips stay readable. */
    const PAGE_ONLY_TOKENS = [
      '--dsw-alias-bg-base',
      '--dsw-specific-sidebar-fill',
    ]

    /* cleared on the page, but restored inside the settings panel so its rows,
       cards and selected module keep their native contrast */
    const CONTENT_TOKENS = [
      '--dsw-alias-bg-layer-1',
      '--dsw-alias-bg-layer-2',
      '--dsw-alias-bg-layer-3',
      '--dsw-specific-bubble',
      '--dsw-specific-input-major',
      '--dsw-specific-selector',
      '--dsw-specific-menu',
      '--dsw-alias-settings-card-fill',
      '--dsw-alias-markdown-code-block-banner',
    ]

    const PAGE_TOKENS = PAGE_ONLY_TOKENS.concat(CONTENT_TOKENS)

    /* floating windows keep a small fill of their own */
    const FLOAT_TOKENS = [
      ['--dsw-alias-bg-overlay', [44, 44, 46]],
      ['--dsw-alias-bg-mask-1', [0, 0, 0]],
    ]

    /* tokens sampled for the panel chrome and the card fill */
    const SAMPLE = {
      card: ['--dsw-alias-bg-layer-2', [44, 44, 46]],
      panel: ['--dsw-alias-bg-layer-1', [35, 35, 36]],
      ink: ['--dsw-alias-label-primary', [249, 250, 251]],
      line: ['--dsw-alias-border-l2', [255, 255, 255]],
    }

    const state = {
      settings: readSettings(),
      base: null,
      styleEl: null,
      observer: null,
      media: null,
      installed: false,
      timer: 0,
      applied: [],
      panels: [],
      panelTimer: 0,
      settingsHost: null,
    }

    const probe = { el: null }
    function probeEl() {
      if (!document.body) return null
      if (!probe.el || !probe.el.isConnected) {
        probe.el = document.createElement('div')
        probe.el.setAttribute('aria-hidden', 'true')
        probe.el.style.cssText =
          'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;visibility:hidden;contain:strict'
        document.body.appendChild(probe.el)
      }
      return probe.el
    }

    /* ------------------------------------------------------------------ */
    /* expanded pages                                                     */
    /* ------------------------------------------------------------------ */

    /* Everything that paints a large area inside the app — a card, a composer,
       a drawer, a trajectory / context / formation page added by another
       plugin — is tagged and flattened. The shell frame is then the only thing
       that paints, so the page slider moves the entire app as one pane and no
       component block can keep its own light behind. */
    const ATTR_SKIP_TAGS = /^(SVG|PATH|IMG|VIDEO|CANVAS|INPUT|TEXTAREA|SELECT|BUTTON|A|CODE|PRE)$/
    const ATTR_SKIP_CLASS = /_frame|_sidebarCol|_centerCol|_rightbarCol|_mainCol|_overlayLayer|dtg-/
    const MAX_FLAT = 4000

    function alphaOf(cs) {
      const m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor || '')
      if (!m) return 0
      const parts = m[1].split(/[,/]/).map((x) => x.trim())
      return parts.length > 3 ? parseFloat(parts[3]) : 1
    }

    function flatCandidates(minArea) {
      const out = []
      const all = document.body.getElementsByTagName('*')
      for (let i = 0; i < all.length && out.length < MAX_FLAT; i++) {
        const el = all[i]
        if (ATTR_SKIP_TAGS.test(el.tagName)) continue
        if (el.hasAttribute('data-slot')) continue
        if (ATTR_SKIP_CLASS.test(String(el.className || ''))) continue
        const rect = el.getBoundingClientRect()
        if (rect.width * rect.height < minArea) continue
        out.push(el)
      }
      return out
    }

    /* one element, one decision.  An element that already carries the marker is
       never measured again: our own CSS makes it transparent, so re-measuring
       would flip it back to opaque and start an oscillation loop (the flicker
       seen while hovering or scrolling).  Hover styles can never introduce a
       new flat surface because once an element is a painter it stays one. */
    function flatElement(el) {
      if (!el || el.nodeType !== 1) return false
      if (ATTR_SKIP_TAGS.test(el.tagName)) return false
      if (el.hasAttribute('data-slot') || el.hasAttribute(SETTINGS_ATTR)) return false
      if (ATTR_SKIP_CLASS.test(String(el.className || ''))) return false
      if (el.closest('.dtg-section') || el.closest('[' + SETTINGS_ATTR + ']')) return false
      const vw = window.innerWidth || 0
      const vh = window.innerHeight || 0
      if (!vw || !vh) return false
      const rect = el.getBoundingClientRect()
      const area = rect.width * rect.height
      const inFloat = !!el.closest(FLOAT)
      /* menus / popovers keep their own (floating) fill; a dialog big enough to
         be a page is part of the sheet instead */
      if (inFloat && area < vw * vh * 0.18) return false
      if (area < vw * vh * 0.03) return false
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') return false
      if (parseFloat(cs.opacity || '1') < 0.05) return false
      if (parseInt(cs.zIndex, 10) < 0) return false
      /* decorative gradient plates keep their background-image */
      if (alphaOf(cs) < 0.25) return false
      el.setAttribute(PANEL_ATTR, '')
      return true
    }

    function flatSubtree(root) {
      if (!root || root.nodeType !== 1) return
      const queue = [root]
      let guard = 0
      while (queue.length && guard < 400) {
        guard++
        const el = queue.shift()
        if (el !== root && flatElement(el)) continue
        if (el === root) flatElement(el)
        const kids = el.children
        for (let i = 0; i < kids.length; i++) queue.push(kids[i])
      }
    }

    function tagFlat() {
      if (!document.body) return
      if (!state.settings.enabled) {
        untagPanels()
        root.removeAttribute(SHELL_ATTR)
        return
      }
      const vw = window.innerWidth || 0
      const vh = window.innerHeight || 0
      if (!vw || !vh) return
      const minArea = vw * vh * 0.03
      const next = []
      const all = document.body.getElementsByTagName('*')
      for (let i = 0; i < all.length && next.length < MAX_FLAT; i++) {
        const el = all[i]
        if (el.hasAttribute(PANEL_ATTR)) {
          /* already a page painter: keep it, never re-measure */
          if (el.closest('[' + SETTINGS_ATTR + ']') || el.closest(FLOAT)) {
            el.removeAttribute(PANEL_ATTR)
          } else {
            next.push(el)
          }
          continue
        }
        if (ATTR_SKIP_TAGS.test(el.tagName)) continue
        if (el.hasAttribute('data-slot')) continue
        if (ATTR_SKIP_CLASS.test(String(el.className || ''))) continue
        const rect = el.getBoundingClientRect()
        if (rect.width * rect.height < minArea) continue
        if (flatElement(el)) next.push(el)
      }
      for (const el of state.panels) {
        if (next.indexOf(el) < 0) el.removeAttribute(PANEL_ATTR)
      }
      state.panels = next
    }

    /* the settings page is the only surface with its own slider; it is found
       structurally (a dialog that owns a nav with three or more cells) so every
       module looks identical, whoever is selected ------------------------ */
    const SETTINGS_NAV_SEL = '[class*="_navList"] [class*="_navCell"], nav [class*="_navCell"]'

    function looksLikeSettings(el) {
      try {
        if (!el || !el.querySelector) return false
        if (el.closest('.dtg-section')) return false
        return el.querySelectorAll(SETTINGS_NAV_SEL).length >= 3
      } catch (err) {
        return false
      }
    }

    function tagSettings() {
      let host = state.settingsHost && state.settingsHost.isConnected ? state.settingsHost : null
      if (!host) {
        const section = document.querySelector('.dtg-section')
        if (section) host = section.closest('[role="dialog"]')
      }
      if (!host) {
        for (const dlg of document.querySelectorAll('[role="dialog"]')) {
          if (dlg.isConnected && looksLikeSettings(dlg)) {
            host = dlg
            break
          }
        }
      }
      if (!host) {
        for (const panel of document.querySelectorAll('[class*="_panel"]')) {
          if (panel.isConnected && looksLikeSettings(panel)) {
            host = panel
            break
          }
        }
      }
      if (state.settingsHost && state.settingsHost !== host) state.settingsHost.removeAttribute(SETTINGS_ATTR)
      if (host) {
        host.setAttribute(SETTINGS_ATTR, '')
        state.settingsHost = host
        for (const el of state.panels) {
          if (host === el || host.contains(el)) el.removeAttribute(PANEL_ATTR)
        }
        state.panels = state.panels.filter((el) => el !== host && !host.contains(el))
      } else {
        state.settingsHost = null
      }
    }

    /* applied on the next frame, not after a 120 ms debounce: a page that was
       just opened must already look themed when it is first painted */
    function schedulePanels() {
      if (state.panelPending) return
      state.panelPending = true
      const run = () => {
        state.panelPending = false
        try {
          tagSettings()
          tagFlat()
        } catch (err) {}
      }
      if (window.requestAnimationFrame) window.requestAnimationFrame(run)
      else window.setTimeout(run, 16)
    }

    function untagPanels() {
      for (const el of state.panels) el.removeAttribute(PANEL_ATTR)
      state.panels = []
    }

    /* Read the theme's own values: drop our overrides first, then restore. */
    function readTheme() {
      const body = document.body
      const el = probeEl()
      if (!body || !el) return null
      /* union of what we wrote and every token we might have written, so a
         fresh module instance still sees the theme's real colours */
      const names = state.applied.slice()
      const every = PAGE_TOKENS.concat(FLOAT_TOKENS.map((entry) => entry[0]))
      for (const name of every) if (names.indexOf(name) < 0) names.push(name)
      const saved = names.map((name) => [
        name,
        body.style.getPropertyValue(name),
        body.style.getPropertyPriority(name),
      ])
      names.forEach((name) => body.style.removeProperty(name))
      const read = ([token, fallback]) => {
        try {
          el.style.backgroundColor = ''
          el.style.backgroundColor = 'var(' + token + ')'
          return parseColor(getComputedStyle(el).backgroundColor) || fallback.slice()
        } catch (err) {
          return fallback.slice()
        }
      }
      const out = { base: null, content: [], card: null, panel: null, ink: null, line: null }
      try {
        out.base = read(['--dsw-alias-bg-base', [21, 21, 23]])
        out.content = CONTENT_TOKENS.map((token) => read([token, [44, 44, 46]]))
        out.card = read(SAMPLE.card)
        out.panel = read(SAMPLE.panel)
        out.ink = read(SAMPLE.ink)
        out.line = read(SAMPLE.line)
      } finally {
        saved.forEach(([name, value, priority]) => {
          if (value) body.style.setProperty(name, value, priority)
        })
      }
      return out
    }

    /* ------------------------------------------------------------------ */
    /* apply                                                              */
    /* ------------------------------------------------------------------ */

    /* NOTE: acrylic / transparency engine v6
       transparent: 0 % = solid shell paint, 100 % = no paint at all, so what
       shows behind the text is the window itself (the desktop wallpaper).
       glass: page and functional boxes share ONE recipe. */
    const clearAlpha = (t) => clamp(1 - t / 100, 0, 1)

    /* glass (acrylic) — boxes: 0 % clear, 100 % heavy frost */
    const frostAlpha = (t) => clamp(0.18 + (t / 100) * 0.54, 0.18, 0.72)
    const frostBlur = (t) => Math.round((9 + (t / 100) * 27) * 10) / 10

    /* transparent — the box slider stops at "12 %" instead of running to a
       fully opaque slab, so it never turns into a dark hole over a bright
       wallpaper; the remaining travel is redistributed linearly */
    const clearCardAlpha = (t) => clamp((1 - 0.12) * (1 - t / 100), 0, 1)

    function apply(settings) {
      const s = settings || state.settings
      const root = document.documentElement
      const body = document.body
      if (!body) return

      if (!state.base) state.base = readTheme()
      const base = state.base

      if (!s.enabled) {
        if (root.hasAttribute(ATTR)) root.removeAttribute(ATTR)
        state.applied.forEach((name) => body.style.removeProperty(name))
        state.applied = []
        /* belt and braces: drop every surface override even if tracking was lost */
        PAGE_TOKENS.concat(FLOAT_TOKENS.map((entry) => entry[0])).forEach((token) =>
          body.style.removeProperty(token)
        )
        ROOT_VARS.forEach((name) => root.style.removeProperty(name))
        untagPanels()
        root.removeAttribute(SHELL_ATTR)
        return
      }

      if (!root.hasAttribute(ATTR)) root.setAttribute(ATTR, '')
      /* the desktop window is transparent, so the sheet shows the real desktop;
         a plain browser has no desktop behind it, so give it its own backdrop
         to frost (otherwise the page would sit on a bare white canvas) */
      root.setAttribute(SHELL_ATTR, IN_DESKTOP ? 'desktop' : 'web')

      /* ONE continuum for every surface: 0 % = heavy frost (the background is
         blurred, milky, only faintly visible), 100 % = fully clear (nothing is
         painted; only text, icons and thin borders remain) */
      const frosty = (v) => clamp((100 - v) / 100, 0, 1)
      const pageAlpha = 0.72 * frosty(s.page)
      /* the settings page keeps a floor so its text never lands on the bare
         wallpaper, but its slider still moves it independently */
      const settingsAlpha = 0.35 + 0.37 * frosty(s.settings)
      const floatAlpha = clamp(pageAlpha + 0.18, 0.35, 1)
      const tintOf = (v) => 0.12 * frosty(v)
      const blurOf = (v) => Math.round(36 * frosty(v) * 10) / 10 + 'px'

      state.applied.forEach((name) => body.style.removeProperty(name))
      state.applied = []

      const white = [255, 255, 255]
      const baseColor = base.base
      const pageColor = mix(baseColor, white, tintOf(s.page))
      const settingsColor = mix(baseColor, white, tintOf(s.settings))

      PAGE_TOKENS.forEach((token) => {
        /* cleared everywhere: the frame paints the page exactly once, so any
           column, row, chip or input that reads the token stops stacking a
           second sheet of its own */
        body.style.setProperty(token, 'transparent')
        state.applied.push(token)
      })
      FLOAT_TOKENS.forEach(([token]) => {
        body.style.setProperty(token, rgba(pageColor, floatAlpha))
        state.applied.push(token)
      })

      const set = (name, value) => root.style.setProperty(name, value)
      ;(base.content || []).forEach((color, i) => set('--dtg-c' + i, rgba(color, 1)))
      set('--dtg-page-fill', rgba(pageColor, pageAlpha))
      set('--dtg-settings-fill', rgba(settingsColor, settingsAlpha))
      set('--dtg-float-fill', rgba(pageColor, floatAlpha))
      set('--dtg-ink', rgba(base.ink, 1))
      set('--dtg-ink-dim', rgba(base.ink, 0.72))
      set('--dtg-line', rgba(base.line, 0.24))
      set('--dtg-line-soft', rgba(base.line, 0.13))
      set('--dtg-card-bg', rgba(base.panel, 0.88))
      set('--dtg-blur-page', blurOf(s.page))
      set('--dtg-blur-settings', Math.round((9 + 27 * frosty(s.settings)) * 10) / 10 + 'px')

      schedulePanels()
      syncWhale(s.enabled && s.particles !== false)
    }

    let whale = null

    function syncWhale(on) {
      if (on && !whale) whale = mountWhale()
      else if (!on && whale) {
        whale.dispose()
        whale = null
      }
    }

    function refresh() {
      state.base = readTheme()
      apply(state.settings)
    }

    /* ------------------------------------------------------------------ */
    /* stylesheet                                                         */
    /* ------------------------------------------------------------------ */

    /* genuinely floating overlays keep a small opaque floor so a menu stays
       readable; everything else is flattened onto the single page sheet */
    const FLOAT = [
      '[class*="_menu"]', '[class*="_popover"]', '[class*="_dropdown"]',
      '[class*="_dialog"]', '[class*="_modal"]', '[class*="_tooltip"]',
      '[role="menu"]', '[role="dialog"]', '[role="listbox"]', '[role="tooltip"]',
    ].join(', ')

    /* ------------------------------------------------------------------ */
    /* whale particles (optional decoration, ported from the MIT-licensed   */
    /* DSH-Transparent-UI-Plugin: the 24×18 brand fish sampled onto a 60×60 */
    /* grid, assembled as additive particles)                              */
    /* ------------------------------------------------------------------ */

    const WHALE_SVG =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="18" viewBox="0 0 24 18" fill="none">' +
      '<path d="M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746V14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z" fill="#FFFFFF"/></svg>'

    const WHALE_GRID = 60
    const WHALE_UNIT = 0.18
    const WHALE_FPS = 30
    const WORLD_H = 2 * 18 * Math.tan((50 * Math.PI) / 360)

    const smoothstep = (a, b, t) => {
      const x = Math.min(1, Math.max(0, (t - a) / (b - a)))
      return x * x * (3 - 2 * x)
    }

    /* cheap per-particle noise in [-0.5, 0.5] */
    const hashNoise = (n) => {
      const s = Math.sin(n * 12.9898) * 43758.5453
      return s - Math.floor(s) - 0.5
    }

    /* mount the decorative particle layer; returns a disposer */
    function mountWhale() {
      const holder = document.createElement('div')
      holder.id = 'dtg-whale'
      const canvas = document.createElement('canvas')
      holder.appendChild(canvas)
      document.body.appendChild(holder)

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        holder.remove()
        return { dispose: () => {} }
      }

      const reduced =
        typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
      const particles = []
      let raf = 0
      let timer = 0
      let disposed = false
      let startedAt = performance.now()
      let dpr = 1
      let scale = 1
      let width = 0
      let height = 0

      const resize = () => {
        const col = document.querySelector('[class*="_centerCol"]') || document.querySelector('[class*="_frame"]')
        const rect = col ? col.getBoundingClientRect() : null
        const ok = rect && rect.width > 0
        const box = ok ? rect : { left: 0, top: 0, width: innerWidth, height: innerHeight }
        const size = Math.round(
          Math.max(200, Math.min(480, innerHeight * 0.58, box.width * 0.72))
        )
        const left = Math.round(box.left + box.width / 2 - size / 2)
        const top = Math.round(box.top + box.height / 2 - size / 2 - box.height * 0.1)
        if (width !== size) {
          holder.style.width = size + 'px'
          holder.style.height = size + 'px'
          width = size
          height = size
          dpr = Math.min(devicePixelRatio || 1, 1.5)
          canvas.width = Math.round(size * dpr)
          canvas.height = Math.round(size * dpr)
          scale = size / WORLD_H
        }
        holder.style.left = left + 'px'
        holder.style.top = top + 'px'
      }

      const sample = (img) => {
        const off = document.createElement('canvas')
        off.width = WHALE_GRID
        off.height = WHALE_GRID
        const octx = off.getContext('2d')
        if (!octx) return
        octx.fillStyle = '#000'
        octx.fillRect(0, 0, WHALE_GRID, WHALE_GRID)
        const fit = Math.min(WHALE_GRID / img.width, WHALE_GRID / img.height)
        const w = img.width * fit
        const h = img.height * fit
        octx.drawImage(img, (WHALE_GRID - w) / 2, (WHALE_GRID - h) / 2, w, h)
        const data = octx.getImageData(0, 0, WHALE_GRID, WHALE_GRID).data
        const n = WHALE_GRID
        const lum = new Float32Array(n * n)
        for (let i = 0; i < n * n; i++) {
          lum[i] = (0.299 * data[4 * i] + 0.587 * data[4 * i + 1] + 0.114 * data[4 * i + 2]) / 255
        }
        const bright = (x, y) => x >= 0 && y >= 0 && x < n && y < n && lum[y * n + x] > 0.2
        const hasNeighbour = (x, y) => {
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              if (!dx && !dy) continue
              if (bright(x + dx, y + dy)) return true
            }
          }
          return false
        }
        for (let y = 0; y < n; y++) {
          for (let x = 0; x < n; x++) {
            const a = lum[y * n + x]
            if (a <= 0.2 || !hasNeighbour(x, y)) continue
            let dim = 0
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (!dx && !dy) continue
                if (!bright(x + dx, y + dy)) dim++
              }
            }
            const phi = Math.random() * Math.PI * 2
            const theta = Math.acos(2 * Math.random() - 1)
            const rad = 3 * (0.4 + 0.6 * Math.random())
            particles.push({
              x: (x - n / 2) * WHALE_UNIT,
              y: (n / 2 - y) * WHALE_UNIT,
              opacity: a,
              edge: dim / 8,
              sx: Math.sin(theta) * Math.cos(phi) * rad,
              sy: Math.sin(theta) * Math.sin(phi) * rad,
            })
          }
        }
      }

      const draw = (assembly, t) => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, width, height)
        ctx.globalCompositeOperation = 'lighter'
        const size = Math.max(1, 0.048 * scale * dpr)
        const breathe = 0.15 * Math.sin(0.4 * t)
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]
          const loose = (0.25 + 0.75 * p.edge) * assembly
          let x = p.x + hashNoise(i) * 0.05 * loose
          let y = p.y + hashNoise(i * 1.37 + 7) * 0.05 * loose
          x += Math.sin(t * 0.5 + i * 0.53) * 0.06 * loose
          y += Math.cos(t * 0.42 + i * 0.71) * 0.06 * loose
          const tail = smoothstep(0.5, 4.5, p.x) * assembly
          y += Math.sin(t * 1.1 - p.x * 0.7) * 0.1 * tail
          x += Math.cos(t * 0.9 - p.x * 0.55) * 0.05 * tail
          x = p.sx + (x - p.sx) * assembly
          y = p.sy + (y - p.sy) * assembly
          const dist = Math.sqrt(x * x + y * y)
          const glow = smoothstep(8, 0, dist) * 0.22 * assembly
          const shimmer = Math.sin(t * 1.5 + x * 5 + y * 3) * 0.1 + 0.9
          const alpha = p.opacity * (0.3 + 0.2 * assembly + glow) * shimmer
          if (alpha <= 0.004) continue
          const sx = width / 2 + x * scale - size / 2
          const sy = height / 2 - (y + breathe) * scale - size / 2
          ctx.fillStyle = 'rgba(206, 218, 242, ' + alpha.toFixed(3) + ')'
          ctx.fillRect(sx, sy, size, size)
        }
        ctx.globalCompositeOperation = 'source-over'
      }

      const start = () => {
        if (disposed) return
        let last = performance.now()
        const step = (now) => {
          if (disposed) return
          raf = requestAnimationFrame(step)
          if (now - last < 1000 / WHALE_FPS) return
          last = now
          const elapsed = (now - startedAt) / 1000
          const raw = Math.min(1, Math.max(0, (elapsed - 0.3) / 2.5))
          draw(smoothstep(0, 1, 1 - Math.pow(1 - raw, 3)), elapsed)
        }
        raf = requestAnimationFrame(step)
      }

      resize()
      const img = new Image()
      img.onload = () => {
        if (disposed) return
        sample(img)
        resize()
        if (reduced) draw(1, 2)
        else start()
        /* the conversation column can mount after the plugin */
        timer = window.setTimeout(() => {
          if (!disposed) {
            resize()
            if (reduced) draw(1, 2)
          }
        }, 700)
      }
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(WHALE_SVG)

      return {
        dispose: () => {
          disposed = true
          cancelAnimationFrame(raf)
          window.clearTimeout(timer)
          holder.remove()
        },
      }
    }

    const CSS = `
/* the shell paints nothing: what shows through is the window itself, i.e.
   the desktop wallpaper (the desktop app's main window is transparent) ---- */
/* dsh web: there is no desktop behind the window, so paint one. It lives on
   body (behind the sheet, same backdrop root) and therefore gets blurred by the
   frost exactly like the real wallpaper does on the desktop. --------------- */
html[${ATTR}][${SHELL_ATTR}="web"] body{
  background-color:#0c0d11 !important;
  background-image:
    radial-gradient(1100px 780px at 8% -10%, rgba(96, 132, 255, 0.38), transparent 62%),
    radial-gradient(900px 700px at 100% 0%, rgba(150, 104, 255, 0.30), transparent 64%),
    radial-gradient(1000px 820px at 50% 118%, rgba(44, 176, 168, 0.24), transparent 66%) !important;
  background-attachment:fixed !important;
  background-repeat:no-repeat !important;
}

html[${ATTR}] body{
  background-color:transparent !important;
  background-image:none !important;
  /* body must be a stacking context so the sheet can sit at z-index:-1,
     above body's own paint but below every piece of app content ---------- */
  isolation:isolate;
}
/* THE sheet: one fixed layer, one blur. It is deliberately NOT an ancestor of
   any scroll container, which is what used to make the conversation area
   re-filter itself into a grey patch while scrolling. --------------------- */
html[${ATTR}] body::before{
  content:'';
  position:fixed;
  inset:0;
  z-index:-1;
  pointer-events:none;
  background-color:var(--dtg-page-fill);
  backdrop-filter:blur(var(--dtg-blur-page)) saturate(150%) brightness(1.04);
  -webkit-backdrop-filter:blur(var(--dtg-blur-page)) saturate(150%) brightness(1.04);
}
/* decorative particle whale: a negative-z body child, so it paints above the
   sheet and below every piece of app content ----------------------------- */
html[${ATTR}] #dtg-whale{
  position:fixed;
  z-index:-1;
  pointer-events:none;
  mix-blend-mode:screen;
  opacity:.92;
}
html[${ATTR}] #dtg-whale canvas{
  display:block;
  width:100%;
  height:100%;
}

/* no second page paint anywhere in the shell --------------------------- */
html[${ATTR}],
html[${ATTR}] #root{
  background-color:transparent !important;
  background-image:none !important;
}
html[${ATTR}] :is([class*="_frame"], [class*="_centerCol"], [class*="_mainCol"], [class*="_rightbarCol"], [class*="_appShell"]){
  background-image:none !important;
}
html[${ATTR}] [class*="_overlayLayer"]{
  background-color:transparent !important;
  background-image:none !important;
}
html[${ATTR}] [data-windows-titlebar]{
  background-color:transparent !important;
}

/* ONE sheet for the whole app: the shell frame paints it exactly once, and
   everything else — columns, cards, composer, drawers, plugin pages, the
   blocks inside them — is flattened so it cannot stack a second fill. One
   slider therefore moves every surface by the same amount. --------------- */
html[${ATTR}] [class*="_frame"]{
  background-color:transparent !important;
  background-image:none !important;
  backdrop-filter:none !important;
  -webkit-backdrop-filter:none !important;
}
html[${ATTR}] :is(
  [class*="_sidebarCol"], [class*="_centerCol"], [class*="_rightbarCol"],
  [class*="_mainCol"], [class*="_root"], [${PANEL_ATTR}]
){
  background-color:transparent !important;
  background-image:none !important;
}
/* the sidebar's primary action has a hard-coded fill in the theme; it becomes
   part of the sheet too, so it moves with the page slider like everything else */
html[${ATTR}] [class*="_newSession"],
html[${ATTR}] [class*="_newSession"] *{
  background-color:transparent !important;
  background-image:none !important;
}

/* floating windows (menus, popovers, dialogs) keep a small floor so they stay
   readable; a *page* opened as a dialog is exempt (see [${PANEL_ATTR}]) ---- */
html[${ATTR}] :is(${FLOAT}){
  background-color:var(--dtg-float-fill) !important;
}

/* a page opened by any plugin button — drawer, trajectory, context, a big
   dialog — is the sheet itself, so it must win over the float rule -------- */
html[${ATTR}] [${PANEL_ATTR}]{
  background-color:transparent !important;
  background-image:none !important;
}
html[${ATTR}] [${PANEL_ATTR}] [${PANEL_ATTR}]{
  background-color:transparent !important;
}

/* the settings page answers to its own slider and to nothing else -------- */
html[${ATTR}] [${SETTINGS_ATTR}]{
  background-color:var(--dtg-settings-fill) !important;
  /* the settings page restores the theme's own surface colours internally, so
     its rows, cards and the selected module keep their native contrast */
${CONTENT_TOKENS.map((token, i) => `  ${token}:var(--dtg-c${i});`).join("\n")}
}
html[${ATTR}] [${SETTINGS_ATTR}] :is(${FLOAT}, [${PANEL_ATTR}]){
  background-color:transparent !important;
  background-image:none !important;
}
/* the module list keeps a visible current-item marker even though the sheet
   underneath it is transparent ---------------------------------------------- */
html[${ATTR}] [${SETTINGS_ATTR}] [class*="_navCell"][class*="_active"],
html[${ATTR}] [${SETTINGS_ATTR}] [class*="_navCell"][aria-current]{
  background-color:rgba(128, 128, 128, 0.18) !important;
}
html[${ATTR}] [${SETTINGS_ATTR}] [class*="_navCell"]:hover{
  background-color:rgba(128, 128, 128, 0.1) !important;
}

/* component boxes (buttons, tabs, code blocks, file cards…) do not paint their
   own surface: they sit on the single sheet, so they always match the page.
   The rule still forces transparency so a hover/active style cannot bring a
   native fill back, which is what used to make boxes look independently
   frosted (and made their look change on interaction) ---------------------- */
html[${ATTR}] :is(
  button, [role="button"], summary,
  [class*="_btn"], [class*="_button"], [class*="_chip"], [class*="_tab"],
  [class*="_codeBlock"], [class*="_fileCard"], [class*="_attachment"],
  [class*="_blockCard"], [class*="_toolCard"], pre, code
):not([class*="_primary"], [class*="_send"], [class*="_brand"], [class*="_danger"]){
  background-color:transparent !important;
  background-image:none !important;
  backdrop-filter:none !important;
  -webkit-backdrop-filter:none !important;
}

/* the frost happens exactly ONCE, on the body sheet above; the shell and every
   plugin page must not filter again, otherwise a scrolling pane re-samples its
   own backdrop and shows up as an independent grey patch --------------------- */
html[${ATTR}] :is([class*="_frame"], [${PANEL_ATTR}], [${FLOAT}]){
  backdrop-filter:none !important;
  -webkit-backdrop-filter:none !important;
}

/* the settings page keeps its own, independent frost --------------------- */
html[${ATTR}] [${SETTINGS_ATTR}]{
  backdrop-filter:blur(var(--dtg-blur-settings)) saturate(125%) !important;
  -webkit-backdrop-filter:blur(var(--dtg-blur-settings)) saturate(125%) !important;
}


/* ---- settings section ------------------------------------------------ */
.dtg-section{
  display:flex;
  flex-direction:column;
  gap:18px;
  max-width:660px;
  padding:4px 0 28px;
  color:var(--dsw-alias-label-primary, var(--dtg-ink));
  font-size:13px;
  line-height:1.55;
}
.dtg-head{
  display:flex;
  gap:14px;
  align-items:flex-start;
}
.dtg-logo{
  flex:0 0 auto;
  width:40px;
  height:40px;
  color:var(--dtg-ink);
  opacity:.9;
}
.dtg-title{
  font-size:15px;
  font-weight:600;
}
.dtg-ver{
  margin-left:8px;
  font-size:11px;
  font-weight:400;
  opacity:.45;
  letter-spacing:.02em;
}
.dtg-desc{
  margin-top:2px;
  color:var(--dsw-alias-label-tertiary, var(--dtg-ink));
  opacity:.78;
  font-size:12px;
}
.dtg-master{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:18px;
  padding:16px 18px;
  border-radius:14px;
  border:1.5px dashed var(--dtg-line);
  background:var(--dtg-card-bg);
  transition:border-color .16s ease, box-shadow .16s ease, background-color .16s ease;
}
.dtg-master-on{
  border-style:solid;
  border-color:var(--dsw-alias-brand-primary, #4d6bfe);
  box-shadow:0 0 0 3px rgba(109, 130, 255, .14), inset 0 1px 0 rgba(255,255,255,.05);
}
.dtg-master-title{
  font-size:14.5px;
  font-weight:600;
  letter-spacing:.01em;
}
.dtg-master-text{
  display:flex;
  flex-direction:column;
  gap:2px;
}
.dtg-master-note{
  font-size:11.5px;
  color:var(--dsw-alias-label-tertiary, var(--dtg-ink));
  opacity:.72;
}
/* the power control: a framed capsule with a state word + a big switch, so the
   boundary of the control is unmistakable even on a translucent panel ------- */
.dtg-power{
  display:flex;
  align-items:center;
  gap:10px;
  flex:0 0 auto;
  padding:5px 8px 5px 12px;
  border-radius:999px;
  border:1.5px solid var(--dtg-line);
  background:rgba(255,255,255,.05);
  cursor:pointer;
  transition:border-color .16s ease, background-color .16s ease;
}
.dtg-power:hover{
  border-color:var(--dtg-ink);
  background:rgba(255,255,255,.09);
}
.dtg-power-on{
  border-color:var(--dsw-alias-brand-primary, #4d6bfe);
  background:rgba(109,130,255,.14);
}
.dtg-power-state{
  font-size:12px;
  font-weight:600;
  letter-spacing:.08em;
  color:var(--dtg-ink);
  opacity:.85;
  min-width:16px;
  text-align:center;
}
.dtg-power-on .dtg-power-state{
  color:var(--dsw-alias-brand-primary, #8ea2ff);
  opacity:1;
}
.dtg-switch{
  position:relative;
  flex:0 0 auto;
  width:46px;
  height:26px;
  padding:0;
  border-radius:999px;
  border:1px solid var(--dtg-line);
  background:var(--dtg-line-soft);
  transition:background-color .16s ease, border-color .16s ease;
}
.dtg-switch.dtg-on{
  background:var(--dsw-alias-brand-primary, #4d6bfe);
  border-color:transparent;
}
.dtg-knob{
  position:absolute;
  top:2px;
  left:2px;
  width:20px;
  height:20px;
  border-radius:50%;
  background:#fff;
  box-shadow:0 1px 3px rgba(0,0,0,.28);
  transition:transform .16s ease;
}
.dtg-switch.dtg-on .dtg-knob{
  transform:translateX(20px);
}
.dtg-toggle-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  padding:6px 2px;
}
.dtg-toggle-text{
  display:flex;
  flex-direction:column;
  gap:3px;
  min-width:0;
}
.dtg-toggle-note{
  font-size:11.5px;
  color:var(--dtg-ink-dim);
  opacity:.8;
}
.dtg-hint{
  color:var(--dsw-alias-brand-primary, var(--dtg-ink));
  opacity:.9;
}
.dtg-mode:hover{
  border-color:var(--dtg-line);
}
.dtg-mode-on{
  border-color:var(--dsw-alias-brand-primary, #4d6bfe);
  box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary, #4d6bfe);
}
.dtg-radio{
  position:absolute;
  left:14px;
  top:14px;
  width:16px;
  height:16px;
  border-radius:50%;
  border:1.5px solid var(--dtg-line);
  display:flex;
  align-items:center;
  justify-content:center;
}
.dtg-mode-on .dtg-radio{
  border-color:var(--dsw-alias-brand-primary, #4d6bfe);
}
.dtg-mode-on .dtg-radio::after{
  content:'';
  width:8px;
  height:8px;
  border-radius:50%;
  background:var(--dsw-alias-brand-primary, #4d6bfe);
}
.dtg-group{
  border:1px solid var(--dtg-line-soft);
  border-radius:12px;
  padding:14px 16px;
  display:flex;
  flex-direction:column;
  gap:16px;
  background-color:var(--dtg-card-bg);
}
.dtg-field{
  display:flex;
  flex-direction:column;
  gap:8px;
}
.dtg-field-head{
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  gap:12px;
}
.dtg-label{
  font-weight:500;
}
.dtg-value{
  font-variant-numeric:tabular-nums;
  color:var(--dsw-alias-label-tertiary, var(--dtg-ink));
  opacity:.8;
  font-size:12px;
}
.dtg-range{
  width:100%;
  height:20px;
  margin:0;
  accent-color:var(--dsw-alias-brand-primary, #4d6bfe);
  cursor:pointer;
}
.dtg-scale{
  display:flex;
  justify-content:space-between;
  font-size:11px;
  color:var(--dsw-alias-label-tertiary, var(--dtg-ink));
  opacity:.66;
}
.dtg-off{
  opacity:.42;
  pointer-events:none;
  filter:grayscale(.6);
}
/* whole plugin switched off: mode cards, sliders and reset all go quiet */
.dtg-idle .dtg-group,
.dtg-idle .dtg-actions{
  opacity:.4;
  pointer-events:none;
}
.dtg-idle .dtg-group *,
.dtg-idle .dtg-actions *{
  cursor:not-allowed !important;
}
.dtg-idle .dtg-range::-webkit-slider-thumb{
  background:var(--dtg-ink-dim) !important;
  box-shadow:none !important;
}
.dtg-actions{
  display:flex;
  gap:10px;
  align-items:center;
}
.dtg-btn{
  appearance:none;
  border:1px solid var(--dtg-line);
  background:var(--dtg-card-bg);
  color:inherit;
  font:inherit;
  padding:6px 14px;
  border-radius:8px;
  cursor:pointer;
}
.dtg-btn:hover{
  border-color:var(--dsw-alias-brand-primary, #4d6bfe);
  color:var(--dsw-alias-brand-primary, #4d6bfe);
}
.dtg-btn:disabled{
  opacity:.42;
  pointer-events:none;
}
`

    /* ------------------------------------------------------------------ */
    /* settings UI                                                        */
    /* ------------------------------------------------------------------ */

    /* line-art mark, no tile / no frame: two overlapping panes plus a few
       frost grains, drawn with strokes so it reads on any background */
    const LOGO = h(
      'svg',
      {
        className: 'dtg-logo',
        viewBox: '0 0 64 64',
        width: 40,
        height: 40,
        fill: 'none',
        'aria-hidden': 'true',
        focusable: 'false',
      },
      h(
        'g',
        {
          stroke: 'currentColor',
          strokeWidth: '2',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        h('rect', { x: '9', y: '15', width: '28', height: '28', rx: '7', opacity: '0.75' }),
        h('rect', { x: '23', y: '21', width: '32', height: '30', rx: '8' }),
        h('path', { d: 'M30 31h12', opacity: '0.7' }),
        h('path', { d: 'M30 38h18', opacity: '0.45' }),
        h('path', { d: 'M30 45h9', opacity: '0.3' })
      )
    )

    function Switch(props) {
      return h(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': props.checked,
          'aria-label': props.label,
          className: 'dtg-switch' + (props.checked ? ' dtg-on' : ''),
          onClick: () => props.onChange(!props.checked),
        },
        h('span', { className: 'dtg-knob' })
      )
    }

    function Slider(props) {
      return h(
        'div',
        { className: 'dtg-field' + (props.disabled ? ' dtg-off' : ''), 'aria-disabled': props.disabled || undefined },
        h(
          'div',
          { className: 'dtg-field-head' },
          h('span', { className: 'dtg-label' }, props.label),
          h('span', { className: 'dtg-value' }, props.value + '%')
        ),
        h('input', {
          className: 'dtg-range',
          type: 'range',
          min: 0,
          max: 100,
          step: 1,
          value: props.value,
          disabled: props.disabled,
          tabIndex: props.disabled ? -1 : 0,
          'aria-label': props.label,
          onChange: (e) => props.onChange(Number(e.currentTarget.value)),
        }),
        h(
          'div',
          { className: 'dtg-scale' },
          h('span', null, props.left),
          h('span', null, props.right)
        )
      )
    }

    /* the single entry point that changes settings: used by the panel and by
       the debugging hook, so both behave identically */
    function patchSettings(p) {
      const next = Object.assign({}, state.settings, p || {})
      next.page = clamp(Number(next.page), 0, 100) || 0
      next.settings = clamp(Number(next.settings), 0, 100) || 0
      next.enabled = next.enabled !== false
      state.settings = next
      writeSettings(next)
      apply(next)
      try {
        window.dispatchEvent(new Event('dtg:settings'))
      } catch (err) {}
      return next
    }

    function GlassSection() {
      const [s, setS] = React.useState(() => state.settings)
      React.useEffect(() => {
        const sync = () => setS(state.settings)
        window.addEventListener('dtg:settings', sync)
        return () => window.removeEventListener('dtg:settings', sync)
      }, [])
      const patch = (p) => setS(patchSettings(p))
      const on = s.enabled
      return h(
        'div',
        { className: 'dtg-section' + (on ? '' : ' dtg-idle') },
        h(
          'div',
          { className: 'dtg-head' },
          LOGO,
          h(
            'div',
            null,
            h(
              'div',
              { className: 'dtg-title' },
              L('透明磨砂主题', 'Transparent Frosted Theme'),
              h('span', { className: 'dtg-ver' }, 'v' + VERSION)
            ),
            h(
              'div',
              { className: 'dtg-desc' },
              L(
                '只影响背景层：文字、按钮和所有交互组件保持原样。滑杆向左是磨砂，向右是透明。',
                'Background layer only: text, buttons and every control stay untouched. Left = frost, right = clear.'
              ),
              h('br'),
              h(
                'span',
                { className: 'dtg-hint' },
                L(
                  '深色主题下效果最佳 —— 你的电脑桌面壁纸就是 DeepSeek Harness 的背景皮肤。',
                  'Best on a dark theme — your desktop wallpaper becomes the background skin of DeepSeek Harness.'
                )
              )
            )
          )
        ),
        h(
          'div',
          { className: 'dtg-master' + (on ? ' dtg-master-on' : '') },
          h(
            'div',
            { className: 'dtg-master-text' },
            h(
              'span',
              { className: 'dtg-master-title' },
              L('启动透明磨砂主题', 'Start the frosted-glass theme')
            ),
            h(
              'span',
              { className: 'dtg-master-note' },
              L(
                on ? '已开启，效果实时生效' : '已关闭，界面恢复原生外观',
                on ? 'On — the effect is live' : 'Off — back to the stock look'
              )
            )
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dtg-power' + (on ? ' dtg-power-on' : ''),
              role: 'switch',
              'aria-checked': on ? 'true' : 'false',
              title: L('点击切换主题开关', 'Click to toggle the theme'),
              onClick: () => patch({ enabled: !on }),
            },
            h('span', { className: 'dtg-power-state' }, on ? L('开', 'ON') : L('关', 'OFF')),
            h('span', { className: 'dtg-switch' + (on ? ' dtg-on' : '') }, h('span', { className: 'dtg-knob' }))
          )
        ),
        h(
          'div',
          { className: 'dtg-group' + (on ? '' : ' dtg-off') },
          h(Slider, {
            label: L('页面背景透明磨砂度', 'Page background: frost ↔ clear'),
            value: s.page,
            disabled: !on,
            left: L('磨砂', 'Frost'),
            right: L('透明', 'Clear'),
            onChange: (v) => patch({ page: v }),
          }),
          h(Slider, {
            label: L('设置页透明磨砂度', 'Settings page: frost ↔ clear'),
            value: s.settings,
            disabled: !on,
            left: L('磨砂', 'Frost'),
            right: L('透明', 'Clear'),
            onChange: (v) => patch({ settings: v }),
          })
        ),
        h(
          'div',
          { className: 'dtg-group' + (on ? '' : ' dtg-off') },
          h(
            'div',
            { className: 'dtg-toggle-row' },
            h(
              'div',
              { className: 'dtg-toggle-text' },
              h('span', { className: 'dtg-label' }, L('粒子效果', 'Particle effect')),
              h(
                'span',
                { className: 'dtg-toggle-note' },
                L(
                  '对话区中央的鲸鱼粒子，随主题一起淡入淡出',
                  'A whale made of particles in the conversation area, fading with the theme'
                )
              )
            ),
            h(Switch, {
              label: L('粒子效果', 'Particle effect'),
              checked: s.particles !== false,
              onChange: (v) => patch({ particles: v }),
            })
          )
        ),
        h(
          'div',
          { className: 'dtg-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'dtg-btn',
              disabled: !on,
              onClick: () => patch(Object.assign({}, DEFAULTS)),
            },
            L('恢复默认', 'Reset to defaults')
          )
        )
      )
    }

    /* ------------------------------------------------------------------ */
    /* engine lifecycle                                                   */
    /* ------------------------------------------------------------------ */

    const ROOT_VARS = [
      '--dtg-ink',
      '--dtg-ink-dim',
      '--dtg-line',
      '--dtg-line-soft',
      '--dtg-card-bg',
      '--dtg-page-fill',
      '--dtg-settings-fill',
      '--dtg-float-fill',
      '--dtg-blur-page',
      '--dtg-blur-settings',
    ].concat(CONTENT_TOKENS.map((_, i) => `--dtg-c${i}`))

    function install() {
      if (state.installed) return () => {}
      state.installed = true

      state.styleEl = document.createElement('style')
      state.styleEl.id = 'dtg-style'
      state.styleEl.textContent = CSS
      document.head.appendChild(state.styleEl)

      try {
        apply(state.settings)
      } catch (err) {
        /* never let styling kill the panel */
      }

      /* self-check / debugging hook (harmless in production): lets a developer
         read or change the stored settings without opening the panel */
      try {
        window.__dtgTheme = {
          current: () => Object.assign({}, state.settings),
          set: (partial) => patchSettings(partial || {}),
          rescan: () => schedulePanels(),
        }
      } catch (err) {}

      try {
        state.media = window.matchMedia('(prefers-color-scheme: dark)')
        if (state.media.addEventListener) state.media.addEventListener('change', refresh)
      } catch (err) {
        /* no colour-scheme support */
      }

      try {
        const onMutate = () => {
          window.clearTimeout(state.timer)
          state.timer = window.setTimeout(() => {
            try {
              refresh()
            } catch (err) {}
          }, 150)
        }
        state.observer = new MutationObserver(onMutate)
        state.observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'data-theme', 'data-ui-theme'],
        })

        state.panelObserver = new MutationObserver((records) => {
          if (state.settings.enabled) {
            for (const r of records) {
              const added = r.addedNodes
              for (let i = 0; i < added.length; i++) {
                const node = added[i]
                if (node.nodeType === 1 && !node.hasAttribute(PANEL_ATTR)) flatSubtree(node)
              }
            }
            /* a dialog that just opened must be recognised before it paints */
            try {
              tagSettings()
              tagFlat()
            } catch (err) {}
          }
          schedulePanels()
        })
        if (document.body) state.panelObserver.observe(document.body, { childList: true, subtree: true })
        window.addEventListener('resize', schedulePanels)
      } catch (err) {
        /* observer unsupported */
      }

      return () => {
        try {
          if (whale) whale.dispose()
        } catch (err) {}
        whale = null
        try {
          delete window.__dtgTheme
        } catch (err) {}
        try {
          if (state.observer) state.observer.disconnect()
        } catch (err) {}
        state.observer = null
        try {
          if (state.panelObserver) state.panelObserver.disconnect()
        } catch (err) {}
        state.panelObserver = null
        try {
          window.removeEventListener('resize', schedulePanels)
        } catch (err) {}
        window.clearTimeout(state.panelTimer)
        untagPanels()
        if (state.settingsHost) state.settingsHost.removeAttribute(SETTINGS_ATTR)
        state.settingsHost = null
        try {
          if (state.media && state.media.removeEventListener) {
            state.media.removeEventListener('change', refresh)
          }
        } catch (err) {}
        state.media = null
        window.clearTimeout(state.timer)
        const root = document.documentElement
        const body = document.body
        if (root.hasAttribute(ATTR)) root.removeAttribute(ATTR)
        state.applied.forEach((name) => body.style.removeProperty(name))
        state.applied = []
        ROOT_VARS.forEach((name) => root.style.removeProperty(name))
        if (probe.el && probe.el.parentNode) probe.el.parentNode.removeChild(probe.el)
        probe.el = null
        if (state.styleEl && state.styleEl.parentNode) state.styleEl.parentNode.removeChild(state.styleEl)
        state.styleEl = null
        state.base = null
        state.installed = false
      }
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(install, 'transparent-frosted-theme:engine')

        ctx.slots.inject('settings.section', () => {
          return ctx.slots.register(
            {
              name: 'settings.section',
              id: 'transparent-glass',
              order: 100,
              label: () => L('透明磨砂主题', 'Transparent Frosted Theme'),
            },
            GlassSection
          )
        })
      },
    }
  },
})
