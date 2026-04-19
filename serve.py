#!/usr/bin/env python3
r"""
Local dev server for C:\Users\hp\python3\pdf_editor3\
Run: python serve.py
Click "Stop Server" in the browser or press Ctrl+C to stop.
"""

import os
import subprocess
import re
import json
import mimetypes
import webbrowser
import threading
import signal
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote, urlparse, parse_qs

FOLDER = r"C:\Users\hp\python3\pdf_editor3"
PORT = 8080
HIDDEN = {"index.html", "serve.py"}

RENDERER_PATH  = os.path.join(FOLDER, "latex_renderer.js")
OVERRIDES_PATH = os.path.join(FOLDER, "latex_sandbox_overrides.js")


# ── helpers ───────────────────────────────────────────────────────────────────

def safe_join(base, rel):
    """Resolve rel relative to base, ensuring result stays inside base.
    Returns the normalised absolute path or raises PermissionError."""
    # Strip leading slashes so os.path.join doesn't treat it as absolute
    rel = rel.lstrip("/\\")
    full = os.path.normpath(os.path.join(base, rel))
    if not full.startswith(os.path.normpath(base)):
        raise PermissionError("Path traversal denied")
    return full


# ── commit logic ──────────────────────────────────────────────────────────────

def find_function_end(src, start):
    """Return index just past the closing } of the outermost brace group
    starting at or after `start`."""
    depth, in_str, str_ch, i, started = 0, False, "", start, False
    while i < len(src):
        ch = src[i]
        if not in_str and src[i:i+2] == "//":
            while i < len(src) and src[i] != "\n": i += 1
            continue
        if not in_str and src[i:i+2] == "/*":
            i += 2
            while i < len(src) and src[i:i+2] != "*/": i += 1
            i += 2; continue
        if not in_str and ch in ('"', "'", "`"):
            in_str, str_ch = True, ch; i += 1; continue
        if in_str:
            if ch == "\\": i += 2; continue
            if ch == str_ch: in_str = False
            i += 1; continue
        if ch == "{": depth += 1; started = True
        if ch == "}":
            depth -= 1
            if started and depth == 0: return i + 1
        i += 1
    raise ValueError("Brace matching failed.")


def extract_sandbox_functions(overrides_src):
    """
    Supports two forms of window.LatexSandbox:

    FORM A — plain object literal (simple, commit-ready):
      window.LatexSandbox = {
        // @replace
        myFn: function myFn(...) { ... },
      };

    FORM B — IIFE returning an object:
      window.LatexSandbox = (function() {
        function myFn(...) { ... }
        return { myFn, otherFn };
      }());

    For Form B the @command annotation goes on the line before the name in
    the return { } block (same syntax as Form A).

    Returns list of { name, func_src, command, arg } dicts in source order.
    command: replace (default) | add | delete | rename
    arg:     old name for @rename, otherwise None.
    """
    m = re.search(r'window\.LatexSandbox\s*=\s*', overrides_src)
    if not m:
        raise ValueError("window.LatexSandbox not found in overrides file.")

    after = overrides_src[m.end():]

    # ── Form A: plain object literal ─────────────────────────────────
    if after.lstrip().startswith('{'):
        obj_start = m.end() + (len(after) - len(after.lstrip()))
        return _parse_object_literal(overrides_src, obj_start)

    # ── Form B: IIFE ──────────────────────────────────────────────────
    if re.match(r'\(?\s*function\s*\(', after.lstrip()):
        iife_fn_start = m.end() + after.index('function')
        brace_pos     = overrides_src.index('{', iife_fn_start)
        iife_body_end = find_function_end(overrides_src, brace_pos)
        iife_body     = overrides_src[brace_pos + 1 : iife_body_end - 1]
        return _parse_iife_form(overrides_src, iife_body, brace_pos + 1)

    raise ValueError(
        "window.LatexSandbox must be a plain object literal { } "
        "or an IIFE (function(){ ... return { ... }; }()).")


def _parse_object_literal(src, obj_start):
    """Parse Form A: window.LatexSandbox = { key: function key(...){} }"""
    obj_end  = find_function_end(src, obj_start)
    obj_body = src[obj_start + 1 : obj_end - 1]
    entries  = []
    pos = 0
    pat = re.compile(
        r'(?:\/\/\s*@(\w+)(?:\s+(\w+))?\s*\n\s*)?'
        r'(\w+)\s*:\s*(function\s*(?:\w+)?\s*\([^)]*\)\s*\{)',
        re.MULTILINE
    )
    while pos < len(obj_body):
        hit = pat.search(obj_body, pos)
        if not hit: break
        cmd       = (hit.group(1) or "replace").lower()
        arg       = hit.group(2)
        key       = hit.group(3)
        func_open = obj_start + 1 + hit.start(4)
        func_end  = find_function_end(src, func_open)
        entries.append({
            "name": key, "func_src": src[func_open:func_end],
            "command": cmd, "arg": arg,
        })
        pos = hit.end()
    return entries


_IIFE_SKIP = frozenset([
    '_install', 'return', 'function', 'var', 'let', 'const',
    'if', 'else', 'while', 'for', 'true', 'false', 'null',
])

def _parse_iife_form(full_src, iife_body, iife_body_abs_start):
    ret_m = re.search(r'\breturn\s*\{', iife_body)
    if not ret_m:
        raise ValueError(
            "IIFE form: no 'return {' found inside window.LatexSandbox.")

    ret_obj_start_abs = iife_body_abs_start + ret_m.end() - 1
    ret_obj_end_abs   = find_function_end(full_src, ret_obj_start_abs)
    ret_obj_body      = full_src[ret_obj_start_abs + 1 : ret_obj_end_abs - 1]

    entries = []
    pos     = 0
    seen    = set()
    pat = re.compile(
        r'(?:\/\/\s*@(\w+)(?:\s+(\w+))?\s*\n\s*)?'
        r'(\w+)\s*(?::\s*(\w+)\s*)?(?:,|\n|$)',
        re.MULTILINE
    )
    while pos < len(ret_obj_body):
        hit = pat.search(ret_obj_body, pos)
        if not hit: break
        pos        = hit.end()
        export_key = hit.group(3)
        local_name = hit.group(4) or export_key

        if export_key in _IIFE_SKIP or export_key in seen: continue
        after_key = ret_obj_body[hit.start(3) + len(export_key):].lstrip()
        if after_key.startswith('('): continue

        seen.add(export_key)
        cmd = (hit.group(1) or "replace").lower()
        arg = hit.group(2)

        fn_def = re.search(
            r'function\s+' + re.escape(local_name) + r'\s*\(',
            iife_body
        )
        if not fn_def:
            raise ValueError(
                f"IIFE form: '{export_key}' (local: '{local_name}') is in return {{ }} "
                f"but 'function {local_name}(...)' not found in the IIFE body.")

        func_open_abs = iife_body_abs_start + fn_def.start()
        func_end_abs  = find_function_end(full_src, func_open_abs)
        func_src      = full_src[func_open_abs:func_end_abs]

        if local_name != export_key:
            func_src = re.sub(
                r'^function\s+' + re.escape(local_name) + r'\s*\(',
                f'function {export_key}(',
                func_src,
                count=1
            )

        entries.append({
            "name":     export_key,
            "func_src": func_src,
            "command":  cmd,
            "arg":      arg,
        })

    if not entries:
        raise ValueError(
            "IIFE form: no exportable names found in return { }.")

    return entries


def _last_renderer_fn_end(src):
    pat = re.compile(r'LatexRenderer\.\w+\s*=\s*function\s+\w+\s*\(')
    last_tail = None
    for hit in pat.finditer(src):
        fn_end = find_function_end(src, hit.start())
        tail = fn_end
        while tail < len(src) and src[tail] in (" ", "\t"): tail += 1
        if tail < len(src) and src[tail] == ";": tail += 1
        last_tail = tail
    return last_tail


def apply_commands(renderer_src, entries):
    results = { "replaced": [], "added": [], "deleted": [], "renamed": [] }

    for e in entries:
        name  = e["name"]
        func  = e["func_src"]
        cmd   = e["command"]
        arg   = e["arg"]

        if cmd == "replace":
            pat = re.compile(
                r'LatexRenderer\.' + re.escape(name) +
                r'\s*=\s*function\s+' + re.escape(name) + r'\s*\(',
                re.MULTILINE
            )
            hit = pat.search(renderer_src)
            if not hit:
                raise ValueError(
                    f"@replace: LatexRenderer.{name} not found in renderer.")
            fn_start = hit.start()
            fn_end   = find_function_end(renderer_src, fn_start)
            tail = fn_end
            while tail < len(renderer_src) and renderer_src[tail] in (" ", "\t"):
                tail += 1
            if tail < len(renderer_src) and renderer_src[tail] == ";":
                tail += 1
            renderer_src = (renderer_src[:fn_start] +
                            f"LatexRenderer.{name} = {func};" +
                            renderer_src[tail:])
            results["replaced"].append(name)

        elif cmd == "add":
            exists = re.search(
                r'LatexRenderer\.' + re.escape(name) + r'\s*=\s*function',
                renderer_src
            )
            if exists:
                raise ValueError(
                    f"@add: LatexRenderer.{name} already exists — use @replace.")
            ins = _last_renderer_fn_end(renderer_src)
            if ins is None:
                raise ValueError(
                    "@add: could not find insertion point in renderer.")
            new_block = f"\n\n  LatexRenderer.{name} = {func};"
            renderer_src = renderer_src[:ins] + new_block + renderer_src[ins:]
            results["added"].append(name)

        elif cmd == "delete":
            pat = re.compile(
                r'[ \t]*LatexRenderer\.' + re.escape(name) +
                r'\s*=\s*function\s+' + re.escape(name) + r'\s*\(',
                re.MULTILINE
            )
            hit = pat.search(renderer_src)
            if not hit:
                raise ValueError(
                    f"@delete: LatexRenderer.{name} not found in renderer.")
            fn_start = hit.start()
            fn_end   = find_function_end(renderer_src, fn_start)
            tail = fn_end
            while tail < len(renderer_src) and renderer_src[tail] in (" ", "\t"):
                tail += 1
            if tail < len(renderer_src) and renderer_src[tail] == ";":
                tail += 1
            if tail < len(renderer_src) and renderer_src[tail] == "\n":
                tail += 1
            renderer_src = renderer_src[:fn_start] + renderer_src[tail:]
            results["deleted"].append(name)

        elif cmd == "rename":
            if not arg:
                raise ValueError(
                    f"@rename on '{name}' is missing the old name. "
                    f"Use: // @rename oldName")
            old = arg
            pat = re.compile(
                r'LatexRenderer\.' + re.escape(old) +
                r'\s*=\s*function\s+' + re.escape(old) + r'\s*\(',
                re.MULTILINE
            )
            hit = pat.search(renderer_src)
            if not hit:
                raise ValueError(
                    f"@rename: LatexRenderer.{old} not found in renderer.")
            fn_start = hit.start()
            fn_end   = find_function_end(renderer_src, fn_start)
            tail = fn_end
            while tail < len(renderer_src) and renderer_src[tail] in (" ", "\t"):
                tail += 1
            if tail < len(renderer_src) and renderer_src[tail] == ";":
                tail += 1
            renderer_src = (renderer_src[:fn_start] +
                            f"LatexRenderer.{name} = {func};" +
                            renderer_src[tail:])
            results["renamed"].append(f"{old} -> {name}")

        else:
            raise ValueError(
                f"Unknown command '@{cmd}' on function '{name}'. "
                f"Valid: @replace, @add, @delete, @rename.")

    return renderer_src, results


def clear_overrides(src):
    """Empty the body of window.LatexSandbox = { }."""
    m = re.search(r'window\.LatexSandbox\s*=\s*\{', src)
    if not m:
        raise ValueError("window.LatexSandbox not found in overrides.")
    line_start = m.start()
    while line_start > 0 and src[line_start - 1] != "\n":
        line_start -= 1
    return src[:line_start].rstrip() + "\n\nwindow.LatexSandbox = {\n\n};\n"


def do_commit():
    renderer_src  = open(RENDERER_PATH,  encoding="utf-8").read()
    overrides_src = open(OVERRIDES_PATH, encoding="utf-8").read()

    entries = extract_sandbox_functions(overrides_src)
    if not entries:
        raise ValueError(
            "No functions found in window.LatexSandbox — nothing to commit.")

    new_renderer, results = apply_commands(renderer_src, entries)
    new_overrides = clear_overrides(overrides_src)

    open(RENDERER_PATH,  "w", encoding="utf-8").write(new_renderer)
    open(OVERRIDES_PATH, "w", encoding="utf-8").write(new_overrides)
    return results


# ── request handler ───────────────────────────────────────────────────────────

def send_json(handler, code, payload):
    body = json.dumps(payload).encode()
    handler.send_response(code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(body)


class DevServerHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        # ── /api/shutdown ─────────────────────────────────────────────
        if path == "/api/shutdown":
            send_json(self, 200, {"ok": True})
            threading.Thread(target=shutdown, args=(self.server,)).start()
            return

        # ── /api/commit ───────────────────────────────────────────────
        if path == "/api/commit":
            try:
                results = do_commit()
                send_json(self, 200, dict(ok=True, **results))
            except Exception as e:
                send_json(self, 500, {"ok": False, "error": str(e)})
            return

        # ── /api/run-script ───────────────────────────────────────────
        if path == "/api/run-script":
            qs = parse_qs(parsed.query)
            file_param = qs.get("file", [None])[0]
            if not file_param or not file_param.endswith(".py"):
                send_json(self, 400, {"ok": False,
                    "error": "Missing or invalid ?file= param (must be .py)"})
                return
            try:
                full_script = safe_join(FOLDER, file_param)
            except PermissionError:
                send_json(self, 403, {"ok": False, "error": "Access denied"})
                return
            if not os.path.isfile(full_script):
                send_json(self, 404, {"ok": False,
                    "error": f"{file_param} not found"})
                return
            try:
                subprocess.Popen(
                    [sys.executable, full_script],
                    cwd=os.path.dirname(full_script),
                    creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
                )
                send_json(self, 200, {"ok": True, "launched": file_param})
            except Exception as e:
                send_json(self, 500, {"ok": False, "error": str(e)})
            return

        # ── /api/files ────────────────────────────────────────────────
        # Accepts optional ?path=subdir/nested  (relative to FOLDER)
        if path == "/api/files":
            qs = parse_qs(parsed.query)
            rel_dir = qs.get("path", [""])[0].strip("/")
            try:
                target_dir = safe_join(FOLDER, rel_dir) if rel_dir else os.path.normpath(FOLDER)
            except PermissionError:
                send_json(self, 403, {"ok": False, "error": "Access denied"})
                return
            if not os.path.isdir(target_dir):
                send_json(self, 404, {"ok": False, "error": "Directory not found"})
                return
            try:
                entries = []
                hidden = HIDDEN if not rel_dir else set()
                for name in sorted(os.listdir(target_dir)):
                    if name in hidden:
                        continue
                    full = os.path.join(target_dir, name)
                    # Build the subpath relative to FOLDER using forward slashes
                    subpath = (rel_dir + "/" + name).lstrip("/") if rel_dir else name
                    entries.append({
                        "name":   name,
                        "path":   subpath,          # relative path from FOLDER root
                        "isDir":  os.path.isdir(full),
                        "size":   os.path.getsize(full) if os.path.isfile(full) else None,
                        "ext":    os.path.splitext(name)[1].lower()
                    })
                send_json(self, 200, {"entries": entries, "dir": rel_dir})
            except Exception as e:
                send_json(self, 500, {"error": str(e)})
            return

        # ── /run/<rel-path> ───────────────────────────────────────────
        if path.startswith("/run/"):
            rel = unquote(path[len("/run/"):])
            try:
                full_path = safe_join(FOLDER, rel)
            except PermissionError:
                self.send_error(403, "Access denied"); return
            if os.path.isfile(full_path):
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Running: {rel}</title>
<style>
  body {{ margin: 0; background: #0d0f14; color: #e2e8f0; font-family: 'JetBrains Mono', monospace; }}
  #console-panel {{
    position: fixed; bottom: 0; left: 0; right: 0;
    background: #13161e; border-top: 2px solid #1e2330;
    max-height: 40vh; overflow-y: auto; padding: 10px 16px;
    font-size: 12px; z-index: 9999;
  }}
  #console-panel .label {{ color: #5b9cf6; font-weight: bold; margin-bottom: 6px; }}
  .log   {{ color: #e2e8f0; margin: 2px 0; }}
  .warn  {{ color: #fbbf24; margin: 2px 0; }}
  .error {{ color: #f87171; margin: 2px 0; }}
  .info  {{ color: #38bdf8; margin: 2px 0; }}
  #app {{ padding: 20px; padding-bottom: 45vh; }}
</style>
</head>
<body>
<div id="app"></div>
<div id="console-panel">
  <div class="label">▶ console — {rel}</div>
  <div id="console-output"></div>
</div>
<script>
  const out = document.getElementById('console-output');
  function logToPanel(cls, args) {{
    const line = document.createElement('div');
    line.className = cls;
    line.textContent = args.map(a => {{
      if (typeof a === 'object') {{ try {{ return JSON.stringify(a, null, 2); }} catch(e) {{ return String(a); }} }}
      return String(a);
    }}).join(' ');
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  }}
  const _log   = console.log.bind(console);
  const _warn  = console.warn.bind(console);
  const _error = console.error.bind(console);
  const _info  = console.info.bind(console);
  console.log   = (...a) => {{ _log(...a);   logToPanel('log',   a); }};
  console.warn  = (...a) => {{ _warn(...a);  logToPanel('warn',  a); }};
  console.error = (...a) => {{ _error(...a); logToPanel('error', a); }};
  console.info  = (...a) => {{ _info(...a);  logToPanel('info',  a); }};
  window.onerror = (msg, src, line, col, err) => {{
    logToPanel('error', [`❌ ${{msg}} (line ${{line}})`]);
  }};
  window.onunhandledrejection = (e) => {{
    logToPanel('error', [`❌ Unhandled promise rejection: ${{e.reason}}`]);
  }};
</script>
<script src="/files/{rel}"></script>
</body>
</html>"""
                self.wfile.write(html.encode())
                return
            else:
                self.send_error(404, "File not found")
                return

        # ── /files/<rel-path> ─────────────────────────────────────────
        if path.startswith("/files/"):
            rel = unquote(path[len("/files/"):])
            try:
                full_path = safe_join(FOLDER, rel)
            except PermissionError:
                self.send_error(403, "Access denied"); return
            if os.path.isfile(full_path):
                mime, _ = mimetypes.guess_type(full_path)
                mime = mime or "application/octet-stream"
                self.send_response(200)
                self.send_header("Content-Type", mime)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                with open(full_path, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_error(404, "File not found")
                return

        # ── root ──────────────────────────────────────────────────────
        if path == "/" or path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            html_path = os.path.join(os.path.dirname(__file__), "index.html")
            with open(html_path, "rb") as f:
                self.wfile.write(f.read())
            return

        self.send_error(404)

    def log_message(self, format, *args):
        print(f"  {args[0]} {args[1]}")


def open_browser():
    webbrowser.open(f"http://localhost:{PORT}")


def shutdown(server=None):
    print("\n  Shutting down server...")
    if server:
        server.shutdown()
    sys.exit(0)


if __name__ == "__main__":
    print(f"╔══════════════════════════════════════════╗")
    print(f"  Dev Server running at http://localhost:{PORT}")
    print(f"  Serving files from:")
    print(f"  {FOLDER}")
    print(f"  Press Ctrl+C or click Stop Server to stop")
    print(f"╚══════════════════════════════════════════╝")

    server = HTTPServer(("localhost", PORT), DevServerHandler)
    threading.Timer(0.5, open_browser).start()
    signal.signal(signal.SIGINT, lambda sig, frame: shutdown(server))
    server.serve_forever()