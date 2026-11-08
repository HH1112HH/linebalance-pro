from __future__ import annotations

import argparse
import hashlib
import os
import sys
from pathlib import Path
from typing import Any

import psycopg
from psycopg import Connection

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MIGRATIONS_DIR = REPO_ROOT / "backend" / "migrations"
DEFAULT_ENV_FILE = REPO_ROOT / ".env.local"
CONNECT_TIMEOUT_SEC = 15

REGISTRY_SQL = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    version     text PRIMARY KEY,
    checksum    text NOT NULL,
    applied_at  timestamptz NOT NULL DEFAULT now()
)
"""


def _load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _database_url(explicit: str | None, env_file: Path) -> str:
    _load_env_file(env_file)
    value = (explicit or os.getenv("DATABASE_URL", "")).strip()
    if not value:
        raise SystemExit(
            "DATABASE_URL is not set. Set the environment variable, pass "
            "--database-url, or create a local .env.local file."
        )
    return value


def _checksum(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _migration_files(directory: Path) -> list[Path]:
    if not directory.is_dir():
        raise SystemExit(f"Migration directory not found: {directory}")
    files = sorted(directory.glob("*.sql"), key=lambda item: item.name)
    if not files:
        raise SystemExit(f"No .sql migrations found in {directory}")
    return files


def _ensure_registry(conn: Connection[Any]) -> None:
    conn.execute(REGISTRY_SQL)
    conn.commit()


def _applied_versions(conn: Connection[Any]) -> dict[str, str]:
    rows = conn.execute("SELECT version, checksum FROM schema_migrations").fetchall()
    return {str(version): str(checksum) for version, checksum in rows}


def _report(
    files: list[Path], applied: dict[str, str]
) -> tuple[list[Path], list[Path]]:
    pending: list[Path] = []
    mismatched: list[Path] = []
    for path in files:
        expected = _checksum(path)
        recorded = applied.get(path.name)
        if recorded is None:
            pending.append(path)
            print(f"[pending]  {path.name}")
        elif recorded != expected:
            mismatched.append(path)
            print(f"[MISMATCH] {path.name} (file changed after apply)")
        else:
            print(f"[applied]  {path.name}")
    return pending, mismatched


def run_check(conn: Connection[Any], files: list[Path]) -> int:
    applied = _applied_versions(conn)
    pending, mismatched = _report(files, applied)
    if mismatched or pending:
        return 1
    print("Schema is up to date.")
    return 0


def run_apply(conn: Connection[Any], files: list[Path]) -> int:
    applied = _applied_versions(conn)
    pending, mismatched = _report(files, applied)
    if mismatched:
        print("Refusing to apply: an applied migration file was modified.")
        return 1

    for path in pending:
        checksum = _checksum(path)
        sql = path.read_text(encoding="utf-8")
        with conn.transaction():
            conn.execute(sql)
            conn.execute(
                "INSERT INTO schema_migrations (version, checksum) VALUES (%s, %s)",
                (path.name, checksum),
            )
        print(f"[applied]  {path.name}")

    if not pending:
        print("Nothing to apply.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Forward-only migration runner. No auto-run at app startup."
    )
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--check", action="store_true", help="Fail if not up to date")
    action.add_argument("--apply", action="store_true", help="Apply pending migrations")
    parser.add_argument(
        "--database-url",
        default=None,
        help="PostgreSQL URL; prefer DATABASE_URL or .env.local instead.",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=DEFAULT_ENV_FILE,
        help="Local env file with DATABASE_URL (default: .env.local).",
    )
    parser.add_argument(
        "--migrations-dir",
        type=Path,
        default=DEFAULT_MIGRATIONS_DIR,
        help="Directory containing *.sql migrations.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    url = _database_url(args.database_url, args.env_file)
    files = _migration_files(args.migrations_dir)

    with psycopg.connect(url, connect_timeout=CONNECT_TIMEOUT_SEC) as conn:
        _ensure_registry(conn)
        if args.check:
            return run_check(conn, files)
        return run_apply(conn, files)


if __name__ == "__main__":
    sys.exit(main())
