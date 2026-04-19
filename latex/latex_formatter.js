/**
 * latex_formatter.js
 * Symbol palette UI for LaTeX editing.
 * Depends on katex_renderer.js being loaded first (uses LatexRenderer.render()).
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /*  Symbol catalogue — { label, latex, preview }                       */
  /* ------------------------------------------------------------------ */

  const CATEGORIES = [
    {
      name: "Greek — Lowercase",
      symbols: [
        { label: "alpha",      latex: "\\alpha",      preview: "$\\alpha$" },
        { label: "beta",       latex: "\\beta",       preview: "$\\beta$" },
        { label: "gamma",      latex: "\\gamma",      preview: "$\\gamma$" },
        { label: "delta",      latex: "\\delta",      preview: "$\\delta$" },
        { label: "epsilon",    latex: "\\epsilon",    preview: "$\\epsilon$" },
        { label: "varepsilon", latex: "\\varepsilon", preview: "$\\varepsilon$" },
        { label: "zeta",       latex: "\\zeta",       preview: "$\\zeta$" },
        { label: "eta",        latex: "\\eta",        preview: "$\\eta$" },
        { label: "theta",      latex: "\\theta",      preview: "$\\theta$" },
        { label: "vartheta",   latex: "\\vartheta",   preview: "$\\vartheta$" },
        { label: "iota",       latex: "\\iota",       preview: "$\\iota$" },
        { label: "kappa",      latex: "\\kappa",      preview: "$\\kappa$" },
        { label: "lambda",     latex: "\\lambda",     preview: "$\\lambda$" },
        { label: "mu",         latex: "\\mu",         preview: "$\\mu$" },
        { label: "nu",         latex: "\\nu",         preview: "$\\nu$" },
        { label: "xi",         latex: "\\xi",         preview: "$\\xi$" },
        { label: "pi",         latex: "\\pi",         preview: "$\\pi$" },
        { label: "varpi",      latex: "\\varpi",      preview: "$\\varpi$" },
        { label: "rho",        latex: "\\rho",        preview: "$\\rho$" },
        { label: "varrho",     latex: "\\varrho",     preview: "$\\varrho$" },
        { label: "sigma",      latex: "\\sigma",      preview: "$\\sigma$" },
        { label: "varsigma",   latex: "\\varsigma",   preview: "$\\varsigma$" },
        { label: "tau",        latex: "\\tau",        preview: "$\\tau$" },
        { label: "upsilon",    latex: "\\upsilon",    preview: "$\\upsilon$" },
        { label: "phi",        latex: "\\phi",        preview: "$\\phi$" },
        { label: "varphi",     latex: "\\varphi",     preview: "$\\varphi$" },
        { label: "chi",        latex: "\\chi",        preview: "$\\chi$" },
        { label: "psi",        latex: "\\psi",        preview: "$\\psi$" },
        { label: "omega",      latex: "\\omega",      preview: "$\\omega$" },
      ],
    },
    {
      name: "Greek — Uppercase",
      symbols: [
        { label: "Gamma",   latex: "\\Gamma",   preview: "$\\Gamma$" },
        { label: "Delta",   latex: "\\Delta",   preview: "$\\Delta$" },
        { label: "Theta",   latex: "\\Theta",   preview: "$\\Theta$" },
        { label: "Lambda",  latex: "\\Lambda",  preview: "$\\Lambda$" },
        { label: "Xi",      latex: "\\Xi",      preview: "$\\Xi$" },
        { label: "Pi",      latex: "\\Pi",      preview: "$\\Pi$" },
        { label: "Sigma",   latex: "\\Sigma",   preview: "$\\Sigma$" },
        { label: "Upsilon", latex: "\\Upsilon", preview: "$\\Upsilon$" },
        { label: "Phi",     latex: "\\Phi",     preview: "$\\Phi$" },
        { label: "Psi",     latex: "\\Psi",     preview: "$\\Psi$" },
        { label: "Omega",   latex: "\\Omega",   preview: "$\\Omega$" },
      ],
    },
    {
      name: "Relations",
      symbols: [
        { label: "leq",       latex: "\\leq",       preview: "$\\leq$" },
        { label: "geq",       latex: "\\geq",       preview: "$\\geq$" },
        { label: "neq",       latex: "\\neq",       preview: "$\\neq$" },
        { label: "approx",    latex: "\\approx",    preview: "$\\approx$" },
        { label: "sim",       latex: "\\sim",       preview: "$\\sim$" },
        { label: "simeq",     latex: "\\simeq",     preview: "$\\simeq$" },
        { label: "cong",      latex: "\\cong",      preview: "$\\cong$" },
        { label: "equiv",     latex: "\\equiv",     preview: "$\\equiv$" },
        { label: "propto",    latex: "\\propto",    preview: "$\\propto$" },
        { label: "ll",        latex: "\\ll",        preview: "$\\ll$" },
        { label: "gg",        latex: "\\gg",        preview: "$\\gg$" },
        { label: "subset",    latex: "\\subset",    preview: "$\\subset$" },
        { label: "supset",    latex: "\\supset",    preview: "$\\supset$" },
        { label: "subseteq",  latex: "\\subseteq",  preview: "$\\subseteq$" },
        { label: "supseteq",  latex: "\\supseteq",  preview: "$\\supseteq$" },
        { label: "subsetneq", latex: "\\subsetneq", preview: "$\\subsetneq$" },
        { label: "in",        latex: "\\in",        preview: "$\\in$" },
        { label: "notin",     latex: "\\notin",     preview: "$\\notin$" },
        { label: "ni",        latex: "\\ni",        preview: "$\\ni$" },
      ],
    },
    {
      name: "Arrows",
      symbols: [
        { label: "to / →",           latex: "\\to",              preview: "$\\to$" },
        { label: "leftarrow / ←",    latex: "\\leftarrow",       preview: "$\\leftarrow$" },
        { label: "Rightarrow / ⇒",   latex: "\\Rightarrow",      preview: "$\\Rightarrow$" },
        { label: "Leftarrow / ⇐",    latex: "\\Leftarrow",       preview: "$\\Leftarrow$" },
        { label: "Leftrightarrow",   latex: "\\Leftrightarrow",  preview: "$\\Leftrightarrow$" },
        { label: "leftrightarrow",   latex: "\\leftrightarrow",  preview: "$\\leftrightarrow$" },
        { label: "uparrow",          latex: "\\uparrow",         preview: "$\\uparrow$" },
        { label: "downarrow",        latex: "\\downarrow",       preview: "$\\downarrow$" },
        { label: "mapsto",           latex: "\\mapsto",          preview: "$\\mapsto$" },
        { label: "longrightarrow",   latex: "\\longrightarrow",  preview: "$\\longrightarrow$" },
        { label: "implies",          latex: "\\implies",         preview: "$\\implies$" },
        { label: "iff",              latex: "\\iff",             preview: "$\\iff$" },
      ],
    },
    {
      name: "Binary Operators",
      symbols: [
        { label: "times ×",    latex: "\\times",    preview: "$\\times$" },
        { label: "div ÷",      latex: "\\div",      preview: "$\\div$" },
        { label: "pm ±",       latex: "\\pm",       preview: "$\\pm$" },
        { label: "mp ∓",       latex: "\\mp",       preview: "$\\mp$" },
        { label: "cdot ·",     latex: "\\cdot",     preview: "$\\cdot$" },
        { label: "circ ∘",     latex: "\\circ",     preview: "$\\circ$" },
        { label: "oplus ⊕",    latex: "\\oplus",    preview: "$\\oplus$" },
        { label: "otimes ⊗",   latex: "\\otimes",   preview: "$\\otimes$" },
        { label: "cup ∪",      latex: "\\cup",      preview: "$\\cup$" },
        { label: "cap ∩",      latex: "\\cap",      preview: "$\\cap$" },
        { label: "setminus ∖", latex: "\\setminus", preview: "$\\setminus$" },
        { label: "land ∧",     latex: "\\land",     preview: "$\\land$" },
        { label: "lor ∨",      latex: "\\lor",      preview: "$\\lor$" },
        { label: "lnot ¬",     latex: "\\lnot",     preview: "$\\lnot$" },
      ],
    },
    {
      name: "Large Operators",
      symbols: [
        { label: "sum",       latex: "\\sum_{i=1}^{n}",     preview: "$\\sum$" },
        { label: "prod",      latex: "\\prod_{i=1}^{n}",    preview: "$\\prod$" },
        { label: "coprod",    latex: "\\coprod",             preview: "$\\coprod$" },
        { label: "int",       latex: "\\int_{a}^{b}",       preview: "$\\int$" },
        { label: "iint",      latex: "\\iint",               preview: "$\\iint$" },
        { label: "iiint",     latex: "\\iiint",              preview: "$\\iiint$" },
        { label: "oint",      latex: "\\oint",               preview: "$\\oint$" },
        { label: "bigcup",    latex: "\\bigcup_{i=1}^{n}",  preview: "$\\bigcup$" },
        { label: "bigcap",    latex: "\\bigcap_{i=1}^{n}",  preview: "$\\bigcap$" },
        { label: "bigoplus",  latex: "\\bigoplus",           preview: "$\\bigoplus$" },
        { label: "bigotimes", latex: "\\bigotimes",          preview: "$\\bigotimes$" },
        { label: "bigvee",    latex: "\\bigvee",             preview: "$\\bigvee$" },
        { label: "bigwedge",  latex: "\\bigwedge",           preview: "$\\bigwedge$" },
      ],
    },
    {
      name: "Structures",
      symbols: [
        { label: "frac",       latex: "\\frac{a}{b}",          preview: "$\\frac{a}{b}$" },
        { label: "dfrac",      latex: "\\dfrac{a}{b}",         preview: "$\\dfrac{a}{b}$" },
        { label: "sqrt",       latex: "\\sqrt{x}",             preview: "$\\sqrt{x}$" },
        { label: "nth root",   latex: "\\sqrt[n]{x}",          preview: "$\\sqrt[n]{x}$" },
        { label: "binom",      latex: "\\binom{n}{k}",         preview: "$\\binom{n}{k}$" },
        { label: "x^n",        latex: "x^{n}",                 preview: "$x^{n}$" },
        { label: "x_i",        latex: "x_{i}",                 preview: "$x_{i}$" },
        { label: "x_i^n",      latex: "x_{i}^{n}",             preview: "$x_{i}^{n}$" },
        { label: "overline",   latex: "\\overline{x}",         preview: "$\\overline{x}$" },
        { label: "underline",  latex: "\\underline{x}",        preview: "$\\underline{x}$" },
        { label: "hat",        latex: "\\hat{x}",              preview: "$\\hat{x}$" },
        { label: "widehat",    latex: "\\widehat{xy}",         preview: "$\\widehat{xy}$" },
        { label: "tilde",      latex: "\\tilde{x}",            preview: "$\\tilde{x}$" },
        { label: "vec",        latex: "\\vec{x}",              preview: "$\\vec{x}$" },
        { label: "dot",        latex: "\\dot{x}",              preview: "$\\dot{x}$" },
        { label: "ddot",       latex: "\\ddot{x}",             preview: "$\\ddot{x}$" },
        { label: "bar",        latex: "\\bar{x}",              preview: "$\\bar{x}$" },
        { label: "overbrace",  latex: "\\overbrace{x+y}^{n}",  preview: "$\\overbrace{x+y}^{n}$" },
        { label: "underbrace", latex: "\\underbrace{x+y}_{n}", preview: "$\\underbrace{x+y}_{n}$" },
        { label: "boxed",      latex: "\\boxed{E=mc^2}",       preview: "$\\boxed{E=mc^2}$" },
      ],
    },
    {
      name: "Delimiters",
      symbols: [
        { label: "( )",   latex: "\\left( \\right)",               preview: "$\\left( x \\right)$" },
        { label: "[ ]",   latex: "\\left[ \\right]",               preview: "$\\left[ x \\right]$" },
        { label: "{ }",   latex: "\\left\\{ \\right\\}",           preview: "$\\left\\{ x \\right\\}$" },
        { label: "| |",   latex: "\\left| \\right|",               preview: "$\\left| x \\right|$" },
        { label: "‖ ‖",   latex: "\\left\\| \\right\\|",           preview: "$\\left\\| x \\right\\|$" },
        { label: "⟨ ⟩",   latex: "\\left\\langle \\right\\rangle", preview: "$\\left\\langle x \\right\\rangle$" },
        { label: "⌊ ⌋",   latex: "\\left\\lfloor \\right\\rfloor", preview: "$\\left\\lfloor x \\right\\rfloor$" },
        { label: "⌈ ⌉",   latex: "\\left\\lceil \\right\\rceil",   preview: "$\\left\\lceil x \\right\\rceil$" },
        { label: "langle", latex: "\\langle",                      preview: "$\\langle$" },
        { label: "rangle", latex: "\\rangle",                      preview: "$\\rangle$" },
      ],
    },
    {
      name: "Environments",
      symbols: [
        { label: "pmatrix", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",                             preview: "$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$" },
        { label: "bmatrix", latex: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",                             preview: "$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$" },
        { label: "vmatrix", latex: "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}",                             preview: "$\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}$" },
        { label: "cases",   latex: "\\begin{cases} a & \\text{if } x > 0 \\\\ b & \\text{otherwise} \\end{cases}", preview: "$\\begin{cases} a & \\text{if } x>0 \\\\ b & \\text{else} \\end{cases}$" },
        { label: "aligned", latex: "\\begin{aligned} x &= a + b \\\\ y &= c + d \\end{aligned}",                  preview: "$\\begin{aligned} x &= a \\\\ y &= b \\end{aligned}$" },
      ],
    },
    {
      name: "Functions — Trig",
      symbols: [
        { label: "sin",    latex: "\\sin",    preview: "$\\sin$" },
        { label: "cos",    latex: "\\cos",    preview: "$\\cos$" },
        { label: "tan",    latex: "\\tan",    preview: "$\\tan$" },
        { label: "cot",    latex: "\\cot",    preview: "$\\cot$" },
        { label: "sec",    latex: "\\sec",    preview: "$\\sec$" },
        { label: "csc",    latex: "\\csc",    preview: "$\\csc$" },
        { label: "arcsin", latex: "\\arcsin", preview: "$\\arcsin$" },
        { label: "arccos", latex: "\\arccos", preview: "$\\arccos$" },
        { label: "arctan", latex: "\\arctan", preview: "$\\arctan$" },
        { label: "sinh",   latex: "\\sinh",   preview: "$\\sinh$" },
        { label: "cosh",   latex: "\\cosh",   preview: "$\\cosh$" },
        { label: "tanh",   latex: "\\tanh",   preview: "$\\tanh$" },
      ],
    },
    {
      name: "Functions — General",
      symbols: [
        { label: "log",    latex: "\\log",                    preview: "$\\log$" },
        { label: "ln",     latex: "\\ln",                     preview: "$\\ln$" },
        { label: "exp",    latex: "\\exp",                    preview: "$\\exp$" },
        { label: "det",    latex: "\\det",                    preview: "$\\det$" },
        { label: "dim",    latex: "\\dim",                    preview: "$\\dim$" },
        { label: "ker",    latex: "\\ker",                    preview: "$\\ker$" },
        { label: "deg",    latex: "\\deg",                    preview: "$\\deg$" },
        { label: "gcd",    latex: "\\gcd",                    preview: "$\\gcd$" },
        { label: "max",    latex: "\\max",                    preview: "$\\max$" },
        { label: "min",    latex: "\\min",                    preview: "$\\min$" },
        { label: "sup",    latex: "\\sup",                    preview: "$\\sup$" },
        { label: "inf",    latex: "\\inf",                    preview: "$\\inf$" },
        { label: "lim",    latex: "\\lim_{x \\to \\infty}",  preview: "$\\lim$" },
        { label: "limsup", latex: "\\limsup",                 preview: "$\\limsup$" },
        { label: "liminf", latex: "\\liminf",                 preview: "$\\liminf$" },
        { label: "arg",    latex: "\\arg",                    preview: "$\\arg$" },
        { label: "sgn",    latex: "\\sgn",                    preview: "$\\sgn$" },
        { label: "rank",   latex: "\\rank",                   preview: "$\\rank$" },
        { label: "tr",     latex: "\\tr",                     preview: "$\\tr$" },
        { label: "mod",    latex: "\\mod",                    preview: "$\\mod$" },
      ],
    },
    {
      name: "Font Variants",
      symbols: [
        { label: "mathbf",   latex: "\\mathbf{x}",   preview: "$\\mathbf{x}$" },
        { label: "mathrm",   latex: "\\mathrm{x}",   preview: "$\\mathrm{x}$" },
        { label: "mathit",   latex: "\\mathit{x}",   preview: "$\\mathit{x}$" },
        { label: "mathcal",  latex: "\\mathcal{L}",  preview: "$\\mathcal{L}$" },
        { label: "mathbb",   latex: "\\mathbb{R}",   preview: "$\\mathbb{R}$" },
        { label: "mathfrak", latex: "\\mathfrak{g}", preview: "$\\mathfrak{g}$" },
        { label: "mathsf",   latex: "\\mathsf{x}",   preview: "$\\mathsf{x}$" },
        { label: "mathtt",   latex: "\\mathtt{x}",   preview: "$\\mathtt{x}$" },
        { label: "text",     latex: "\\text{word}",  preview: "$\\text{word}$" },
      ],
    },
    {
      name: "Miscellaneous",
      symbols: [
        { label: "infty ∞",     latex: "\\infty",     preview: "$\\infty$" },
        { label: "partial ∂",   latex: "\\partial",   preview: "$\\partial$" },
        { label: "nabla ∇",     latex: "\\nabla",     preview: "$\\nabla$" },
        { label: "forall ∀",    latex: "\\forall",    preview: "$\\forall$" },
        { label: "exists ∃",    latex: "\\exists",    preview: "$\\exists$" },
        { label: "nexists ∄",   latex: "\\nexists",   preview: "$\\nexists$" },
        { label: "emptyset ∅",  latex: "\\emptyset",  preview: "$\\emptyset$" },
        { label: "ldots …",     latex: "\\ldots",     preview: "$\\ldots$" },
        { label: "cdots ⋯",     latex: "\\cdots",     preview: "$\\cdots$" },
        { label: "vdots ⋮",     latex: "\\vdots",     preview: "$\\vdots$" },
        { label: "ddots ⋱",     latex: "\\ddots",     preview: "$\\ddots$" },
        { label: "hbar ℏ",      latex: "\\hbar",      preview: "$\\hbar$" },
        { label: "ell ℓ",       latex: "\\ell",       preview: "$\\ell$" },
        { label: "Re ℜ",        latex: "\\Re",        preview: "$\\Re$" },
        { label: "Im ℑ",        latex: "\\Im",        preview: "$\\Im$" },
        { label: "aleph ℵ",     latex: "\\aleph",     preview: "$\\aleph$" },
        { label: "angle ∠",     latex: "\\angle",     preview: "$\\angle$" },
        { label: "perp ⊥",      latex: "\\perp",      preview: "$\\perp$" },
        { label: "prime ′",     latex: "\\prime",     preview: "$\\prime$" },
        { label: "dagger †",    latex: "\\dagger",    preview: "$\\dagger$" },
        { label: "ddagger ‡",   latex: "\\ddagger",   preview: "$\\ddagger$" },
        { label: "bullet •",    latex: "\\bullet",    preview: "$\\bullet$" },
        { label: "checkmark ✓", latex: "\\checkmark", preview: "$\\checkmark$" },
        { label: "star ⋆",      latex: "\\star",      preview: "$\\star$" },
        { label: "diamond ⋄",   latex: "\\diamond",   preview: "$\\diamond$" },
        { label: "square □",    latex: "\\square",    preview: "$\\square$" },
        { label: "triangle △",  latex: "\\triangle",  preview: "$\\triangle$" },
      ],
    },
    {
      name: "Spacing",
      symbols: [
        { label: "thin (,)",     latex: "\\,",     preview: "$a\\,b$" },
        { label: "medium (:)",   latex: "\\:",     preview: "$a\\:b$" },
        { label: "thick (;)",    latex: "\\;",     preview: "$a\\;b$" },
        { label: "quad",         latex: "\\quad",  preview: "$a\\quad b$" },
        { label: "qquad",        latex: "\\qquad", preview: "$a\\qquad b$" },
        { label: "neg thin (!)", latex: "\\!",     preview: "$a\\!b$" },
      ],
    },
    {
      name: "Overset / Underset",
      symbols: [
        { label: "overset",         latex: "\\overset{!}{=}",           preview: "$\\overset{!}{=}$" },
        { label: "underset",        latex: "\\underset{n}{\\sum}",       preview: "$\\underset{n}{\\sum}$" },
        { label: "stackrel",        latex: "\\stackrel{\\text{def}}{=}", preview: "$\\stackrel{\\text{def}}{=}$" },
        { label: "xlimits lim",     latex: "\\lim_{x \\to 0}",          preview: "$\\lim_{x \\to 0}$" },
        { label: "sum with limits", latex: "\\sum_{i=0}^{\\infty}",     preview: "$\\sum_{i=0}^{\\infty}$" },
      ],
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Resolve render function                                             */
  /*  Always use LatexRenderer.render — fall back with a clear warning.  */
  /* ------------------------------------------------------------------ */

  function getRenderFn(override) {
    if (typeof override === "function") return override;
    if (window.LatexRenderer && typeof window.LatexRenderer.render === "function")
      return window.LatexRenderer.render.bind(window.LatexRenderer);
    console.error("latex_formatter: window.LatexRenderer not found. Load katex_renderer.js first.");
    return function (s) { return { html: s, finalize: function () {} }; };
  }

  /* ------------------------------------------------------------------ */
  /*  Rich tooltip                                                        */
  /* ------------------------------------------------------------------ */

  let _tooltipEl = null;
  let _hideTimer = null;

  function getTooltip() {
    if (!_tooltipEl) {
      _tooltipEl = document.createElement("div");
      _tooltipEl.id = "lf-tooltip";
      _tooltipEl.style.cssText = [
        "position:fixed",
        "z-index:99999",
        "background:#131620",
        "color:#e8e8f0",
        "border:1px solid #3a3e58",
        "border-radius:8px",
        "padding:0",
        "pointer-events:none",
        "opacity:0",
        "transition:opacity 0.14s",
        "min-width:160px",
        "max-width:340px",
        "box-shadow:0 6px 24px rgba(0,0,0,0.55)",
        "overflow:hidden",
      ].join(";");

      const mathArea = document.createElement("div");
      mathArea.id = "lf-tip-math";
      mathArea.style.cssText = [
        "padding:14px 18px 10px",
        "font-size:28px",
        "line-height:1.4",
        "text-align:center",
        "background:#0f1118",
        "border-bottom:1px solid #25293a",
        "min-height:56px",
        "display:flex",
        "align-items:center",
        "justify-content:center",
      ].join(";");

      const codeArea = document.createElement("div");
      codeArea.id = "lf-tip-code";
      codeArea.style.cssText = [
        "padding:7px 12px 8px",
        "font-family:'JetBrains Mono','Fira Code',monospace",
        "font-size:11px",
        "color:#8899cc",
        "background:#131620",
        "white-space:pre-wrap",
        "word-break:break-all",
      ].join(";");

      const labelArea = document.createElement("div");
      labelArea.id = "lf-tip-label";
      labelArea.style.cssText = [
        "padding:0 12px 7px",
        "font-size:11px",
        "color:#555a72",
        "font-family:system-ui,sans-serif",
      ].join(";");

      _tooltipEl.appendChild(mathArea);
      _tooltipEl.appendChild(codeArea);
      _tooltipEl.appendChild(labelArea);
      document.body.appendChild(_tooltipEl);
    }
    return _tooltipEl;
  }

  function showTooltip(el, sym, renderFn) {
    const tt = getTooltip();
    clearTimeout(_hideTimer);

    const mathArea  = tt.querySelector("#lf-tip-math");
    const codeArea  = tt.querySelector("#lf-tip-code");
    const labelArea = tt.querySelector("#lf-tip-label");

    function stripDelimiters(s) {
      s = s.trim();
      if (s.startsWith("\\[") && s.endsWith("\\]")) return s.slice(2, -2).trim();
      if (s.startsWith("$$")  && s.endsWith("$$"))  return s.slice(2, -2).trim();
      if (s.startsWith("\\(") && s.endsWith("\\)")) return s.slice(2, -2).trim();
      if (s.startsWith("$")   && s.endsWith("$") && s.length > 1) return s.slice(1, -1).trim();
      return s;
    }

    // Render preview directly with KaTeX — static only, no overlay machinery.
    try {
      mathArea.innerHTML = window.katex.renderToString(stripDelimiters(sym.preview), {
        displayMode: true,
        throwOnError: false,
        strict: false,
        output: "html",
      });
    } catch (e) {
      mathArea.textContent = sym.preview;
    }

    codeArea.textContent  = sym.latex;
    labelArea.textContent = sym.label;

    tt.style.opacity = "0";
    tt.style.display = "block";
    const rect = el.getBoundingClientRect();
    const ttW  = Math.max(tt.offsetWidth, 160);
    const ttH  = tt.offsetHeight;
    let left = rect.left + rect.width / 2 - ttW / 2;
    if (left < 6) left = 6;
    if (left + ttW > window.innerWidth - 6) left = window.innerWidth - ttW - 6;
    const top = rect.top >= ttH + 8 ? rect.top - ttH - 8 : rect.bottom + 8;
    tt.style.left = left + "px";
    tt.style.top  = top  + "px";
    tt.style.opacity = "1";
  }

  function hideTooltip() {
    _hideTimer = setTimeout(() => {
      if (_tooltipEl) _tooltipEl.style.opacity = "0";
    }, 80);
  }

  /* ------------------------------------------------------------------ */
  /*  Insert into target textarea                                         */
  /*                                                                     */
  /*  Inserts raw LaTeX text at the cursor position in the target        */
  /*  element and fires an 'input' event so the host page's render       */
  /*  handler (doRender) picks up the change and re-renders with the     */
  /*  correct cursor position and any active selection.                  */
  /* ------------------------------------------------------------------ */

  function insertIntoTarget(targetEl, text) {
    if (!targetEl) return;
    const start = targetEl.selectionStart || 0;
    const end   = targetEl.selectionEnd   || 0;
    targetEl.value =
      targetEl.value.slice(0, start) + text + targetEl.value.slice(end);
    const newPos = start + text.length;
    targetEl.selectionStart = newPos;
    targetEl.selectionEnd   = newPos;
    targetEl.focus();
    // Fire 'input' so doRender() picks up the new value and cursor position,
    // producing an interactive render with the caret placed after the insert.
    targetEl.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /* ------------------------------------------------------------------ */
  /*  Build the palette DOM                                               */
  /* ------------------------------------------------------------------ */

  function buildPalette(options) {
    options = options || {};
    const renderFn = getRenderFn(options.renderFn);
    const targetId = options.targetId || null;

    const root = document.createElement("div");
    root.className = "lf-palette";
    root.style.cssText = [
      "font-family:system-ui,sans-serif",
      "font-size:13px",
      "color:#c8ccd4",
      "background:#0f1117",
      "border:1px solid #2a2d3a",
      "border-radius:10px",
      "padding:12px 14px 16px",
      "overflow-y:auto",
      "box-sizing:border-box",
    ].join(";");

    /* Search */
    const searchWrap = document.createElement("div");
    searchWrap.style.cssText = "position:relative;margin-bottom:12px;";
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search symbols…";
    searchInput.style.cssText = [
      "width:100%",
      "box-sizing:border-box",
      "background:#1b1e2b",
      "border:1px solid #343848",
      "border-radius:6px",
      "color:#e0e0ec",
      "padding:7px 10px",
      "font-size:13px",
      "outline:none",
    ].join(";");
    searchWrap.appendChild(searchInput);
    root.appendChild(searchWrap);

    const sectionsWrap = document.createElement("div");
    root.appendChild(sectionsWrap);

    const allButtons = [];

    CATEGORIES.forEach(cat => {
      const section = document.createElement("div");
      section.className = "lf-section";
      section.style.cssText = "margin-bottom:14px;";

      const header = document.createElement("div");
      header.style.cssText = [
        "font-size:10px",
        "font-weight:700",
        "letter-spacing:0.1em",
        "text-transform:uppercase",
        "color:#6b7080",
        "margin-bottom:6px",
        "padding-bottom:4px",
        "border-bottom:1px solid #20232e",
        "cursor:pointer",
        "user-select:none",
        "display:flex",
        "align-items:center",
        "gap:6px",
      ].join(";");

      const chevron = document.createElement("span");
      chevron.textContent = "▾";
      chevron.style.cssText = "font-size:10px;color:#555;transition:transform 0.15s;";
      header.appendChild(chevron);
      header.appendChild(document.createTextNode(cat.name));

      const grid = document.createElement("div");
      grid.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;";

      let collapsed = false;
      header.addEventListener("click", () => {
        collapsed = !collapsed;
        grid.style.display = collapsed ? "none" : "flex";
        chevron.style.transform = collapsed ? "rotate(-90deg)" : "";
      });

      cat.symbols.forEach(sym => {
        const btn = document.createElement("button");
        btn.className = "lf-btn";
        btn.style.cssText = [
          "background:#181c28",
          "border:1px solid #2d3143",
          "border-radius:5px",
          "color:#d0d4e0",
          "cursor:pointer",
          "padding:3px 8px",
          "min-width:44px",
          "height:30px",
          "display:inline-flex",
          "align-items:center",
          "justify-content:center",
          "transition:background 0.1s, border-color 0.1s, transform 0.08s",
          "overflow:visible",
        ].join(";");

        const parts = sym.label.split(" ");
        const face  = parts.length >= 2 && parts[parts.length - 1].length <= 3
          ? parts[parts.length - 1]
          : parts[0];
        btn.textContent = face;
        btn.style.fontSize   = face.length > 5 ? "10px" : face.length > 3 ? "11px" : "13px";
        btn.style.fontFamily = "system-ui, sans-serif";

        btn.addEventListener("mouseenter", () => {
          btn.style.background  = "#242840";
          btn.style.borderColor = "#5060c0";
          btn.style.transform   = "scale(1.10)";
          showTooltip(btn, sym, renderFn);
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.background  = "#181c28";
          btn.style.borderColor = "#2d3143";
          btn.style.transform   = "";
          hideTooltip();
        });
        btn.addEventListener("click", () => {
          const targetEl = targetId ? document.getElementById(targetId) : null;
          insertIntoTarget(targetEl, sym.latex);
          btn.style.background  = "#2a3a6a";
          btn.style.borderColor = "#7080e0";
          setTimeout(() => {
            btn.style.background  = "#181c28";
            btn.style.borderColor = "#2d3143";
          }, 200);
        });

        grid.appendChild(btn);
        allButtons.push({ btn, section, sym, catName: cat.name });
      });

      section.appendChild(header);
      section.appendChild(grid);
      sectionsWrap.appendChild(section);
    });

    /* Search filtering */
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        allButtons.forEach(({ btn }) => (btn.style.display = ""));
        sectionsWrap.querySelectorAll(".lf-section").forEach(s => (s.style.display = ""));
        return;
      }
      const visibleSections = new Set();
      allButtons.forEach(({ btn, section, sym, catName }) => {
        const match = sym.label.toLowerCase().includes(q)
          || sym.latex.toLowerCase().includes(q)
          || catName.toLowerCase().includes(q);
        btn.style.display = match ? "" : "none";
        if (match) visibleSections.add(section);
      });
      sectionsWrap.querySelectorAll(".lf-section").forEach(s => {
        s.style.display = visibleSections.has(s) ? "" : "none";
      });
    });

    return root;
  }

  /* ------------------------------------------------------------------ */
  /*  Auto-mount                                                          */
  /* ------------------------------------------------------------------ */

  function autoMount() {
    const container = document.getElementById("latex-formatter");
    if (!container) return;
    const targetId = container.getAttribute("data-target-id") || null;
    const palette  = buildPalette({ targetId });
    palette.style.width  = "100%";
    palette.style.height = "100%";
    container.appendChild(palette);
  }

  document.addEventListener("DOMContentLoaded", autoMount);

  /* ------------------------------------------------------------------ */
  /*  Public API                                                          */
  /* ------------------------------------------------------------------ */

  window.LatexFormatter = {
    buildPalette,
    insertIntoTarget,
    CATEGORIES,
  };

})();