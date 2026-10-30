#!/usr/bin/env python3
"""Website management service for the whole project.

This service turns the static website into a usable website management center:
- health check API
- overview + page statistics
- asset & media inventory
- search pages by keyword
- dashboard page for admins
- static file serving for HTML/CSS/JS/images

Run:
    python service.py --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT_DIR = Path(__file__).resolve().parent
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = int(os.environ.get("PORT", "8000"))
START_TIME = time.time()


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class SiteManager:
    """Management model for the whole website."""

    def __init__(self, root_dir: Path):
        self.root_dir = root_dir.resolve()
        self.allowed_extensions = {
            ".html": "page",
            ".css": "style",
            ".js": "script",
            ".png": "image",
            ".jpg": "image",
            ".jpeg": "image",
            ".gif": "image",
            ".svg": "image",
            ".webp": "image",
            ".ico": "asset",
            ".json": "data",
            ".txt": "text",
            ".pdf": "document",
        }

    def scan_pages(self):
        pages = []
        for file_path in sorted(self.root_dir.glob("*.html")):
            title = self.extract_title(file_path)
            pages.append(
                {
                    "name": file_path.name,
                    "title": title or file_path.stem,
                    "path": f"/{file_path.name}",
                    "size_kb": round(file_path.stat().st_size / 1024, 2),
                    "last_modified": datetime.fromtimestamp(file_path.stat().st_mtime, timezone.utc).isoformat(),
                }
            )
        return pages

    def scan_assets(self):
        files = []
        for file_path in sorted(self.root_dir.rglob("*")):
            if file_path.is_dir():
                continue
            rel = file_path.relative_to(self.root_dir)
            ext = file_path.suffix.lower()
            files.append(
                {
                    "name": file_path.name,
                    "path": "/" + rel.as_posix(),
                    "type": self.allowed_extensions.get(ext, "other"),
                    "extension": ext,
                    "size_bytes": file_path.stat().st_size,
                }
            )
        return files

    def extract_title(self, file_path: Path) -> str:
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            return ""
        match = re.search(r"<title[^>]*>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
        if not match:
            return ""
        return re.sub(r"\s+", " ", match.group(1)).strip()

    def search_pages(self, keyword: str):
        query = (keyword or "").strip().lower()
        if not query:
            return {"query": query, "count": 0, "results": []}

        results = []
        for page in self.scan_pages():
            file_path = self.root_dir / page["name"]
            try:
                text = file_path.read_text(encoding="utf-8", errors="ignore").lower()
            except OSError:
                text = ""
            if query in text or query in page["title"].lower() or query in page["name"].lower():
                results.append({
                    "name": page["name"],
                    "title": page["title"],
                    "path": page["path"],
                    "match": "title or content",
                })

        return {"query": query, "count": len(results), "results": results}

    def collect_summary(self):
        files = self.scan_assets()
        pages = self.scan_pages()
        page_count = len(pages)
        total_size = sum(item["size_bytes"] for item in files)
        category_counts = {}

        for item in files:
            category_counts[item["type"]] = category_counts.get(item["type"], 0) + 1

        return {
            "name": "Project Website",
            "root": str(self.root_dir),
            "generated_at": utc_now_iso(),
            "total_files": len(files),
            "total_html_pages": page_count,
            "total_size_bytes": total_size,
            "pages": pages,
            "asset_breakdown": category_counts,
            "health": "good",
            "status": "running",
        }

    def safe_join(self, relative_path: str) -> Path:
        normalized = unquote(relative_path).lstrip("/")
        if not normalized:
            return self.root_dir / "trangchudong.html"
        target = (self.root_dir / normalized).resolve()
        root_resolved = self.root_dir.resolve()
        if target == root_resolved or root_resolved in target.parents:
            return target
        raise ValueError("Invalid path")


SITE_MANAGER = SiteManager(ROOT_DIR)


class SiteRequestHandler(BaseHTTPRequestHandler):
    server_version = "SiteManager/2.0"

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        route = parsed.path
        query = parse_qs(parsed.query)

        if route in {"/", "/index.html", "/home"}:
            self.serve_file(ROOT_DIR / "trangchudong.html")
            return

        if route == "/admin":
            self.send_html(self.build_dashboard_html())
            return

        if route == "/health":
            self.send_json({
                "status": "ok",
                "service": "site-manager",
                "timestamp": utc_now_iso(),
                "project": ROOT_DIR.name,
                "uptime_seconds": round(time.time() - START_TIME, 2),
                "pages": len(SITE_MANAGER.scan_pages()),
            })
            return

        if route == "/api/site":
            self.send_json({
                "name": "Project Website",
                "root": str(ROOT_DIR),
                "host": self.headers.get("Host", "unknown"),
                "pages": SITE_MANAGER.scan_pages(),
                "generated_at": utc_now_iso(),
            })
            return

        if route == "/api/pages":
            pages = SITE_MANAGER.scan_pages()
            self.send_json({"pages": pages, "count": len(pages)})
            return

        if route == "/api/summary":
            self.send_json(SITE_MANAGER.collect_summary())
            return

        if route == "/api/assets":
            assets = SITE_MANAGER.scan_assets()
            self.send_json({"items": assets, "count": len(assets)})
            return

        if route == "/api/metrics":
            summary = SITE_MANAGER.collect_summary()
            self.send_json({
                "uptime_seconds": round(time.time() - START_TIME, 2),
                "project_name": summary["name"],
                "total_files": summary["total_files"],
                "total_pages": summary["total_html_pages"],
                "total_size_bytes": summary["total_size_bytes"],
                "asset_breakdown": summary["asset_breakdown"],
                "generated_at": utc_now_iso(),
            })
            return

        if route == "/api/search":
            keyword = (query.get("q", [""])[0] or "").strip()
            self.send_json(SITE_MANAGER.search_pages(keyword))
            return

        if route == "/api/overview":
            summary = SITE_MANAGER.collect_summary()
            self.send_json({
                "status": "online",
                "website": summary["name"],
                "root": summary["root"],
                "pages": summary["total_html_pages"],
                "files": summary["total_files"],
                "size_mb": round(summary["total_size_bytes"] / (1024 * 1024), 2),
                "asset_breakdown": summary["asset_breakdown"],
                "updated_at": summary["generated_at"],
            })
            return

        if route.startswith("/api/"):
            self.send_json({"error": "not_found", "path": route}, status=404)
            return

        try:
            file_path = SITE_MANAGER.safe_join(route)
        except ValueError:
            self.send_json({"error": "invalid_path"}, status=400)
            return

        if file_path.is_dir():
            self.send_json({"error": "directory_not_allowed"}, status=403)
            return

        if not file_path.exists():
            self.send_json({"error": "not_found", "path": route}, status=404)
            return

        self.serve_file(file_path)

    def do_POST(self):
        parsed = urlparse(self.path)
        route = parsed.path

        if route == "/api/log":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                raw = self.rfile.read(length) if length > 0 else b"{}"
                payload = json.loads(raw.decode("utf-8", errors="ignore") or "{}")
            except Exception:
                payload = {}

            event = {
                "timestamp": utc_now_iso(),
                "source": payload.get("source", "unknown"),
                "message": payload.get("message", "No message"),
                "path": route,
            }
            self.send_json({"status": "logged", "event": event})
            return

        self.send_json({"error": "method_not_allowed", "path": route}, status=405)

    def serve_file(self, file_path: Path):
        try:
            content = file_path.read_bytes()
        except OSError:
            self.send_json({"error": "read_failed"}, status=500)
            return

        guessed_type, _ = mimetypes.guess_type(str(file_path))
        if guessed_type is None:
            guessed_type = "application/octet-stream"

        self.send_response(200)
        self.send_header("Content-Type", guessed_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(content)

    def send_html(self, html: str):
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def build_dashboard_html(self):
        summary = SITE_MANAGER.collect_summary()
        pages = SITE_MANAGER.scan_pages()
        cards = []
        for item in pages[:6]:
            cards.append(f"<li><strong>{item['title']}</strong> <span>({item['name']})</span></li>")

        return f"""
        <!doctype html>
        <html lang="vi">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Website Management Dashboard</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; background: #0f172a; color: #e2e8f0; }}
                .wrap {{ max-width: 1100px; margin: 40px auto; padding: 20px; }}
                .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 18px; margin-bottom: 24px; }}
                .card {{ background: linear-gradient(135deg, #111827, #1f2937); border: 1px solid #334155; border-radius: 14px; padding: 20px; box-shadow: 0 8px 24px rgba(0,0,0,.15); }}
                .card h3 {{ margin: 0 0 10px; color: #67e8f9; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }}
                .card .value {{ font-size: 30px; font-weight: 700; }}
                .panel {{ background: #111827; border: 1px solid #334155; border-radius: 14px; padding: 20px; margin-top: 18px; }}
                ul {{ padding-left: 18px; }}
                a {{ color: #7dd3fc; }}
                code {{ background: #0b1220; padding: 2px 6px; border-radius: 6px; }}
            </style>
        </head>
        <body>
            <div class="wrap">
                <h1>Website Management Dashboard</h1>
                <div class="grid">
                    <div class="card"><h3>Pages</h3><div class="value">{summary['total_html_pages']}</div></div>
                    <div class="card"><h3>Files</h3><div class="value">{summary['total_files']}</div></div>
                    <div class="card"><h3>Size</h3><div class="value">{round(summary['total_size_bytes'] / 1024, 1)} KB</div></div>
                    <div class="card"><h3>Status</h3><div class="value">{summary['health']}</div></div>
                </div>

                <div class="panel">
                    <h2>Quick links</h2>
                    <ul>
                        <li><a href="/">Trang chủ</a></li>
                        <li><a href="/security.html">Security center</a></li>
                        <li><a href="/dangnhap.html">Đăng nhập</a></li>
                        <li><a href="/dangki.html">Đăng ký</a></li>
                        <li><a href="/api/summary">API Summary</a></li>
                        <li><a href="/api/overview">API Overview</a></li>
                    </ul>
                </div>

                <div class="panel">
                    <h2>Pages list</h2>
                    <ul>
                        {''.join(cards) if cards else '<li>Không có trang nào.</li>'}
                    </ul>
                </div>

                <div class="panel">
                    <h2>Useful endpoints</h2>
                    <p><code>/health</code> → health check</p>
                    <p><code>/api/pages</code> → list all pages</p>
                    <p><code>/api/assets</code> → list all files and assets</p>
                    <p><code>/api/search?q=keyword</code> → search pages</p>
                    <p><code>/api/summary</code> → full website summary</p>
                </div>
            </div>
        </body>
        </html>
        """

    def log_message(self, format, *args):
        print(f"[{utc_now_iso()}] {self.address_string()} {format % args}")


def build_parser():
    parser = argparse.ArgumentParser(description="Project website management service")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host to bind the service to")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port to bind the service to")
    return parser


def main():
    args = build_parser().parse_args()
    print(f"[site-manager] Starting website management service on http://{args.host}:{args.port}")
    print(f"[site-manager] Project root: {ROOT_DIR}")
    print(f"[site-manager] Endpoints: /health, /api/overview, /api/pages, /api/assets, /api/search, /admin")

    httpd = ThreadingHTTPServer((args.host, args.port), SiteRequestHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[site-manager] Shutdown requested.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
