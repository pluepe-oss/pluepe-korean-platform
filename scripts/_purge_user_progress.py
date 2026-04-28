"""특정 학습자 계정의 user_progress 행을 안전하게 정리하는 일회성 스크립트.

사용:
    python scripts/_purge_user_progress.py <email> <unit_id>[,<unit_id>...]

예:
    python scripts/_purge_user_progress.py test_t1_basic@pluepe.com topik1_u02,topik1_u03,topik1_u04

동작:
1. .env.local 에서 NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 로드
2. public.users 에서 email 로 user_id 조회 (1건이어야 함)
3. user_progress 에서 (user_id, unit_id IN [...]) 행 미리보기 출력
4. 삭제 실행
5. 해당 user_id 의 남은 user_progress 전체 출력 (검증)

service_role 키는 RLS 를 우회하므로 절대 클라이언트에 노출 금지.
"""
from __future__ import annotations

import io
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def rest(url: str, method: str, headers: dict, payload: bytes | None = None):
    req = urllib.request.Request(url, data=payload, method=method)
    for k, v in headers.items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, body
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")


def main(email: str, unit_ids: list[str]) -> int:
    load_dotenv(PROJECT_ROOT / ".env.local")
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        print("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수 누락")
        return 1

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }

    print(f"🔍 1) email='{email}' 의 user_id 조회")
    q = urllib.parse.urlencode({"email": f"eq.{email}", "select": "id,email,name"})
    status, body = rest(f"{supabase_url}/rest/v1/users?{q}", "GET", headers)
    if status != 200:
        print(f"   ❌ HTTP {status}: {body}")
        return 1
    rows = json.loads(body)
    if not rows:
        print(f"   ❌ 해당 email 의 사용자 없음")
        return 1
    if len(rows) > 1:
        print(f"   ⚠️ 동일 email 행이 {len(rows)}건 — 중단")
        return 1
    user = rows[0]
    user_id = user["id"]
    print(f"   ✓ user_id = {user_id}  (name={user.get('name')!r})")

    in_filter = "(" + ",".join(f'"{u}"' for u in unit_ids) + ")"
    base_q = (
        f"user_id=eq.{user_id}&unit_id=in.{urllib.parse.quote(in_filter, safe='()\",')}"
    )

    print(f"\n🔍 2) 삭제 대상 미리보기 — unit_id IN {unit_ids}")
    preview_q = base_q + "&select=unit_id,section,completed,activity_date"
    status, body = rest(f"{supabase_url}/rest/v1/user_progress?{preview_q}", "GET", headers)
    if status != 200:
        print(f"   ❌ HTTP {status}: {body}")
        return 1
    targets = json.loads(body)
    print(f"   대상 행 수: {len(targets)}")
    for r in targets:
        print(f"     · {r['unit_id']} / {r['section']} / completed={r['completed']} / activity_date={r.get('activity_date')}")

    if not targets:
        print("\n   삭제할 행이 없으므로 종료.")
        return 0

    print(f"\n🗑️  3) 삭제 실행 (user_id={user_id}, unit_id IN {unit_ids})")
    delete_headers = {**headers, "Prefer": "return=representation"}
    status, body = rest(
        f"{supabase_url}/rest/v1/user_progress?{base_q}", "DELETE", delete_headers
    )
    if status not in (200, 204):
        print(f"   ❌ HTTP {status}: {body}")
        return 1
    deleted = json.loads(body) if body.strip() else []
    print(f"   ✓ 삭제 완료: {len(deleted)}건")

    print(f"\n🔍 4) 남은 user_progress (user_id={user_id})")
    remain_q = f"user_id=eq.{user_id}&select=unit_id,section,completed,activity_date&order=unit_id,section"
    status, body = rest(f"{supabase_url}/rest/v1/user_progress?{remain_q}", "GET", headers)
    if status != 200:
        print(f"   ❌ HTTP {status}: {body}")
        return 1
    remaining = json.loads(body)
    print(f"   남은 행 수: {len(remaining)}")
    for r in remaining:
        print(f"     · {r['unit_id']} / {r['section']} / completed={r['completed']} / activity_date={r.get('activity_date')}")

    return 0


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    email_arg = sys.argv[1]
    unit_ids_arg = [u.strip() for u in sys.argv[2].split(",") if u.strip()]
    raise SystemExit(main(email_arg, unit_ids_arg))
