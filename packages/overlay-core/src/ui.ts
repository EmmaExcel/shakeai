import type { AIOverlaySelection, AIOverlayThemeConfig } from './types'
import { clamp } from './utils'

type OverlayUIOptions = {
  theme: AIOverlayThemeConfig & Required<Pick<AIOverlayThemeConfig, 'primaryColor' | 'panelBackground' | 'textColor' | 'borderRadius'>>
  editEnabled: boolean
  onSubmit: (question: string, inEditMode: boolean) => void
  onCancel: () => void
  onUndo: () => void
  onCopyCSS: () => void
}

export type OverlayUI = {
  root: HTMLElement
  contains: (element: Element) => boolean
  setActive: (active: boolean, count: number) => void
  setHoverRect: (rect: DOMRect | null) => void
  showPrompt: (selection: AIOverlaySelection) => void
  setThinking: (thinking: boolean) => void
  setAnswer: (answer: string) => void
  setError: (error: string) => void
  clearSelection: () => void
  destroy: () => void
  setInspectMode: (active: boolean, element?: Element | null) => void
  showEditControls: (canUndo: boolean) => void
}

export function createOverlayUI(options: OverlayUIOptions): OverlayUI {
  const host = document.createElement('div')
  host.dataset.aiOverlayRoot = 'true'
  
  const globalStyle = document.createElement('style')
  globalStyle.dataset.aiOverlayStyle = 'true'
  globalStyle.textContent = `
    body.ai-overlay-active,
    body.ai-overlay-active * {
      cursor: none !important;
    }

    /* Inspect Mode Styles */
    .inspect-active .kind::after {
      content: ' [INSPECT]';
      color: #fbbf24;
      font-size: 0.7em;
    }
  `
  
  const shadow = host.attachShadow({ mode: 'open' })
  document.head.append(globalStyle)
  document.body.append(host)

  const enhancedStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :host {
      all: initial;
      --c-bg: #0d0f14;
      --c-surface: #13161d;
      --c-surface2: #1a1d26;
      --c-border: rgba(255,255,255,0.07);
      --c-border-bright: rgba(255,255,255,0.14);
      --c-text: #f0f2f7;
      --c-muted: #6b7280;
      --c-accent: #6366f1;
      --c-accent2: #8b5cf6;
      --c-amber: #f59e0b;
      --c-red: #f43f5e;
      --c-green: #10b981;
      --radius: 16px;
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
    }

    /* ── Keyframes ───────────────────────────────────────────── */
    @keyframes panel-in {
      from { opacity: 0; transform: translateY(14px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0)    scale(1); }
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px) scale(0.94); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }
    @keyframes orbit {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes cursor-breathe {
      0%,100% { filter: drop-shadow(0 0 6px rgba(99,102,241,0.8)); }
      50%      { filter: drop-shadow(0 0 18px rgba(139,92,246,1)); }
    }
    @keyframes dot-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.6); }
      50%      { box-shadow: 0 0 0 5px rgba(99,102,241,0); }
    }
    @keyframes shimmer {
      0%   { background-position: -300px 0; }
      100% { background-position:  300px 0; }
    }
    @keyframes answer-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Reset ───────────────────────────────────────────────── */
    .toast,.hover,.panel,.head,.kind,.label,.close,.content-area,
    .answer,.footer,form,textarea,.submit,.error,.mode-tabs,
    .tab-btn,.edit-controls,.edit-btn,.input-row,.hint {
      all: initial;
      box-sizing: border-box;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    }

    /* ── Animated AI Cursor ──────────────────────────────────── */
    .custom-cursor {
      position: fixed;
      left: 0; top: 0;
      width: 32px; height: 32px;
      pointer-events: none;
      z-index: 2147483647;
      display: none;
      transform: translate(-50%, -50%);
      animation: cursor-breathe 2s ease-in-out infinite;
    }
    .custom-cursor.active { display: block; }
    .cursor-orbit {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1.5px solid transparent;
      border-top-color: var(--c-accent);
      border-right-color: var(--c-accent2);
      animation: orbit 1.4s linear infinite;
    }
    .cursor-body {
      position: absolute;
      inset: 6px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, rgba(139,92,246,0.9), rgba(99,102,241,0.7));
      box-shadow: 0 0 12px rgba(99,102,241,0.6);
    }
    .cursor-dot {
      position: absolute;
      width: 5px; height: 5px;
      border-radius: 50%;
      background: #fff;
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
    }
    .cursor-trail {
      position: fixed;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: rgba(139,92,246,0.5);
      pointer-events: none;
      z-index: 2147483646;
      display: none;
      transform: translate(-50%,-50%);
      transition: left 0.12s ease-out, top 0.12s ease-out;
    }
    .cursor-trail.active { display: block; }

    /* ── Toast ───────────────────────────────────────────────── */
    .toast {
      position: fixed; right: 20px; bottom: 20px;
      z-index: 2147483645;
      display: none;
      align-items: center;
      gap: 10px;
      padding: 9px 16px;
      border-radius: 999px;
      border: 1px solid var(--c-border-bright);
      background: var(--c-surface);
      color: var(--c-text);
      font: 600 12px/1 'Inter', sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
    }
    .toast.active {
      display: flex;
      animation: toast-in 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }
    .pulse {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--c-accent);
      animation: dot-pulse 1.8s ease-in-out infinite;
    }
    .count {
      border-left: 1px solid var(--c-border-bright);
      padding-left: 10px;
      color: var(--c-muted);
      font-size: 11px;
    }

    /* ── Hover Outline ───────────────────────────────────────── */
    .hover {
      position: fixed;
      z-index: 2147483644;
      pointer-events: none;
      display: none;
      border-radius: 8px;
      border: 1.5px solid rgba(99,102,241,0.6);
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1), inset 0 0 20px rgba(99,102,241,0.04);
      transition: left 0.07s ease-out, top 0.07s ease-out, width 0.07s ease-out, height 0.07s ease-out;
    }

    /* ── Panel ───────────────────────────────────────────────── */
    .panel {
      position: absolute;
      z-index: 2147483646;
      width: 400px;
      display: none;
      flex-direction: column;
      background: var(--c-bg);
      border-radius: var(--radius);
      border: 1px solid rgba(99,102,241,0.22);
      box-shadow:
        0 0 0 1px rgba(99,102,241,0.07),
        0 24px 80px rgba(0,0,0,0.75),
        0 0 60px rgba(99,102,241,0.05),
        inset 0 1px 0 rgba(255,255,255,0.07);
      overflow: hidden;
    }
    .panel.visible {
      display: flex;
      animation: panel-in 0.22s cubic-bezier(0.34,1.1,0.64,1) forwards;
    }
    .panel.inspect-mode { width: 520px; }

    /* ── Header ──────────────────────────────────────────────── */
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 14px;
      border-bottom: 1px solid var(--c-border);
      background: linear-gradient(180deg, rgba(99,102,241,0.07) 0%, transparent 100%);
      gap: 10px;
    }
    .head-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .head-icon {
      width: 30px; height: 30px;
      border-radius: 9px;
      background: linear-gradient(135deg, var(--c-accent), var(--c-accent2));
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(99,102,241,0.4);
    }
    .head-icon svg { width: 16px; height: 16px; fill: #fff; }
    .head-meta { min-width: 0; }
    .kind-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 9.5px;
      font-weight: 700;
      color: var(--c-muted);
      text-transform: uppercase;
      letter-spacing: 0.09em;
      margin-bottom: 2px;
    }
    .kind-chip .dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--c-accent);
      display: inline-block;
      animation: dot-pulse 2s ease-in-out infinite;
    }
    .kind { display: inline; }
    .label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--c-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 215px;
    }
    .head-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    /* ── Mode Tabs ───────────────────────────────────────────── */
    .mode-tabs {
      display: flex;
      background: var(--c-surface2);
      border-radius: 8px;
      padding: 2px;
      gap: 2px;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: var(--c-muted);
      cursor: pointer;
      border: none;
      background: transparent;
      transition: color 0.15s, background 0.15s;
    }
    .tab-btn:hover { color: var(--c-text); }
    .tab-btn.active {
      background: var(--c-surface);
      color: var(--c-text);
      box-shadow: 0 1px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
    }
    .tab-btn.active.edit-tab { color: var(--c-amber); }

    /* ── Close Button ────────────────────────────────────────── */
    .close {
      width: 26px; height: 26px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 7px;
      border: 1px solid var(--c-border);
      background: transparent;
      color: var(--c-muted);
      cursor: pointer;
      font-size: 15px;
      line-height: 1;
      transition: all 0.15s;
    }
    .close:hover {
      background: rgba(244,63,94,0.1);
      border-color: rgba(244,63,94,0.3);
      color: var(--c-red);
      transform: rotate(90deg);
    }

    /* ── Vision Badge ────────────────────────────────────────── */
    .vision-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.25);
      color: var(--c-green);
      margin-bottom: 6px;
    }
    .vision-badge::before {
      content: '';
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--c-green);
      display: inline-block;
      animation: dot-pulse 1.8s infinite;
    }

    /* ── Content / Answer ────────────────────────────────────── */
    .content-area {
      padding: 13px 14px;
      max-height: 260px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.08) transparent;
    }
    .content-area::-webkit-scrollbar { width: 4px; }
    .content-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
    .answer {
      font-size: 13.5px;
      line-height: 1.68;
      color: #c9d1de;
      white-space: pre-wrap;
      animation: answer-in 0.2s ease forwards;
    }
    .answer:empty { display: none; }

    /* ── Shimmer Skeleton ────────────────────────────────────── */
    .skeleton { display: flex; flex-direction: column; gap: 8px; }
    .skel-line {
      height: 11px;
      border-radius: 6px;
      background: linear-gradient(90deg, var(--c-surface2) 25%, rgba(255,255,255,0.04) 50%, var(--c-surface2) 75%);
      background-size: 300px 100%;
      animation: shimmer 1.3s infinite;
    }
    .skel-line:nth-child(2) { width: 80%; }
    .skel-line:nth-child(3) { width: 55%; }

    /* ── Error ───────────────────────────────────────────────── */
    .error {
      display: none;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 10px;
      background: rgba(244,63,94,0.07);
      border: 1px solid rgba(244,63,94,0.18);
      color: #fca5a5;
      font-size: 12.5px;
      line-height: 1.55;
    }
    .error.visible { display: flex; }
    .error-icon { font-size: 14px; flex-shrink: 0; }

    /* ── Edit Controls ───────────────────────────────────────── */
    .edit-controls {
      display: none;
      gap: 6px;
      padding: 9px 14px;
      border-top: 1px solid var(--c-border);
      background: rgba(245,158,11,0.03);
    }
    .edit-controls.visible { display: flex; }
    .edit-btn {
      flex: 1;
      display: flex; align-items: center; justify-content: center; gap: 5px;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--c-border-bright);
      background: var(--c-surface2);
      color: var(--c-muted);
      transition: all 0.15s;
    }
    .edit-btn:hover { background: var(--c-surface); color: var(--c-text); }
    .edit-btn.undo { border-color: rgba(245,158,11,0.2); color: var(--c-amber); }
    .edit-btn.undo:hover { background: rgba(245,158,11,0.08); }
    .edit-btn.copy { border-color: rgba(99,102,241,0.2); color: #a5b4fc; }
    .edit-btn.copy:hover { background: rgba(99,102,241,0.08); }
    .edit-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    /* ── Footer / Input ──────────────────────────────────────── */
    .footer {
      padding: 11px 14px 14px;
      border-top: 1px solid var(--c-border);
      background: rgba(0,0,0,0.2);
    }
    form { display: flex; flex-direction: column; gap: 9px; }
    .input-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      background: var(--c-surface);
      border: 1px solid var(--c-border-bright);
      border-radius: 12px;
      padding: 8px 8px 8px 12px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .input-row:focus-within {
      border-color: rgba(99,102,241,0.5);
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }
    textarea {
      flex: 1;
      resize: none;
      min-height: 20px;
      max-height: 100px;
      border: none;
      background: transparent;
      color: var(--c-text);
      font: 13.5px/1.5 'Inter', sans-serif;
      outline: none;
      padding: 0;
      caret-color: var(--c-accent);
    }
    textarea::placeholder { color: var(--c-muted); }
    .submit {
      flex-shrink: 0;
      width: 34px; height: 34px;
      border-radius: 9px;
      border: none;
      background: linear-gradient(135deg, var(--c-accent), var(--c-accent2));
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.15s, transform 0.12s, box-shadow 0.2s;
      box-shadow: 0 4px 14px rgba(99,102,241,0.45);
    }
    .submit svg { width: 15px; height: 15px; fill: none; stroke: #fff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
    .submit:hover:not(:disabled) { opacity: 0.88; transform: scale(1.06); box-shadow: 0 6px 20px rgba(99,102,241,0.6); }
    .submit:active:not(:disabled) { transform: scale(0.94); }
    .submit:disabled { opacity: 0.3; cursor: not-allowed; }
    .submit.edit-active {
      background: linear-gradient(135deg, var(--c-amber), #ef4444);
      box-shadow: 0 4px 14px rgba(245,158,11,0.45);
    }
    .hint {
      font-size: 10.5px;
      color: var(--c-muted);
      opacity: 0.65;
      display: block;
    }

    /* ── Inspect Styles ──────────────────────────────────────── */
    .inspect-data { font-family: 'Menlo','Monaco','Consolas',monospace; font-size: 11.5px; color: #cbd5e1; }
    .inspect-tag { color: #fbbf24; font-weight: 700; }
    .inspect-attr { display: block; margin: 3px 0; padding-left: 8px; border-left: 2px solid rgba(251,191,36,0.25); }
    .inspect-style { color: var(--c-muted); font-size: 11px; }
    .inspect-value { color: #cbd5e1; background: rgba(255,255,255,0.05); padding: 1px 4px; border-radius: 3px; }

    @media (max-width: 450px) {
      .panel { width: calc(100vw - 24px); left: 12px !important; }
    }
  `

  shadow.innerHTML = `
    <style>${enhancedStyles}</style>

    <div class="custom-cursor">
      <div class="cursor-orbit"></div>
      <div class="cursor-body"></div>
      <div class="cursor-dot"></div>
    </div>
    <div class="cursor-trail"></div>

    <div class="toast" role="status">
      <span class="pulse"></span>
      <span>ShakeAI active</span>
      <span class="count">0 shakes</span>
    </div>

    <div class="hover"></div>

    <section class="panel" aria-label="AI Overlay">
      <header class="head">
        <div class="head-left">
          <div class="head-icon">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
          </div>
          <div class="head-meta">
            <div class="kind-chip"><span class="dot"></span><span class="kind"></span></div>
            <span class="label"></span>
          </div>
        </div>
        <div class="head-right">
          ${options.editEnabled ? `
          <div class="mode-tabs">
            <button class="tab-btn ask-tab active" type="button">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Ask
            </button>
            <button class="tab-btn edit-tab" type="button">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          </div>` : ''}
          <button class="close" type="button" aria-label="Close">&#x2715;</button>
        </div>
      </header>

      <div class="content-area">
        <div class="answer"></div>
        <div class="error"><span class="error-icon">&#9888;</span><span class="error-text"></span></div>
      </div>

      <div class="edit-controls">
        <button class="edit-btn undo" type="button">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>
          Undo
        </button>
        <button class="edit-btn copy" type="button">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy CSS
        </button>
      </div>

      <footer class="footer">
        <form>
          <div class="input-row">
            <textarea rows="1" placeholder="Ask anything about this…"></textarea>
            <button class="submit" type="submit" aria-label="Send">
              <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <span class="hint">Powered by ShakeAI</span>
        </form>
      </footer>
    </section>
  `

  const cursor = shadow.querySelector<HTMLElement>('.custom-cursor')
  const trail = shadow.querySelector<HTMLElement>('.cursor-trail')
  const toast = shadow.querySelector<HTMLElement>('.toast')
  const count = shadow.querySelector<HTMLElement>('.count')
  const hover = shadow.querySelector<HTMLElement>('.hover')
  const panel = shadow.querySelector<HTMLElement>('.panel')
  const kind = shadow.querySelector<HTMLElement>('.kind')
  const label = shadow.querySelector<HTMLElement>('.label')
  const form = shadow.querySelector<HTMLFormElement>('form')
  const textarea = shadow.querySelector<HTMLTextAreaElement>('textarea')
  const submit = shadow.querySelector<HTMLButtonElement>('.submit')
  const close = shadow.querySelector<HTMLButtonElement>('.close')
  const error = shadow.querySelector<HTMLElement>('.error')
  const errorText = shadow.querySelector<HTMLElement>('.error-text')
  const answer = shadow.querySelector<HTMLElement>('.answer')
  const askTab = shadow.querySelector<HTMLButtonElement>('.ask-tab')
  const editTab = shadow.querySelector<HTMLButtonElement>('.edit-tab')
  const editControls = shadow.querySelector<HTMLElement>('.edit-controls')
  const undoBtn = shadow.querySelector<HTMLButtonElement>('.edit-btn.undo')
  const copyBtn = shadow.querySelector<HTMLButtonElement>('.edit-btn.copy')

  if (!cursor || !toast || !count || !hover || !panel || !kind || !label || !form || !textarea || !submit || !close || !error || !answer) {
    throw new Error('AIOverlay UI failed to initialize')
  }

  let inEditMode = false

  const setEditMode = (active: boolean) => {
    inEditMode = active
    askTab?.classList.toggle('active', !active)
    editTab?.classList.toggle('active', active)
    submit.classList.toggle('edit-active', active)
    textarea.placeholder = active
      ? 'Describe the change… (e.g. "make background white")'
      : 'Ask anything about this…'
  }

  askTab?.addEventListener('click', () => setEditMode(false))
  editTab?.addEventListener('click', () => setEditMode(true))

  undoBtn?.addEventListener('click', () => options.onUndo())
  copyBtn?.addEventListener('click', () => options.onCopyCSS())

  const onMouseMove = (e: MouseEvent) => {
    cursor.style.left = `${e.clientX}px`
    cursor.style.top = `${e.clientY}px`
    setTimeout(() => {
      if (trail) {
        trail.style.left = `${e.clientX}px`
        trail.style.top = `${e.clientY}px`
      }
    }, 80)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const question = textarea.value.trim()
    if (question) {
      options.onSubmit(question, inEditMode)
    }
  })

  close.addEventListener('click', () => {
    options.onCancel()
  })

  return {
    root: host,
    contains: (element) => element === host || host.contains(element),
    setActive: (active, shakeCount) => {
      toast.classList.toggle('active', active)
      cursor.classList.toggle('active', active)
      trail?.classList.toggle('active', active)
      count.textContent = `${shakeCount} shake${shakeCount !== 1 ? 's' : ''}`
      
      if (active) {
        window.addEventListener('mousemove', onMouseMove)
      } else {
        window.removeEventListener('mousemove', onMouseMove)
      }
    },
    setHoverRect: (rect) => {
      if (!rect) {
        hover.style.display = 'none'
        return
      }

      hover.style.display = 'block'
      hover.style.left = `${rect.left}px`
      hover.style.top = `${rect.top}px`
      hover.style.width = `${rect.width}px`
      hover.style.height = `${rect.height}px`
    },
    showPrompt: (selection) => {
      kind.textContent = selection.kind
      label.textContent = selection.label

      textarea.value = ''
      submit.disabled = false
      submit.classList.toggle('edit-active', inEditMode)
      error.classList.remove('visible')
      answer.textContent = ''
      editControls?.classList.remove('visible')
      
      const left = clamp(selection.rect.left + selection.rect.width / 2 - 190, 16, window.innerWidth - 396)
      const top = selection.rect.bottom + window.scrollY + 12
      
      panel.style.left = `${left}px`
      panel.style.top = `${top}px`
      panel.classList.add('visible')
      
      if (selection.kind === 'image' && selection.mimeType) {
        const kindEl = kind as HTMLElement
        const existingBadge = kindEl.querySelector('.vision-badge')
        if (!existingBadge) {
          const badge = document.createElement('span')
          badge.className = 'vision-badge'
          badge.textContent = 'Vision Enabled'
          kindEl.insertBefore(badge, kindEl.firstChild)
        }
      }
      
      textarea.focus()
    },
    setThinking: (thinking) => {
      submit.disabled = thinking
      submit.classList.toggle('edit-active', !thinking && inEditMode)
      if (thinking) {
        answer.innerHTML = `<div class="skeleton"><div class="skel-line"></div><div class="skel-line"></div><div class="skel-line"></div></div>`
      }
    },
    setAnswer: (value) => {
      submit.disabled = false
      answer.textContent = value
    },
    setError: (value) => {
      if (errorText) errorText.textContent = value
      error.classList.toggle('visible', Boolean(value))
    },
    clearSelection: () => {
      panel.classList.remove('visible')
      error.classList.remove('visible')
      answer.textContent = ''
      textarea.value = ''
      editControls?.classList.remove('visible')
      const kindEl = kind as HTMLElement
      const existingBadge = kindEl.querySelector('.vision-badge')
      if (existingBadge) {
        existingBadge.remove()
      }
    },
    destroy: () => {
      globalStyle.remove()
      host.remove()
      window.removeEventListener('mousemove', onMouseMove)
    },
    setInspectMode: (active, element) => {
      if (active) {
        document.body.classList.add('ai-inspect-mode')
        host.classList.add('inspect-active')
        
        if (element && panel) {
          panel.classList.remove('visible')
          panel.classList.add('inspect-mode')
          showInspectInfo(panel, element as HTMLElement)
        }
      } else {
        document.body.classList.remove('ai-inspect-mode')
        host.classList.remove('inspect-active')
        clearInspectInfo(panel)
        if (panel) {
          panel.classList.add('visible')
          panel.classList.remove('inspect-mode')
          textarea.focus()
        }
      }
    },
    showEditControls: (canUndo) => {
      if (editControls) {
        editControls.classList.add('visible')
        if (undoBtn) undoBtn.disabled = !canUndo
      }
    },
  }
}

function showInspectInfo(container: HTMLElement, element: HTMLElement) {
  const infoContent = document.createElement('div')
  infoContent.className = 'inspect-data'
  
  const tagLabel = document.createElement('div')
  tagLabel.innerHTML = `<span class="inspect-tag">&lt;${element.tagName}&gt;</span> ${getElementDescription(element)}`
  infoContent.appendChild(tagLabel)

  if (element.className) {
    const cls = element.className.split(' ').filter(Boolean).slice(0, 3).join(', ')
    const clsLabel = document.createElement('div')
    clsLabel.textContent = `Classes: ${cls}`
    infoContent.appendChild(clsLabel)
  }

  if (element.id) {
    const idLabel = document.createElement('div')
    idLabel.innerHTML = `<span class="inspect-attr">ID:</span> <code class="inspect-value">${escapeHtml(element.id)}</code>`
    infoContent.appendChild(idLabel)
  }

  if (element.classList.contains('selected')) {
    const selLabel = document.createElement('div')
    selLabel.innerHTML = `<span class="inspect-attr">Status:</span> <strong style="color:#10b981">● Selected</strong>`
    infoContent.appendChild(selLabel)
  }

  const computedStyles: Record<string, string> = {};
  ['display', 'position', 'width', 'height', 'margin', 'padding', 'font-size', 'color'].forEach(prop => {
    const value = getComputedStyle(element).getPropertyValue(prop)
    if (value && !computedStyles[prop]) {
      computedStyles[prop] = value
    }
  })

  if (Object.keys(computedStyles).length > 0) {
    const styleLabel = document.createElement('div')
    styleLabel.innerHTML = '<strong>Computed Styles:</strong>'
    infoContent.appendChild(styleLabel)
    
    Object.entries(computedStyles).slice(0, 5).forEach(([prop, value]) => {
      const styleAttr = document.createElement('div')
      styleAttr.className = 'inspect-style'
      styleAttr.innerHTML = `<span class="inspect-attr">${escapeHtml(prop)}:</span> <code class="inspect-value">${escapeHtml(value)}</code>`
      infoContent.appendChild(styleAttr)
    })
  }

  const attrs: Record<string, string> = {}
  element.getAttributeNames()?.forEach(name => {
    const value = element.getAttribute(name)
    if (value && !attrs[name]) {
      attrs[name] = value
    }
  })

  if (Object.keys(attrs).length > 0) {
    const attrLabel = document.createElement('div')
    attrLabel.innerHTML = '<strong>Attributes:</strong>'
    infoContent.appendChild(attrLabel)
    
    Object.entries(attrs).slice(0, 5).forEach(([name, value]) => {
      const attrItem = document.createElement('div')
      attrItem.className = 'inspect-attr'
      attrItem.innerHTML = `<span class="inspect-attr">${escapeHtml(name)}:</span> <code class="inspect-value">${escapeHtml(value)}</code>`
      infoContent.appendChild(attrItem)
    })
  }

  const contentArea = container.querySelector('.content-area') as HTMLElement
  if (contentArea) {
    contentArea.appendChild(infoContent)
  }
}

function clearInspectInfo(container: HTMLElement | null) {
  if (!container) return
  
  const existingInfo = container.querySelector('.inspect-data') as HTMLElement
  if (existingInfo) {
    existingInfo.remove()
  }
}

function getElementDescription(element: HTMLElement): string {
  const ariaLabel = element.getAttribute('aria-label')?.slice(0, 50)
  const title = element.getAttribute('title')?.slice(0, 40)
  
  const parts = [ariaLabel, title]
  const text = (element.innerText || '').slice(0, 80).trim()
  if (text && !parts.some(p => p)) {
    parts.push(text)
  }
  
  return parts.find(Boolean) || ''
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
