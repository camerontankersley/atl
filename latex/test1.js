/**
 * katex_renderer.js
 * Drop-in replacement for latex_renderer.js using KaTeX for rendering.
 */

(function (global) {
  "use strict";

  const LatexRenderer = {};

  /* ─────────────────────────────────────────────────────────────────── */
  /*  escapeHtml                                                        */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.escapeHtml = function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  getStyleBlock                                                     */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.getStyleBlock = function getStyleBlock() {
    return (
      `<style>` +
        `.latexr-wrap{position:relative;display:inline-block;}` +
        `.latexr-wrap .katex-display{margin:0;}` +
        `@keyframes latexr-blink{0%,100%{opacity:1}50%{opacity:0}}` +
        `.latexr-cursor{display:inline-block;width:2px;height:1.1em;` +
          `background:currentColor;vertical-align:text-bottom;margin-left:1px;` +
          `animation:latexr-blink 1s step-start infinite;position:relative;z-index:2;}` +
        `.latexr-hl-overlay{position:absolute;border-radius:2px;pointer-events:none;z-index:1;}` +
        `.latexr-hl-full{background:rgba(255,224,60,0.55);}` +
        `.latexr-hl-partial{background:rgba(80,160,255,0.55);}` +
        `.latexr-cursor-overlay{position:absolute;width:2px;background:currentColor;` +
          `pointer-events:none;z-index:2;animation:latexr-blink 1s step-start infinite;}` +
      `</style>`
    );
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  katexRender                                                       */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.katexRender = function katexRender(src, display, trust) {
    if (typeof window === "undefined" || !window.katex) {
      return `<span style="color:#c0392b">KaTeX not loaded</span>`;
    }
    try {
      return window.katex.renderToString(src, {
        displayMode: !!display,
        throwOnError: false,
        strict: false,
        trust: !!trust,
        output: "html",
      });
    } catch (e) {
      return `<span style="color:#c0392b;font-family:monospace">${LatexRenderer.escapeHtml(String(e))}</span>`;
    }
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  renderDisplay / renderInline                                      */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.renderDisplay = function renderDisplay(src) {
    return LatexRenderer.katexRender(src.trim(), true, false);
  };

  LatexRenderer.renderInline = function renderInline(src) {
    return LatexRenderer.katexRender(src.trim(), false, false);
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  tokenize                                                          */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.tokenize = function tokenize(src) {
    const tokens = [];
    let i = 0;

    while (i < src.length) {
      const start = i;

      if (src[i] === "\\") {
        i++;
        if (i >= src.length) break;

        if (/[a-zA-Z]/.test(src[i])) {
          let cmd = "";
          while (i < src.length && /[a-zA-Z]/.test(src[i])) cmd += src[i++];
          if (i < src.length && src[i] === " ") i++;
          tokens.push({ type: "cmd", val: cmd, srcStart: start, srcEnd: i });
        } else {
          tokens.push({ type: "cmd", val: src[i++], srcStart: start, srcEnd: i });
        }
      } else if (src[i] === "{") {
        tokens.push({ type: "lbrace", srcStart: start, srcEnd: ++i });
      } else if (src[i] === "}") {
        tokens.push({ type: "rbrace", srcStart: start, srcEnd: ++i });
      } else if (src[i] === "_") {
        tokens.push({ type: "sub", srcStart: start, srcEnd: ++i });
      } else if (src[i] === "^") {
        tokens.push({ type: "sup", srcStart: start, srcEnd: ++i });
      } else if (src[i] === "&") {
        tokens.push({ type: "align", srcStart: start, srcEnd: ++i });
      } else if (/\s/.test(src[i])) {
        i++;
      } else if (/[0-9]/.test(src[i])) {
        let num = "";
        while (i < src.length && /[0-9.]/.test(src[i])) num += src[i++];
        tokens.push({ type: "num", val: num, srcStart: start, srcEnd: i });
      } else if (/[a-zA-Z]/.test(src[i])) {
        tokens.push({ type: "letter", val: src[i], srcStart: start, srcEnd: ++i });
      } else {
        tokens.push({ type: "char", val: src[i], srcStart: start, srcEnd: ++i });
      }
    }

    return tokens;
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  stripDelimiters                                                   */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.stripDelimiters = function stripDelimiters(raw) {
    raw = raw.trim();

    if (raw.startsWith("\\[") && raw.endsWith("\\]")) {
      const inner = raw.slice(2, -2);
      const trimmed = inner.trim();
      const delimOffset = 2 + inner.indexOf(trimmed);
      return { src: trimmed, isDisplay: true, delimOffset, mixed: false };
    }
    if (raw.startsWith("$$") && raw.endsWith("$$") && raw.length > 4) {
      const inner = raw.slice(2, -2);
      const trimmed = inner.trim();
      const delimOffset = 2 + inner.indexOf(trimmed);
      return { src: trimmed, isDisplay: true, delimOffset, mixed: false };
    }
    if (raw.startsWith("\\(") && raw.endsWith("\\)")) {
      const inner = raw.slice(2, -2);
      const trimmed = inner.trim();
      const delimOffset = 2 + inner.indexOf(trimmed);
      return { src: trimmed, isDisplay: false, delimOffset, mixed: false };
    }
    if (raw.startsWith("$") && raw.endsWith("$") && raw.length > 1 && raw[1] !== "$") {
      const inner = raw.slice(1, -1);
      const trimmed = inner.trim();
      const delimOffset = 1 + inner.indexOf(trimmed);
      return { src: trimmed, isDisplay: false, delimOffset, mixed: false };
    }

    const hasMathDelim = /\$|\\\[|\\\(/.test(raw);
    if (hasMathDelim) {
      return { src: raw, isDisplay: false, delimOffset: 0, mixed: true };
    }

    return { src: raw, isDisplay: true, delimOffset: 0, mixed: false };
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  buildAtoms                                                        */
  /*                                                                    */
  /*  Produces a flat list of atoms from src. Commands whose contents  */
  /*  should be navigable (sqrt, boxed, left/right, begin/end,         */
  /*  single-arg decorators) are descended into so that individual     */
  /*  sub-expressions get their own atoms rather than the whole        */
  /*  command collapsing into one big blob.                            */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.buildAtoms = function buildAtoms(src) {
    const R = LatexRenderer;
    const tokens = R.tokenize(src);
    const n = tokens.length;

    // Commands that take arguments but whose CONTENTS we recurse into
    // so sub-expressions get fine-grained atoms.
    const DESCEND_SINGLE = new Set([
      "boxed",
      "hat","widehat","tilde","widetilde","vec","dot","ddot","bar",
      "overline","underline","overbrace","underbrace",
      "text","mbox","textrm","textit","textbf",
      "mathrm","mathit","mathcal","mathbb","mathfrak","mathsf","mathtt",
      "mathbf","boldsymbol","bm",
      "displaystyle","textstyle","scriptstyle","scriptscriptstyle",
    ]);

    // Commands that take TWO args but we still want to descend into each arg.
    const DESCEND_DOUBLE = new Set([
      "frac","dfrac","tfrac","cfrac",
      "binom","dbinom","tbinom",
      "overset","underset","stackrel",
    ]);

    // Commands whose content is opaque (single token treated as one unit).
    const OPAQUE_SINGLE = new Set([
      "operatorname",
      "color","textcolor",   // color name arg is opaque; but we descend 2nd arg below
    ]);

    // Large operators where _ and ^ must stay attached to the operator token
    // so KaTeX renders them as limits (above/below) rather than inline scripts.
    // We fold these + all trailing scripts into a single opaque atom.
    const LIMIT_OPS = new Set([
      "lim","liminf","limsup","min","max","inf","sup",
      "sum","prod","coprod",
      "int","iint","iiint","iiiint","oint","oiint","oiiint",
      "bigcap","bigcup","bigsqcup","bigvee","bigwedge",
      "bigodot","bigoplus","bigotimes","biguplus",
    ]);

    const CMD_ARG_COUNT = {
      frac:2, dfrac:2, tfrac:2, cfrac:2,
      binom:2, dbinom:2, tbinom:2,
      overset:2, underset:2, stackrel:2,
      color:2, textcolor:2,
    };

    // ── token-level helpers ──────────────────────────────────────────

    function skipGroup(idx) {
      if (idx >= n) return idx;
      if (tokens[idx].type === "lbrace") {
        let depth = 1; idx++;
        while (idx < n && depth > 0) {
          if (tokens[idx].type === "lbrace") depth++;
          if (tokens[idx].type === "rbrace") depth--;
          idx++;
        }
        return idx;
      }
      return idx + 1;
    }

    // Returns [contentStartSrcPos, contentEndSrcPos, nextTi]
    // for the brace group (or single token) starting at tokens[ti].
    function groupBounds(ti) {
      if (ti >= n) return [null, null, ti];
      if (tokens[ti].type === "lbrace") {
        const open = tokens[ti];
        const endTi = skipGroup(ti);
        const close = tokens[endTi - 1]; // the rbrace
        return [open.srcEnd, close.srcStart, endTi];
      }
      // single token (no braces)
      const t = tokens[ti];
      return [t.srcStart, t.srcEnd, ti + 1];
    }

    // ── script atom builder ──────────────────────────────────────────

    function parseScriptAtom(scriptTokIndex) {
      const t = tokens[scriptTokIndex];
      const atomType = t.type;
      const atomStart = t.srcStart;
      let i = scriptTokIndex + 1;

      let contentStart = atomStart + 1;
      let contentEnd   = atomStart + 1;
      let atomEnd      = atomStart + 1;

      if (i < n && tokens[i].type === "lbrace") {
        const openTok = tokens[i];
        const endIdx  = skipGroup(i);
        const closeTok = tokens[endIdx - 1];
        contentStart = openTok.srcEnd;
        contentEnd   = closeTok ? closeTok.srcStart : openTok.srcEnd;
        atomEnd      = closeTok ? closeTok.srcEnd   : t.srcEnd;
        i = endIdx;
      } else if (i < n) {
        contentStart = tokens[i].srcStart;
        contentEnd   = tokens[i].srcEnd;
        atomEnd      = tokens[i].srcEnd;
        i = i + 1;
      }

      return [{
        kind: "script",
        scriptType: atomType,
        srcStart: atomStart,
        srcEnd: atomEnd,
        hlStart: contentStart,
        hlEnd: contentEnd,
        contentStart,
        contentEnd,
      }, i];
    }

    // ── recursive descent ────────────────────────────────────────────
    //
    // parseAtoms(tiStart, tiEnd) processes tokens[tiStart..tiEnd)
    // and pushes atoms into `atoms`.  This lets us recurse into
    // group contents with the same token-index machinery.

    const atoms = [];

    function parseAtoms(tiStart, tiEnd) {
      let ti = tiStart;

      while (ti < tiEnd) {
        const t = tokens[ti];

        // ── skip alignment tabs ──────────────────────────────────────
        if (t.type === "align") { ti++; continue; }

        // ── \left ... \right ────────────────────────────────────────
        // Treat as ONE opaque atom. Descending into \left/\right breaks
        // KaTeX's delimiter-sizing logic when \htmlClass{} wrappers
        // appear between \left and \right.
        if (t.type === "cmd" && t.val === "left") {
          let idx = ti + 1;
          if (idx < tiEnd) idx++; // skip opening delimiter token
          let depth = 1;
          while (idx < tiEnd) {
            const tok = tokens[idx];
            if (tok.type === "cmd") {
              if (tok.val === "left")  { depth++; idx++; if (idx < tiEnd) idx++; continue; }
              if (tok.val === "right") {
                depth--;
                if (depth === 0) { idx++; if (idx < tiEnd) idx++; break; }
                idx++; if (idx < tiEnd) idx++;
                continue;
              }
            }
            idx++;
          }
          const atomEnd = tokens[idx - 1] ? tokens[idx - 1].srcEnd : t.srcEnd;
          atoms.push({
            kind: "base",
            srcStart: t.srcStart,
            srcEnd: atomEnd,
            hlStart: t.srcStart,
            hlEnd: atomEnd,
          });
          ti = idx;
          // consume trailing scripts on the whole \left...\right group
          while (ti < tiEnd && (tokens[ti].type === "sub" || tokens[ti].type === "sup")) {
            const [sa, nti] = parseScriptAtom(ti);
            atoms.push(sa);
            ti = nti;
          }
          continue;
        }

        // ── \begin{env} ... \end{env} ────────────────────────────────
        // Treat as ONE opaque atom. Injecting \htmlClass{} inside matrix
        // cells or tabular environments is invalid KaTeX and causes red errors.
        if (t.type === "cmd" && t.val === "begin") {
          let idx = ti + 1;
          idx = skipGroup(idx); // skip {env}
          let depth = 1;
          while (idx < tiEnd) {
            if (tokens[idx].type === "cmd") {
              if (tokens[idx].val === "begin") depth++;
              if (tokens[idx].val === "end")   { depth--; if (depth === 0) { idx++; idx = skipGroup(idx); break; } }
            }
            idx++;
          }
          const atomEnd = tokens[idx - 1] ? tokens[idx - 1].srcEnd : t.srcEnd;
          atoms.push({
            kind: "base",
            srcStart: t.srcStart,
            srcEnd: atomEnd,
            hlStart: t.srcStart,
            hlEnd: atomEnd,
          });
          ti = idx;
          continue;
        }

        // ── \sqrt ────────────────────────────────────────────────────
        // sqrt is special: optional [] index, then one brace group to descend.
        if (t.type === "cmd" && t.val === "sqrt") {
          const sqrtSrcStart = t.srcStart;
          let idx = ti + 1;

          // optional [n] index — treat as opaque atom
          if (idx < tiEnd && tokens[idx].type === "char" && tokens[idx].val === "[") {
            const indexTiStart = idx;
            idx++;
            while (idx < tiEnd && !(tokens[idx].type === "char" && tokens[idx].val === "]")) idx++;
            if (idx < tiEnd) idx++; // skip "]"
            // emit the index as a single opaque atom
            const indexSrcEnd = tokens[idx - 1] ? tokens[idx - 1].srcEnd : sqrtSrcStart;
            atoms.push({
              kind: "base",
              srcStart: sqrtSrcStart,
              srcEnd: indexSrcEnd,
              hlStart: sqrtSrcStart,
              hlEnd: indexSrcEnd,
            });
          }

          // descend into the radicand
          if (idx < tiEnd) {
            const [cStart, cEnd, nextIdx] = groupBounds(idx);
            if (cStart !== null) parseAtoms(idx + (tokens[idx].type === "lbrace" ? 1 : 0),
                                            nextIdx - (tokens[idx] && tokens[idx].type === "lbrace" ? 1 : 0));
            ti = nextIdx;
          } else {
            ti = idx;
          }

          // consume trailing scripts on the whole sqrt
          while (ti < tiEnd && (tokens[ti].type === "sub" || tokens[ti].type === "sup")) {
            const [sa, nti] = parseScriptAtom(ti);
            atoms.push(sa);
            ti = nti;
          }
          continue;
        }

        // ── single-arg commands we descend into ─────────────────────
        if (t.type === "cmd" && DESCEND_SINGLE.has(t.val)) {
          let idx = ti + 1;
          if (idx < tiEnd) {
            // Figure out the token range of the content inside the braces
            if (tokens[idx].type === "lbrace") {
              const innerTiStart = idx + 1;
              const endTi = skipGroup(idx);
              const innerTiEnd = endTi - 1; // exclude closing rbrace
              parseAtoms(innerTiStart, innerTiEnd);
              ti = endTi;
            } else {
              // single token — make a leaf atom directly
              const tok = tokens[idx];
              atoms.push({
                kind: "base",
                srcStart: tok.srcStart,
                srcEnd: tok.srcEnd,
                hlStart: tok.srcStart,
                hlEnd: tok.srcEnd,
              });
              ti = idx + 1;
            }
          } else {
            ti++;
          }

          while (ti < tiEnd && (tokens[ti].type === "sub" || tokens[ti].type === "sup")) {
            const [sa, nti] = parseScriptAtom(ti);
            atoms.push(sa);
            ti = nti;
          }
          continue;
        }

        // ── two-arg commands we descend into ────────────────────────
        if (t.type === "cmd" && DESCEND_DOUBLE.has(t.val)) {
          let idx = ti + 1;
          // descend into both args
          for (let g = 0; g < 2 && idx < tiEnd; g++) {
            if (tokens[idx].type === "lbrace") {
              const innerTiStart = idx + 1;
              const endTi = skipGroup(idx);
              const innerTiEnd = endTi - 1;
              parseAtoms(innerTiStart, innerTiEnd);
              idx = endTi;
            } else {
              const tok = tokens[idx];
              atoms.push({
                kind: "base",
                srcStart: tok.srcStart,
                srcEnd: tok.srcEnd,
                hlStart: tok.srcStart,
                hlEnd: tok.srcEnd,
              });
              idx++;
            }
          }
          ti = idx;

          while (ti < tiEnd && (tokens[ti].type === "sub" || tokens[ti].type === "sup")) {
            const [sa, nti] = parseScriptAtom(ti);
            atoms.push(sa);
            ti = nti;
          }
          continue;
        }

        // ── \color / \textcolor — first arg opaque, second descend ──
        if (t.type === "cmd" && (t.val === "color" || t.val === "textcolor")) {
          let idx = ti + 1;
          // skip color name arg opaquely
          if (idx < tiEnd) idx = skipGroup(idx);
          // descend into content arg
          if (idx < tiEnd) {
            if (tokens[idx].type === "lbrace") {
              const innerTiStart = idx + 1;
              const endTi = skipGroup(idx);
              const innerTiEnd = endTi - 1;
              parseAtoms(innerTiStart, innerTiEnd);
              idx = endTi;
            } else {
              const tok = tokens[idx];
              atoms.push({
                kind: "base",
                srcStart: tok.srcStart,
                srcEnd: tok.srcEnd,
                hlStart: tok.srcStart,
                hlEnd: tok.srcEnd,
              });
              idx++;
            }
          }
          ti = idx;
          while (ti < tiEnd && (tokens[ti].type === "sub" || tokens[ti].type === "sup")) {
            const [sa, nti] = parseScriptAtom(ti);
            atoms.push(sa);
            ti = nti;
          }
          continue;
        }

        // ── opaque single-arg commands ───────────────────────────────
        if (t.type === "cmd" && OPAQUE_SINGLE.has(t.val)) {
          const atomStart = t.srcStart;
          let idx = ti + 1;
          if (idx < tiEnd) idx = skipGroup(idx);
          const atomEnd = tokens[idx - 1] ? tokens[idx - 1].srcEnd : t.srcEnd;
          atoms.push({ kind: "base", srcStart: atomStart, srcEnd: atomEnd, hlStart: atomStart, hlEnd: atomEnd });
          ti = idx;
          while (ti < tiEnd && (tokens[ti].type === "sub" || tokens[ti].type === "sup")) {
            const [sa, nti] = parseScriptAtom(ti);
            atoms.push(sa);
            ti = nti;
          }
          continue;
        }

        // ── bare brace group { ... } ─────────────────────────────────
        // Descend so the interior is navigable.
        if (t.type === "lbrace") {
          const innerTiStart = ti + 1;
          const endTi = skipGroup(ti);
          const innerTiEnd = endTi - 1;
          parseAtoms(innerTiStart, innerTiEnd);
          ti = endTi;

          while (ti < tiEnd && (tokens[ti].type === "sub" || tokens[ti].type === "sup")) {
            const [sa, nti] = parseScriptAtom(ti);
            atoms.push(sa);
            ti = nti;
          }
          continue;
        }

        // ── stray rbrace ─────────────────────────────────────────────
        if (t.type === "rbrace") { ti++; continue; }

        // ── bare _ or ^ ──────────────────────────────────────────────
        if (t.type === "sub" || t.type === "sup") {
          const [sa, nti] = parseScriptAtom(ti);
          atoms.push(sa);
          ti = nti;
          continue;
        }

        // ── limit/large-operator commands ────────────────────────────
        // \lim, \sum, \int, \bigcap, etc. must keep their _ and ^ glued
        // to the operator token so KaTeX renders them as displayed limits.
        // We fold the operator + all trailing scripts into ONE opaque atom.
        if (t.type === "cmd" && LIMIT_OPS.has(t.val)) {
          let idx = ti + 1;
          // consume trailing _ and ^ (and their arguments) into the same atom
          while (idx < tiEnd && (tokens[idx].type === "sub" || tokens[idx].type === "sup")) {
            idx++; // skip _ or ^
            if (idx < tiEnd) idx = skipGroup(idx); // skip the script argument
          }
          const atomEnd = tokens[idx - 1] ? tokens[idx - 1].srcEnd : t.srcEnd;
          atoms.push({
            kind: "base",
            srcStart: t.srcStart,
            srcEnd: atomEnd,
            hlStart: t.srcStart,
            hlEnd: atomEnd,
          });
          ti = idx;
          continue;
        }

        // ── leaf token ───────────────────────────────────────────────
        atoms.push({
          kind: "base",
          srcStart: t.srcStart,
          srcEnd: t.srcEnd,
          hlStart: t.srcStart,
          hlEnd: t.srcEnd,
        });
        ti++;

        while (ti < tiEnd && (tokens[ti].type === "sub" || tokens[ti].type === "sup")) {
          const [sa, nti] = parseScriptAtom(ti);
          atoms.push(sa);
          ti = nti;
        }
      }
    }

    parseAtoms(0, n);
    return atoms;
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  buildAnnotatedSource                                               */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.buildAnnotatedSource = function buildAnnotatedSource(src, atoms) {
    function wrapAtom(ai, text) {
      return `\\htmlClass{latexr-atom-${ai}}{${text}}`;
    }

    // Sort atoms by srcStart so we can walk src left-to-right.
    // (Recursive descent already produces them in order, but be safe.)
    const sorted = atoms.map((a, i) => ({ atom: a, idx: i }))
                        .sort((a, b) => a.atom.srcStart - b.atom.srcStart);

    let out = "";
    let pos = 0;

    for (const { atom, idx } of sorted) {
      // Emit any src characters between the last atom and this one verbatim.
      // These are structural chars: \begin, \\, &, }, \frac, \left, etc.
      if (atom.srcStart > pos) {
        out += src.slice(pos, atom.srcStart);
      }

      if (atom.kind === "script") {
        // Script atoms wrap only their *content*, preserving the _ or ^ and braces.
        const beforeContent = src.slice(atom.srcStart, atom.contentStart);
        const content       = src.slice(atom.contentStart, atom.contentEnd);
        const afterContent  = src.slice(atom.contentEnd, atom.srcEnd);
        out += beforeContent + wrapAtom(idx, content || "{}") + afterContent;
      } else {
        out += wrapAtom(idx, src.slice(atom.srcStart, atom.srcEnd));
      }

      pos = atom.srcEnd;
    }

    // Emit any trailing src after the last atom.
    if (pos < src.length) out += src.slice(pos);
    return out;
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  applyOverlay                                                      */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.applyOverlay = function applyOverlay(src, opts) {
    const R = LatexRenderer;
    opts = opts || {};

    const cursorPos = (opts.cursorPos != null) ? opts.cursorPos : null;
    const selStart = (opts.selStart != null) ? opts.selStart : null;
    const selEnd = (opts.selEnd != null) ? opts.selEnd : null;
    const hasSel = (selStart !== null && selEnd !== null && selEnd > selStart);
    const display = !!opts.display;

    const atoms = R.buildAtoms(src);

    function classify(atom) {
      const as = atom.hlStart;
      const ae = atom.hlEnd;

      if (ae <= as) return "none";
      if (!hasSel) return "none";
      if (selEnd <= as || selStart >= ae) return "none";
      if (selStart <= as && selEnd >= ae) return "full";
      return "partial";
    }

    let caretAfterAtom = -1;
    if (cursorPos !== null) {
      for (let ai = 0; ai < atoms.length; ai++) {
        if (atoms[ai].srcEnd <= cursorPos) caretAfterAtom = ai;
      }
    }

    const annotated = R.buildAnnotatedSource(src, atoms);
    const uid = "latexr-" + ((Math.random() * 1e9) | 0);

    let katexHtml;
    try {
      katexHtml = window.katex.renderToString(annotated, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        trust: true,
        output: "html",
      });
    } catch (e) {
      katexHtml = R.katexRender(src, display, false);
    }

    const html =
      `<div class="latexr latexr-wrap" id="${uid}" style="position:relative;display:inline-block;">` +
        katexHtml +
      `</div>`;

    function finalize() {
      const container = document.getElementById(uid);
      if (!container) return;

      container.querySelectorAll(".latexr-hl-overlay,.latexr-cursor-overlay").forEach(el => el.remove());
      if (!hasSel && cursorPos === null) return;

      const containerRect = container.getBoundingClientRect();

      for (let ai = 0; ai < atoms.length; ai++) {
        const cls = classify(atoms[ai]);
        const needsHL = cls !== "none";
        const needsCursor = cursorPos !== null && ai === caretAfterAtom;
        if (!needsHL && !needsCursor) continue;

        const span = container.querySelector(`.latexr-atom-${ai}`);
        if (!span) continue;

        const r = span.getBoundingClientRect();
        const left = r.left - containerRect.left;
        const top = r.top - containerRect.top;
        const width = r.width;
        const height = r.height;

        if (needsHL) {
          const hl = document.createElement("div");
          hl.className = "latexr-hl-overlay " + (cls === "full" ? "latexr-hl-full" : "latexr-hl-partial");
          hl.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;
          container.appendChild(hl);
        }

        if (needsCursor) {
          const caret = document.createElement("div");
          caret.className = "latexr-cursor-overlay";
          caret.style.cssText = `left:${left + width}px;top:${top}px;height:${height}px;`;
          container.appendChild(caret);
        }
      }

      if (cursorPos !== null && caretAfterAtom === -1 && atoms.length > 0) {
        const span = container.querySelector(".latexr-atom-0");
        if (span) {
          const r = span.getBoundingClientRect();
          const caret = document.createElement("div");
          caret.className = "latexr-cursor-overlay";
          caret.style.cssText =
            `left:${r.left - containerRect.left}px;` +
            `top:${r.top - containerRect.top}px;` +
            `height:${r.height}px;`;
          container.appendChild(caret);
        }
      }
    }

    return { html, finalize };
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  renderMixed                                                       */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.renderMixed = function renderMixed(src) {
    const R = LatexRenderer;
    const parts = [];
    let i = 0;

    while (i < src.length) {
      if (src[i] === "$" && src[i + 1] === "$") {
        const end = src.indexOf("$$", i + 2);
        if (end === -1) { parts.push(R.escapeHtml(src.slice(i))); break; }
        parts.push(R.katexRender(src.slice(i + 2, end), true, false));
        i = end + 2;
      } else if (src[i] === "$") {
        const end = src.indexOf("$", i + 1);
        if (end === -1) { parts.push(R.escapeHtml(src.slice(i))); break; }
        parts.push(R.katexRender(src.slice(i + 1, end), false, false));
        i = end + 1;
      } else if (src.startsWith("\\[", i)) {
        const end = src.indexOf("\\]", i + 2);
        if (end === -1) { parts.push(R.escapeHtml(src.slice(i))); break; }
        parts.push(R.katexRender(src.slice(i + 2, end), true, false));
        i = end + 2;
      } else if (src.startsWith("\\(", i)) {
        const end = src.indexOf("\\)", i + 2);
        if (end === -1) { parts.push(R.escapeHtml(src.slice(i))); break; }
        parts.push(R.katexRender(src.slice(i + 2, end), false, false));
        i = end + 2;
      } else {
        let j = i + 1;
        while (j < src.length && src[j] !== "$" && !src.startsWith("\\[", j) && !src.startsWith("\\(", j)) j++;
        parts.push(`<span style="font-family:Georgia,serif">${R.escapeHtml(src.slice(i, j))}</span>`);
        i = j;
      }
    }

    return `<div class="latexr" style="line-height:2.4">${parts.join("")}</div>`;
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  render                                                            */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.render = function render(raw, opts) {
    const R = LatexRenderer;
    opts = opts || {};

    try {
      const style = R.getStyleBlock();
      const { src, isDisplay, delimOffset, mixed } = R.stripDelimiters(raw);

      function toSrcOffset(n) {
        return (n != null) ? Math.max(0, n - delimOffset) : null;
      }

      if (mixed) {
        return { html: style + R.renderMixed(src), finalize: () => {} };
      }

      if (opts.static === true) {
        return {
          html: style + `<div class="latexr latexr-wrap">${R.katexRender(src, isDisplay, false)}</div>`,
          finalize: () => {}
        };
      }

      if (opts.cursorPos == null && opts.selStart == null) {
        return {
          html: style + `<div class="latexr latexr-wrap">${R.katexRender(src, isDisplay, false)}</div>`,
          finalize: () => {}
        };
      }

      const overlay = R.applyOverlay(src, {
        cursorPos: toSrcOffset(opts.cursorPos),
        selStart: toSrcOffset(opts.selStart),
        selEnd: toSrcOffset(opts.selEnd),
        display: isDisplay,
      });

      return {
        html: style + overlay.html,
        finalize: overlay.finalize
      };
    } catch (err) {
      return {
        html: `<span style="color:#c0392b;font-family:monospace">Error: ${LatexRenderer.escapeHtml(String(err))}</span>`,
        finalize: () => {}
      };
    }
  };

  /* ─────────────────────────────────────────────────────────────────── */
  /*  renderWithHitboxes                                                */
  /*                                                                    */
  /*  Renders src as pure static KaTeX, then in finalize() lays        */
  /*  invisible absolutely-positioned hit boxes over every atom span.  */
  /*  Clicking a hit box calls onAtomClick(atom) with the atom's       */
  /*  srcStart/srcEnd so the caller can jump the textarea cursor.      */
  /* ─────────────────────────────────────────────────────────────────── */

  LatexRenderer.renderWithHitboxes = function renderWithHitboxes(src, display) {
    const R = LatexRenderer;

    const atoms = R.buildAtoms(src);
    const annotated = R.buildAnnotatedSource(src, atoms);
    const uid = "latexr-hb-" + ((Math.random() * 1e9) | 0);

    let katexHtml;
    let usedAnnotated = true;
    try {
      katexHtml = window.katex.renderToString(annotated, {
        displayMode: !!display,
        throwOnError: false,
        strict: false,
        trust: true,
        output: "html",
      });
    } catch (e) {
      usedAnnotated = false;
      katexHtml = R.katexRender(src, display, false);
    }

    // Outer container must be position:relative so hit boxes (position:absolute)
    // are placed relative to it.
    const html =
      `<div class="latexr latexr-wrap latexr-hb-root" id="${uid}" ` +
        `style="position:relative;display:inline-block;">` +
        katexHtml +
      `</div>`;

    function finalize(onAtomClick) {
      const container = document.getElementById(uid);
      if (!container || !usedAnnotated || typeof onAtomClick !== "function") return;

      // Remove any stale hit boxes from a previous render
      container.querySelectorAll(".latexr-hitbox").forEach(el => el.remove());

      const containerRect = container.getBoundingClientRect();

      for (let ai = 0; ai < atoms.length; ai++) {
        const atom = atoms[ai];
        const span = container.querySelector(`.latexr-atom-${ai}`);
        if (!span) continue;

        const r = span.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;

        const hb = document.createElement("div");
        hb.className = "latexr-hitbox";
        hb.dataset.atomIdx    = ai;
        hb.dataset.atomStart  = atom.srcStart;
        hb.dataset.atomEnd    = atom.srcEnd;

        // Position exactly over the rendered glyph
        const left   = r.left   - containerRect.left;
        const top    = r.top    - containerRect.top;
        const width  = Math.max(r.width,  8);   // minimum tap target
        const height = Math.max(r.height, 8);

        hb.style.cssText =
          `position:absolute;` +
          `left:${left}px;top:${top}px;` +
          `width:${width}px;height:${height}px;` +
          `cursor:text;z-index:10;` +
          `background:transparent;`;

        hb.addEventListener("mouseenter", () => {
          hb.style.background = "rgba(90,112,255,0.12)";
          hb.style.borderRadius = "2px";
        });
        hb.addEventListener("mouseleave", () => {
          hb.style.background = "transparent";
        });
        hb.addEventListener("mousedown", (e) => {
          e.preventDefault();   // don't steal focus from textarea
          onAtomClick(atom, ai);
        });

        container.appendChild(hb);
      }
    }

    return { html, atoms, src, finalize };
  };

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Sandbox loader                                                    */
  /* ═══════════════════════════════════════════════════════════════════ */

  function applyLatexSandbox() {
    const sandbox = (typeof window !== "undefined") ? window.LatexSandbox : undefined;
    if (!sandbox || typeof sandbox !== "object") return;

    let applied = 0;
    for (const key of Object.keys(sandbox)) {
      if (typeof sandbox[key] === "function") {
        LatexRenderer[key] = sandbox[key];
        applied++;
      }
    }

    if (applied > 0 && typeof console !== "undefined") {
      console.log(`[LatexRenderer] sandbox applied ${applied} override(s):`, Object.keys(sandbox).join(", "));
    }
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Export                                                            */
  /* ═══════════════════════════════════════════════════════════════════ */

  if (typeof module !== "undefined" && module.exports) {
    module.exports = LatexRenderer;
  } else if (typeof window !== "undefined") {
    window.LatexRenderer = LatexRenderer;
  }

  if (typeof window !== "undefined") {
    window.applyLatexSandbox = applyLatexSandbox;
  }

}(typeof window !== "undefined" ? window : this));
