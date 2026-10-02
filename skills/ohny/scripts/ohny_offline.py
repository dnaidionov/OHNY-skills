#!/usr/bin/env python3
"""OHNY offline helper: the same "what's open when you arrive" maths as the live service, with no server.

Standard library only. Uses the lineup bundled in ../assets/lineup.json and, when it can reach
ohny.org within a few seconds, overlays OHNY's live status and times on top (so cancellations show up).
It never sends anything about the visitor anywhere.

  python3 ohny_offline.py nearby --lat 40.7308 --lng -73.9973 --max-walk-min 15 [--interests "history"]
        [--near SLUG] [--limit 3] [--offset 0] [--child-age 7] [--wheelchair] [--borough Manhattan]
        [--no-ticketed] [--now 2026-10-17T14:30] [--no-live]
  python3 ohny_offline.py search "grolier" [--now ...] [--no-live]
  python3 ohny_offline.py site SLUG [--now ...] [--no-live]
  python3 ohny_offline.py meta [--no-live]

Output is JSON shaped like the live service's. "source.live" says whether live data was overlaid.
Times are New York time. --now (YYYY-MM-DDTHH:MM) pretends it is another moment, for testing.
"""
import argparse
import datetime
import json
import math
import os
import re
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DATA = os.path.join(HERE, "..", "assets", "lineup.json")
DEFAULT_ALIASES = os.path.join(HERE, "..", "assets", "interest-aliases.json")
LIVE_URL = "https://ohny.org/data/festival.json"
DETAIL_URL = "https://ohny.org/data/{id}.json"
YEAR = 2026
CLOSING_SOON_MIN = 45
STARTING_SOON_MIN = 60
MIN_REMAINING_MIN = 10

MONTHS = {m: i + 1 for i, m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split())}
DAYS = [("friday_open_access_date", "fri_opening_time", "fri_closing_time"),
        ("saturday_open_access_date", "sat_opening_time", "sat_closing_time"),
        ("sunday_open_access_date", "sun_opening_time", "sun_closing_time")]


def round_half_up(x):
    return int(math.floor(x + 0.5))


# ---------------------------------------------------------------- time
def parse_date_label(label):
    m = re.search(r"([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})\s*$", str(label or "").strip())
    if not m or m.group(1).lower() not in MONTHS:
        return None
    return "%d-%02d-%02d" % (YEAR, MONTHS[m.group(1).lower()], int(m.group(2)))


def parse_time(label):
    m = re.match(r"^\s*(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]?\.?\s*$", str(label or ""))
    if not m:
        return None
    h = int(m.group(1))
    if h < 1 or h > 12:
        return None
    return (h % 12) * 60 + int(m.group(2)) + (720 if m.group(3).lower() == "p" else 0)


def fmt_time(minutes):
    m = ((minutes % 1440) + 1440) % 1440
    h24 = m // 60
    return "%d:%02d %s" % (((h24 + 11) % 12) + 1, m % 60, "PM" if h24 >= 12 else "AM")


def wall_minutes(date_str, minutes):
    y, mo, d = (int(x) for x in date_str.split("-"))
    return (datetime.date(y, mo, d).toordinal() - datetime.date(1970, 1, 1).toordinal()) * 1440 + minutes


def date_of(abs_min):
    day = abs_min // 1440
    return (datetime.date(1970, 1, 1) + datetime.timedelta(days=day)).isoformat()


def new_york_now():
    try:
        import zoneinfo
        now = datetime.datetime.now(zoneinfo.ZoneInfo("America/New_York"))
    except Exception:  # no tz database: US Eastern is UTC-4 until Nov 1, 2026 (covers the festival)
        utc = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        now = utc - datetime.timedelta(hours=4)
    return now.strftime("%Y-%m-%dT%H:%M")


def resolve_now(arg):
    s = (arg or new_york_now()).strip().replace(" ", "T")
    m = re.match(r"^(\d{4}-\d{2}-\d{2})T(\d{1,2}):(\d{2})", s)
    if not m:
        sys.exit("Could not read --now %r. Use e.g. 2026-10-17T14:30 (New York time)." % arg)
    wall = "%sT%02d:%s" % (m.group(1), int(m.group(2)), m.group(3))
    return wall, wall_minutes(m.group(1), int(m.group(2)) * 60 + int(m.group(3))), ("override" if arg else "real")


# ---------------------------------------------------------------- live overlay (best effort)
def build_windows(r):
    out = []
    for dk, ok, ck in DAYS:
        date, start, end = parse_date_label(r.get(dk)), parse_time(r.get(ok)), parse_time(r.get(ck))
        if date and start is not None and end is not None:
            out.append({"kind": "open", "date": date, "start": start, "end": end + 1440 if end <= start else end})
    for i in range(1, 9):
        date = parse_date_label(r.get("ticketed_session_day_%d_date" % i))
        start = parse_time(r.get("ticketed_session_start_time_%d" % i))
        end = parse_time(r.get("ticketed_session_end_time_%d" % i))
        if date and start is not None:
            w = {"kind": "session", "date": date, "start": start,
                 "end": start + 60 if end is None else (end + 1440 if end <= start else end)}
            out.append(w)
    return sorted(out, key=lambda w: (w["date"], w["start"]))


def fetch_json(url, timeout):
    req = urllib.request.Request(url, headers={"User-Agent": "ohny-offline-helper/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.load(res)


def overlay_live(sites, timeout=6):
    """Returns (live_ok, note, new_site_names). Mutates sites in place."""
    try:
        records = fetch_json(LIVE_URL, timeout)["records"]
        if not records:
            raise ValueError("empty lineup")
    except Exception as e:  # noqa: BLE001 - any failure just means "stay offline"
        return False, "could not reach ohny.org (%s); using the bundled copy" % type(e).__name__, []
    by_slug = {s["slug"]: s for s in sites}
    live_slugs, new_names = set(), []
    for r in records:
        slug = r.get("slug")
        live_slugs.add(slug)
        site = by_slug.get(slug)
        if not site:
            new_names.append(r.get("experience_name") or slug)
            continue
        old = {w["start"]: w.get("url") for w in site.get("windows", []) if w["kind"] == "session"}
        site["access"] = r.get("access_type") or []
        wins = build_windows(r)
        for w in wins:  # keep ticket links the live list does not carry
            if w["kind"] == "session" and old.get(w["start"]):
                w["url"] = old[w["start"]]
        site["windows"] = wins
    for s in sites:
        if s["slug"] not in live_slugs:
            s["access"] = ["Canceled"]  # dropped from the lineup: never send anyone there
    return True, "live ohny.org status and times overlaid", new_names


# ---------------------------------------------------------------- status
def has_access(site, v):
    return any(str(a).lower() == v for a in site.get("access", []))


def is_canceled(site):
    return has_access(site, "canceled") or has_access(site, "cancelled")


def is_sold_out(site):
    return has_access(site, "sold out")


def needs_ticket(site):
    return has_access(site, "ticketed") or has_access(site, "sold out") or has_access(site, "lottery")


def span(w):
    return wall_minutes(w["date"], w["start"]), wall_minutes(w["date"], w["end"])


def describe(w):
    s, e = span(w)
    return {"kind": w["kind"], "date": w["date"], "from": fmt_time(w["start"]), "to": fmt_time(w["end"]),
            "ticket_url": w.get("url"), "_start": s, "_end": e}


def status_at(site, now_abs, closing_soon_min=CLOSING_SOON_MIN):
    base = {"ticket_required": needs_ticket(site), "sold_out": is_sold_out(site)}
    if is_canceled(site):
        return dict(base, state="canceled", open_now=False)
    wins = [(w,) + span(w) for w in site.get("windows", [])]
    current = sorted([x for x in wins if x[1] <= now_abs < x[2]], key=lambda x: -x[2])
    upcoming = sorted([x for x in wins if x[1] > now_abs], key=lambda x: x[1])
    nxt = upcoming[0] if upcoming else None
    if current:
        closes_in = current[0][2] - now_abs
        return dict(base, state="open_now", open_now=True, current=describe(current[0][0]),
                    closes_in_min=closes_in, closing_soon=closes_in <= closing_soon_min,
                    next=describe(nxt[0]) if nxt else None)
    if nxt:
        starts_in = nxt[1] - now_abs
        if starts_in <= STARTING_SOON_MIN:
            state = "starts_soon"
        elif nxt[0]["date"] == date_of(now_abs):
            state = "later_today"
        else:
            state = "later"
        return dict(base, state=state, open_now=False, starts_in_min=starts_in, next=describe(nxt[0]))
    return dict(base, state="done", open_now=False)


def status_line(st):
    s = st["state"]
    if s == "canceled":
        return "Canceled"
    if s == "open_now":
        what = "Tour in progress" if st["current"]["kind"] == "session" else "Open"
        extra = " (closing in %d min)" % st["closes_in_min"] if st.get("closing_soon") else ""
        return "%s until %s%s" % (what, st["current"]["to"], extra)
    if s == "starts_soon":
        return "%s at %s (in %d min)" % ("Next tour" if st["next"]["kind"] == "session" else "Opens", st["next"]["from"], st["starts_in_min"])
    if s == "later_today":
        return "%s at %s today" % ("Next tour" if st["next"]["kind"] == "session" else "Opens", st["next"]["from"])
    if s == "later":
        return "Next: %s %s" % (st["next"]["date"], st["next"]["from"])
    return "No more times"


# ---------------------------------------------------------------- geo
def haversine_km(a, b):
    rad = math.radians
    d_lat, d_lng = rad(b["lat"] - a["lat"]), rad(b["lng"] - a["lng"])
    x = math.sin(d_lat / 2) ** 2 + math.cos(rad(a["lat"])) * math.cos(rad(b["lat"])) * math.sin(d_lng / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(x))


def walk_minutes(km):
    return max(1, round_half_up((km * 1.3) / 4.8 * 60))


def km_for_walk_minutes(minutes):
    return (minutes / 60.0) * 4.8 / 1.3


def maps_links(site):
    from urllib.parse import quote
    dest = site.get("address") or ", ".join(x for x in [site.get("name"), site.get("neighborhood"), site.get("borough"), "NY"] if x)
    q = quote(dest, safe="")
    return {"destination": dest,
            "google_transit": "https://www.google.com/maps/dir/?api=1&destination=%s&travelmode=transit" % q,
            "google_walking": "https://www.google.com/maps/dir/?api=1&destination=%s&travelmode=walking" % q,
            "apple": "https://maps.apple.com/?daddr=%s&dirflg=r" % q}


# ---------------------------------------------------------------- interests, suitability
def interpret_interests(text, aliases):
    items = [p.strip().lower() for p in re.split(r"[,;]|\sand\s", str(text or ""), flags=re.I) if p.strip()]
    tags, words = [], []
    for phrase in items:
        for tag, names in aliases.items():
            if any(phrase == a or a in phrase for a in names) and tag not in tags:
                tags.append(tag)
        for w in phrase.split():
            if len(w) > 3 and w not in words:
                words.append(w)
    return tags, words


def interest_score(site, tags, words):
    if not tags and not words:
        return 0
    hay = ("%s %s %s" % (site.get("name", ""), site.get("short") or "", site.get("partner") or "")).lower()
    return sum(1 for t in tags if t in site.get("tags", [])) * 3 + sum(1 for w in words if w in hay)


def suitability(site, child_age, wheelchair):
    flags = []
    m = re.search(r"(\d+)\s*\+", site.get("age") or "")
    if child_age is not None and m and child_age < int(m.group(1)):
        if "recommend" not in site["age"].lower():
            return False, "It's for %s, and your youngest is %d." % (site["age"].replace("Ages ", "ages "), child_age), flags
        flags.append("Recommended for ages %s+" % m.group(1))
    if wheelchair:
        w = site.get("wheelchair") or []
        if "Not wheelchair accessible" in w:
            return False, "OHNY lists it as not wheelchair accessible.", flags
        if "Partially wheelchair accessible" in w:
            flags.append("Only partly wheelchair accessible")
    return True, "", flags


def clip(s, n):
    return s if not s or len(s) <= n else s[: n - 1].rstrip() + "…"


def card(site, st, **extra):
    c = {"slug": site["slug"], "name": site["name"],
         "where": ", ".join(x for x in [site.get("neighborhood"), site.get("borough")] if x),
         "address": site.get("address"), "access": site.get("access"),
         "ticket_required": st["ticket_required"], "sold_out": True if st["sold_out"] else None,
         "state": st["state"], "status": status_line(st),
         "closing_soon": True if st.get("closing_soon") else None,
         "closes_in_min": st["closes_in_min"] if st["state"] == "open_now" else None,
         "summary": clip(site.get("short"), 220), "tags": site.get("tags"),
         "heads_up": site.get("heads_up") or None}
    if st.get("next"):
        n = st["next"]
        c["next"] = {"date": n["date"], "from": n["from"], "to": n["to"], "kind": n["kind"], "ticket_url": n["ticket_url"]}
    c.update(extra)
    return {k: v for k, v in c.items() if v is not None}


def clean(st):
    """Drop internal fields from a status dict."""
    for key in ("current", "next"):
        if st.get(key):
            st[key] = {k: v for k, v in st[key].items() if not k.startswith("_")}
    return st


# ---------------------------------------------------------------- commands
def nearby(sites, a, aliases, now_abs):
    tags, words = interpret_interests(a.interests, aliases)
    has_interests = bool(tags or words)
    by_slug = {s["slug"]: s for s in sites}
    suggested = set()
    here = None
    if a.near:
        ref = by_slug.get(a.near)
        if not ref or not ref.get("geo"):
            sys.exit("No located site %r." % a.near)
        here = ref["geo"]
        suggested = set(ref.get("related") or [])
    if a.lat is not None and a.lng is not None and not a.near:
        here = {"lat": a.lat, "lng": a.lng}
    if here is None:
        sys.exit("Need --lat and --lng (or --near SLUG). If you have no location, ask for a cross street, "
                 "look up its coordinates, then run again.")
    max_km = km_for_walk_minutes(a.max_walk_min) if a.max_walk_min else float("inf")
    ref_km = max_km if max_km != float("inf") else 2.0
    rows, skipped, off_interest, unlocated, in_range = [], [], [], 0, 0
    for s in sites:
        if s["slug"] == a.near or is_canceled(s):
            continue
        if a.borough and (s.get("borough") or "").lower() != a.borough.lower():
            continue
        if not s.get("geo"):
            unlocated += 1
            continue
        km = haversine_km(here, s["geo"])
        if km > max_km:
            continue
        in_range += 1
        walk = walk_minutes(km)
        score = interest_score(s, tags, words)
        off = has_interests and score == 0
        if off and s["slug"] not in suggested:
            continue
        st_now = status_at(s, now_abs)
        st = status_at(s, now_abs + walk)
        if st["sold_out"]:
            continue
        if st["ticket_required"] and a.no_ticketed:
            continue
        kind = "tour" if (st_now.get("current") or st.get("current") or {}).get("kind") == "session" else "site"
        if st["state"] != "open_now":
            if st_now["state"] == "open_now":
                skipped.append((km, s, walk, "closes_before_arrival",
                                "%s at %s, and it's a %d-minute walk, so it will be over by the time you get there." % (
                                    "The tour ends" if kind == "tour" else "It closes", st_now["current"]["to"], walk)))
            continue
        if st["closes_in_min"] < MIN_REMAINING_MIN:
            n = st["closes_in_min"]
            skipped.append((km, s, walk, "little_time_left",
                            "You'd get there with only %d minute%s left before %s at %s." % (
                                n, "" if n == 1 else "s", "the tour ends" if kind == "tour" else "it closes", st["current"]["to"])))
            continue
        ok, why, flags = suitability(s, a.child_age, a.wheelchair)
        if not ok:
            skipped.append((km, s, walk, "not_suitable", why))
            continue
        if off:
            off_interest.append({"slug": s["slug"], "name": s["name"], "walk_min": walk})
            continue
        sug = s["slug"] in suggested
        match = min(score, 6) / 6.0
        prox = 1 - min(km / ref_km, 1)
        kid = 1 if (a.child_age is not None and (s.get("family") or "kids" in s.get("tags", []))) else 0
        rank = (0.45 * match + 0.35 * prox + 0.2 * sug + 0.1 * kid) if has_interests else (0.75 * prox + 0.25 * sug + 0.1 * kid)
        rows.append({"s": s, "st": st, "km": km, "walk": walk, "rank": rank, "sug": sug, "flags": flags, "kid": kid})
    rows.sort(key=lambda r: (-r["rank"], r["km"]))
    skipped.sort(key=lambda r: r[0])
    page = []
    for r in rows[a.offset: a.offset + a.limit]:
        s = r["s"]
        page.append(card(
            s, clean(r["st"]),
            ohny_suggests=True if r["sug"] else None,
            fits_interests=[t for t in tags if t in s.get("tags", [])] if has_interests else None,
            kid_friendly=True if r["kid"] else None, group_notes=r["flags"] or None,
            distance_km=floor_tenth(r["km"]), walk_min=r["walk"],
            time_left_on_arrival_min=r["st"]["closes_in_min"],
            distance_approx=True if s["geo"].get("conf") != "address" else None, maps=maps_links(s)))
    return {"total": len(rows), "offset": a.offset, "has_more": a.offset + a.limit < len(rows), "unlocated": unlocated,
            "in_range_total": in_range,
            "skipped_total": len(skipped) or None,
            "skipped": [{"slug": s["slug"], "name": s["name"], "walk_min": w, "reason": reason, "why": why}
                        for _, s, w, reason, why in skipped[:8]] or None,
            "ohny_suggests_but_not_your_interests": off_interest[:5] or None, "results": page}


def floor_tenth(x):
    return floor_half(x * 10) / 10.0


def floor_half(x):
    return int(math.floor(x + 0.5))


STOPWORDS = {"the", "of", "at", "and", "in", "on", "an", "to", "for", "with"}


def search(sites, q, now_abs, limit=5):
    terms = [t for t in re.split(r"[^a-z0-9&'-]+", str(q).lower()) if len(t) > 1 and t not in STOPWORDS]
    if not terms:
        return {"total": 0, "results": []}
    allm, some = [], []
    for s in sites:
        name = (s.get("name") or "").lower()
        hay = " ".join(str(x or "") for x in [s.get("partner"), s.get("neighborhood"), s.get("borough"), s.get("short")]).lower()
        score = matched = 0
        for t in terms:
            in_name, in_hay = t in name, t in hay
            score += (5 if in_name else 0) + (1 if in_hay else 0)
            matched += 1 if (in_name or in_hay) else 0
        if name == " ".join(terms):
            score += 10
        if matched == len(terms):
            allm.append((score, s))
        elif matched:
            some.append((score + matched, s))
    view = lambda s: card(s, clean(status_at(s, now_abs)), maps=maps_links(s))  # noqa: E731
    allm.sort(key=lambda x: -x[0])
    if allm:
        return {"total": len(allm), "searched_sites": len(sites), "results": [view(s) for _, s in allm[:limit]]}
    some.sort(key=lambda x: -x[0])
    return {"total": 0, "searched_sites": len(sites), "no_match": True,
            "message": "No site in OHNY's lineup (all %d sites checked) matches all of: %s. Tell the visitor plainly that no site "
                       "by that name is listed; do not present the weaker partial matches as the answer." % (len(sites), ", ".join(terms)),
            "results": [], "partial_matches": [view(s) for _, s in some[:limit]]}


def site_detail(sites, slug, now_abs, live):
    by_slug = {s["slug"]: s for s in sites}
    s = by_slug.get(slug)
    if not s:
        sys.exit("Unknown site %r. Use the search command to find the slug." % slug)
    st = clean(status_at(s, now_abs))
    out = {"site": dict(s, status=dict(st, line=status_line(st)), maps=maps_links(s),
                        official_page="https://ohny.org/place/%s" % s["slug"],
                        related_sites=[{"slug": r, "name": by_slug[r]["name"]} for r in (s.get("related") or []) if r in by_slug])}
    out["site"]["windows"] = [dict(w, **{"from": fmt_time(w["start"]), "to": fmt_time(w["end"])}) for w in s.get("windows", [])]
    if live:
        try:
            d = fetch_json(DETAIL_URL.format(id=s["id"]), 5)["data"]
            out["site"]["description"] = d.get("description")
            out["site"]["access_notes"] = d.get("access_notes")
            out["detail_fetched_live"] = True
        except Exception:  # noqa: BLE001
            out["detail_fetched_live"] = False
            out["note"] = ("Full description and access notes are not in the bundled copy; read them at "
                           "https://ohny.org/place/%s" % s["slug"])
    return out


def main():
    ap = argparse.ArgumentParser(description="OHNY offline helper (no server needed).")
    ap.add_argument("--data", default=DEFAULT_DATA, help=argparse.SUPPRESS)
    ap.add_argument("--aliases", default=DEFAULT_ALIASES, help=argparse.SUPPRESS)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("nearby", "search", "site", "meta"):
        p = sub.add_parser(name)
        p.add_argument("--now")
        p.add_argument("--no-live", action="store_true", help="do not try to reach ohny.org")
        if name == "nearby":
            p.add_argument("--lat", type=float)
            p.add_argument("--lng", type=float)
            p.add_argument("--near")
            p.add_argument("--interests", default="")
            p.add_argument("--max-walk-min", type=int)
            p.add_argument("--limit", type=int, default=3)
            p.add_argument("--offset", type=int, default=0)
            p.add_argument("--child-age", type=int)
            p.add_argument("--wheelchair", action="store_true")
            p.add_argument("--borough")
            p.add_argument("--no-ticketed", action="store_true")
        elif name == "search":
            p.add_argument("query")
        elif name == "site":
            p.add_argument("slug")
    a = ap.parse_args()

    with open(a.data, encoding="utf-8") as f:
        snap = json.load(f)
    with open(a.aliases, encoding="utf-8") as f:
        aliases = json.load(f)
    sites = snap["sites"]
    wall, now_abs, now_source = resolve_now(a.now)

    live, note, new_names = (False, "live check skipped (--no-live); using the bundled copy", [])
    if not a.no_live:
        live, note, new_names = overlay_live(sites)

    source = {"live": live, "note": note, "bundled_copy_generated_at": snap["generated_at"],
              "now": {"new_york_time": wall, "source": now_source}}
    if not live:
        source["warning"] = ("This is a SAVED COPY from %s UTC: cancellations and last-minute changes after that are missing. "
                             "Tell the visitor and have them confirm on ohny.org." % snap["generated_at"][:16].replace("T", " "))
    if new_names:
        source["new_sites_not_in_bundled_copy"] = new_names[:10]

    if a.cmd == "nearby":
        body = nearby(sites, a, aliases, now_abs)
    elif a.cmd == "search":
        body = search(sites, a.query, now_abs)
    elif a.cmd == "site":
        body = site_detail(sites, a.slug, now_abs, live=not a.no_live)
    else:
        body = {"total_sites": len(sites)}
    print(json.dumps(dict(source=source, **body), indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
