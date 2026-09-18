#!/usr/bin/env python3
"""End-to-end smoke test for every API path the frontend depends on."""
import json
import urllib.request
import urllib.error
import uuid

BASE = "http://127.0.0.1:8787"
TOKEN = None
results = []


def call(method, path, body=None, token=None, raw=False):
    url = BASE + path
    data = None
    headers = {"Content-Type": "application/json"}
    if body is not None:
        data = json.dumps(body).encode()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            text = response.read().decode() or "{}"
            status = response.status
    except urllib.error.HTTPError as error:
        text = error.read().decode() or "{}"
        status = error.code
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        payload = {"raw": text[:160]}
    return status, payload


def check(label, method, path, body=None, token=None, expect_status=(200, 201), predicate=None):
    status, payload = call(method, path, body, token)
    ok = status in expect_status
    detail = ""
    if ok and predicate:
        try:
            ok = bool(predicate(payload))
        except Exception as exc:  # noqa: BLE001
            ok = False
            detail = f"predicate error: {exc}"
    if not ok:
        detail = detail or json.dumps(payload)[:200]
    results.append((label, ok, status, detail))
    print(("PASS " if ok else "FAIL ") + f"{label:52s} {status} {detail[:120]}")
    return payload


print("=== reset + reseed ===")
check("seed reset", "POST", "/api/admin/seed", {"reset": True})
check("health", "GET", "/api/health", predicate=lambda p: p["data"]["database"] == "ok")

print("\n=== auth ===")
login = check(
    "login demo admin",
    "POST",
    "/api/auth/login",
    {"email": "elias@portify.dev", "password": "demo1234"},
    predicate=lambda p: p["data"]["user"]["roles"],
)
TOKEN = login["data"]["session"]["access_token"]
USER_ID = login["data"]["user"]["id"]
check("auth session", "GET", "/api/auth/session", token=TOKEN, predicate=lambda p: p["data"]["user"]["id"] == USER_ID)
check("auth providers", "GET", "/api/auth/providers")
check("profiles/me", "GET", "/api/profiles/me", token=TOKEN, predicate=lambda p: p["data"]["profile"]["username"])
check("usernames check", "GET", "/api/usernames/check/portifytest", predicate=lambda p: "available" in p["data"])
check("usernames resolve", "GET", "/api/usernames/resolve/elias", predicate=lambda p: p["data"]["userId"] == USER_ID)
check("dashboard", "GET", "/api/dashboard", token=TOKEN, predicate=lambda p: "completeness" in p["data"])
check("portfolio bundle", "GET", "/api/portfolio/elias", predicate=lambda p: len(p["data"]["projects"]) > 0)
check(
    "portfolio private guard",
    "GET",
    "/api/portfolio/doesnotexist",
    expect_status=(404,),
)

print("\n=== profile mutations ===")
check(
    "profile update",
    "PATCH",
    "/api/profile",
    {"title": "Principal Engineer · Edge & Design Systems"},
    token=TOKEN,
    predicate=lambda p: p["data"]["profile"]["title"].startswith("Principal"),
)
check("profile update rejects bad handle", "PATCH", "/api/profile", {"username": "a"}, token=TOKEN, expect_status=(400,))

print("\n=== collections (frontend queries) ===")
check(
    "projects list (ordered)",
    "GET",
    f"/api/db/projects?f.user_id=eq.{USER_ID}&order=featured.desc,created_at.desc&limit=200",
    token=TOKEN,
    predicate=lambda p: isinstance(p["data"], list) and len(p["data"]) >= 6,
)
check(
    "skills list",
    "GET",
    f"/api/db/skills?f.user_id=eq.{USER_ID}&order=proficiency.desc&limit=200",
    token=TOKEN,
    predicate=lambda p: len(p["data"]) >= 15,
)
check(
    "experiences list",
    "GET",
    f"/api/db/experiences?f.user_id=eq.{USER_ID}&order=start_date.desc&limit=100",
    token=TOKEN,
    predicate=lambda p: len(p["data"]) >= 3,
)
check(
    "education list",
    "GET",
    f"/api/db/education?f.user_id=eq.{USER_ID}&order=start_date.desc&limit=100",
    token=TOKEN,
    predicate=lambda p: len(p["data"]) >= 1,
)
check(
    "blog list with author embed",
    "GET",
    "/api/db/blog_posts?f.published=eq.1&f.is_public=eq.1&order=publish_date.desc&limit=60&embed=author:profiles(id,full_name,username,avatar_url)",
    predicate=lambda p: len(p["data"]) >= 3 and p["data"][0]["author"]["username"],
)
check(
    "blog by slug with author embed",
    "GET",
    "/api/db/blog_posts?f.slug=eq.shipping-a-full-stack-on-cloudflare-workers&limit=1&embed=author:profiles(id,full_name,username,avatar_url,title,bio)",
    predicate=lambda p: isinstance(p["data"], list) and len(p["data"]) == 1,
)
check(
    "comments with user embed",
    "GET",
    "/api/db/comments?f.content_type=eq.project&order=created_at.asc&limit=200&embed=user:profiles(id,full_name,username,avatar_url)",
)
check("testimonials public", "GET", "/api/db/testimonials?f.approved=eq.1&limit=9&order=created_at.desc")
check("themes list", "GET", f"/api/db/themes?f.user_id=eq.{USER_ID}&limit=1", token=TOKEN)
check("resumes list", "GET", f"/api/db/resumes?f.user_id=eq.{USER_ID}&limit=1", token=TOKEN)
check(
    "portfolio sections ordered",
    "GET",
    f"/api/db/portfolio_sections?f.user_id=eq.{USER_ID}&order=position_order.asc&limit=50",
    token=TOKEN,
    predicate=lambda p: len(p["data"]) >= 7,
)

print("\n=== create/update/delete project ===")
created = check(
    "create project",
    "POST",
    "/api/db/projects",
    {"rows": {"user_id": USER_ID, "title": "Smoke Test Project", "description": "created by smoke test", "tags": ["test"], "position": 0}},
    token=TOKEN,
    expect_status=(200, 201),
)
project_id = created["data"][0]["id"] if isinstance(created["data"], list) else created["data"]["id"]
check(
    "update project",
    "PATCH",
    f"/api/db/projects?f.id=eq.{project_id}",
    {"title": "Smoke Test Project (updated)"},
    token=TOKEN,
)
check(
    "upload media (base64)",
    "POST",
    "/api/media/upload",
    {"filename": "pixel.png", "content_type": "image/png", "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "purpose": "smoke"},
    token=TOKEN,
)
check("media list", "GET", "/api/media?limit=5", token=TOKEN)
check("delete project", "DELETE", f"/api/db/projects?f.id=eq.{project_id}", token=TOKEN)

print("\n=== social ===")
people = call("GET", "/api/community/people?limit=10")[1]["data"]["people"]
target = next((p for p in people if p["username"] != "elias"), people[0])
check("contact submit", "POST", "/api/contact", {
    "name": "Smoke Tester", "email": "smoke@portify.dev", "subject": "Smoke test enquiry",
    "message": "This is an end-to-end smoke test message.", "recipient": "elias",
}, expect_status=(200, 201))
inbox = check("inbox", "GET", "/api/messages/inbox", token=TOKEN, predicate=lambda p: p["data"]["messages"])
msg_id = inbox["data"]["messages"][0]["id"]
check("mark message read", "PATCH", f"/api/messages/{msg_id}", {"read": True, "starred": True}, token=TOKEN)
check("reply to message", "POST", f"/api/messages/{msg_id}/reply", {"body": "Thanks for the smoke test!"}, token=TOKEN)
state = check("follow state", "GET", f"/api/social/follow/{target['id']}", token=TOKEN)
if state["data"].get("isFollowing"):
    check("unfollow to reset state", "DELETE", f"/api/social/follow/{target['id']}", token=TOKEN)
check("follow developer", "POST", f"/api/social/follow/{target['id']}", token=TOKEN, predicate=lambda p: p["data"].get("following") is True)
check("unfollow developer", "DELETE", f"/api/social/follow/{target['id']}", token=TOKEN, predicate=lambda p: p["data"].get("following") is False)
check("reaction summary", "GET", "/api/social/reactions?content_type=project&content_id=" + project_id if project_id else "/api/social/reactions?content_type=project&content_id=x")
first_project = call("GET", "/api/db/projects?limit=1")[1]["data"][0]
check(
    "toggle reaction",
    "POST",
    "/api/social/reactions/toggle",
    {"content_type": "project", "content_id": first_project["id"], "reaction_type": "love"},
    token=TOKEN,
    predicate=lambda p: "summary" in p["data"] or "counts" in p["data"],
)
skill = call("GET", f"/api/db/skills?f.user_id=neq.{USER_ID}&limit=1")[1]["data"]
if skill:
    check("endorse skill", "POST", f"/api/social/endorse/{skill[0]['id']}", {}, token=TOKEN)
check("delete message", "DELETE", f"/api/messages/{msg_id}", token=TOKEN)

print("\n=== community / discovery ===")
check("community featured", "GET", "/api/community/featured?limit=5", predicate=lambda p: len(p["data"]["people"]) > 0)
check("community people search", "GET", "/api/community/people?limit=24&q=mara", predicate=lambda p: len(p["data"]["people"]) >= 1)
check("activity feed", "GET", "/api/activity?limit=25", token=TOKEN, predicate=lambda p: "activity" in p["data"])
check("notifications", "GET", "/api/notifications", token=TOKEN)
check("search", "GET", "/api/search?q=react&limit=6", predicate=lambda p: "people" in p["data"])
check("site settings bundle", "GET", "/api/site/settings", predicate=lambda p: "settings" in p["data"])
for key in ("contact_info", "social_links", "site_info", "features"):
    check(f"site setting {key}", "GET", f"/api/site/settings/{key}")
check("stats public", "GET", "/api/stats/public", predicate=lambda p: p["data"]["portfolios"] > 0)
check("newsletter", "POST", "/api/newsletter", {"email": f"smoke-{uuid.uuid4().hex[:6]}@portify.dev"})

print("\n=== analytics ===")
check("analytics me", "GET", "/api/analytics/me?range=30d", token=TOKEN, predicate=lambda p: "daily" in p["data"])
check(
    "analytics event",
    "POST",
    "/api/analytics/event",
    {"username": "elias", "event_type": "page_view", "path": "/elias", "session_key": f"smoke-{uuid.uuid4().hex[:8]}"},
)

print("\n=== admin ===")
check("admin stats", "GET", "/api/admin/stats", token=TOKEN, predicate=lambda p: p["data"]["totals"]["users"] > 0)
users = check("admin users", "GET", "/api/admin/users?limit=50", token=TOKEN, predicate=lambda p: len(p["data"]["users"]) > 0)
check("admin content", "GET", "/api/admin/content", token=TOKEN)
check("admin audit", "GET", "/api/admin/audit", token=TOKEN, predicate=lambda p: "entries" in p["data"])
check("admin health", "GET", "/api/admin/health", token=TOKEN)
victim = next((u for u in users["data"]["users"] if u["id"] != USER_ID), None)
if victim:
    check("admin role change (user)", "PATCH", f"/api/admin/users/{victim['id']}/role", {"role": "moderator"}, token=TOKEN)
    check("admin role change (revert)", "PATCH", f"/api/admin/users/{victim['id']}/role", {"role": "user"}, token=TOKEN)

print("\n=== anon access guards ===")
check("anon cannot read inbox", "GET", "/api/messages/inbox", expect_status=(401, 403))
check("anon cannot read dashboard", "GET", "/api/dashboard", expect_status=(401, 403))
check("anon cannot read admin", "GET", "/api/admin/stats", expect_status=(401, 403))
check("bad credentials rejected", "POST", "/api/auth/login", {"email": "elias@portify.dev", "password": "wrong"}, expect_status=(400, 401, 403))
check("unfiltered delete refused", "DELETE", "/api/db/projects", token=TOKEN, expect_status=(400,))
check("unknown route 404", "GET", "/api/nope", expect_status=(404,))

print("\n=== seo ===")
check("sitemap", "GET", "/sitemap.xml", expect_status=(200,))
check("rss", "GET", "/rss.xml", expect_status=(200,))
check("robots", "GET", "/robots.txt", expect_status=(200,))
check("og image", "GET", "/api/og/elias", expect_status=(200,))
check("spa fallback", "GET", "/discover", expect_status=(200,))

passed = sum(1 for _, ok, _, _ in results if ok)
print(f"\n{passed}/{len(results)} checks passed")
failures = [r for r in results if not r[1]]
if failures:
    print("FAILURES:")
    for label, _, status, detail in failures:
        print(f" - {label} ({status}) {detail}")
    raise SystemExit(1)
