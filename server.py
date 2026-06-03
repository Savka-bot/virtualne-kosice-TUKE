import json
import pickle
import hashlib
import functools
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DATA_FILE = DATA_DIR / "users.bin"


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def default_state():
    return {
        "users": {
            "kosice": {
                "password_hash": hash_password("virt2026"),
                "firstName": "Virt",
                "lastName": "Kosice",
                "email": "kosice@example.local",
                "favorites": [],
            },
            "student": {
                "password_hash": hash_password("student"),
                "firstName": "Demo",
                "lastName": "Student",
                "email": "student@example.local",
                "favorites": [],
            },
            "demo": {
                "password_hash": hash_password("demo"),
                "firstName": "Demo",
                "lastName": "User",
                "email": "demo@example.local",
                "favorites": [],
            },
        }
    }


def load_state():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        state = default_state()
        save_state(state)
        return state
    with DATA_FILE.open("rb") as f:
        state = pickle.load(f)
    if not isinstance(state, dict) or "users" not in state:
        state = default_state()
        save_state(state)
    return state


def save_state(state):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with DATA_FILE.open("wb") as f:
        pickle.dump(state, f)


def parse_json(handler):
    length = int(handler.headers.get("Content-Length", "0") or 0)
    body = handler.rfile.read(length) if length > 0 else b"{}"
    try:
        return json.loads(body.decode("utf-8"))
    except Exception:
        return {}


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        # Always serve static files from project root, regardless of current cwd.
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _set_cors_headers(self):
        origin = self.headers.get("Origin", "")
        allowed = {
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http://[::1]:5500",
        }
        if origin in allowed:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Auth-User")

    def _send_json(self, status, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self._set_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _user_from_header(self):
        return (self.headers.get("X-Auth-User") or "").strip()

    def _require_user(self):
        login = self._user_from_header()
        state = load_state()
        user = state["users"].get(login)
        return login, user, state

    def do_GET(self):
        if self.path == "/api/favorites":
            login, user, _ = self._require_user()
            if not login or not user:
                return self._send_json(401, {"ok": False, "message": "Unauthorized"})
            favorites = user.get("favorites", [])
            return self._send_json(200, {"ok": True, "favorites": favorites})
        return super().do_GET()

    def do_OPTIONS(self):
        if self.path.startswith("/api/"):
            self.send_response(204)
            self._set_cors_headers()
            self.end_headers()
            return
        self.send_response(204)
        self._set_cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/login":
            payload = parse_json(self)
            login = str(payload.get("login", "")).strip()
            password = str(payload.get("password", ""))
            state = load_state()
            user = state["users"].get(login)
            if not user:
                return self._send_json(401, {"ok": False, "message": "Nesprávne meno alebo heslo."})
            if user.get("password_hash") != hash_password(password):
                return self._send_json(401, {"ok": False, "message": "Nesprávne meno alebo heslo."})
            return self._send_json(200, {"ok": True, "user": login})

        if self.path == "/api/register":
            payload = parse_json(self)
            login = str(payload.get("login", "")).strip()
            first_name = str(payload.get("firstName", "")).strip()
            last_name = str(payload.get("lastName", "")).strip()
            email = str(payload.get("email", "")).strip().lower()
            password = str(payload.get("password", ""))
            password_again = str(payload.get("passwordAgain", ""))

            if len(first_name) < 2:
                return self._send_json(400, {"ok": False, "message": "Meno musí mať aspoň 2 znaky."})
            if len(last_name) < 2:
                return self._send_json(400, {"ok": False, "message": "Priezvisko musí mať aspoň 2 znaky."})
            if len(login) < 3:
                return self._send_json(400, {"ok": False, "message": "Používateľské meno musí mať aspoň 3 znaky."})
            if not all(ch.isalnum() or ch in "._-" for ch in login):
                return self._send_json(400, {"ok": False, "message": "Používateľské meno: len písmená, číslice, bodka, pomlčka, podčiarkovník."})
            if "@" not in email or "." not in email.split("@")[-1]:
                return self._send_json(400, {"ok": False, "message": "Zadaj platný e-mail."})
            if len(password) < 4:
                return self._send_json(400, {"ok": False, "message": "Heslo musí mať aspoň 4 znaky."})
            if password != password_again:
                return self._send_json(400, {"ok": False, "message": "Heslá sa nezhodujú."})

            state = load_state()
            if login in state["users"]:
                return self._send_json(400, {"ok": False, "message": "Toto používateľské meno už existuje."})
            for existing in state["users"].values():
                if str(existing.get("email", "")).lower() == email:
                    return self._send_json(400, {"ok": False, "message": "Tento e-mail je už zaregistrovaný."})

            state["users"][login] = {
                "password_hash": hash_password(password),
                "firstName": first_name,
                "lastName": last_name,
                "email": email,
                "favorites": [],
            }
            save_state(state)
            return self._send_json(200, {"ok": True, "message": "Účet bol vytvorený. Môžeš sa prihlásiť."})

        if self.path == "/api/favorites/add":
            payload = parse_json(self)
            building_id = str(payload.get("id", "")).strip()
            login, user, state = self._require_user()
            if not login or not user:
                return self._send_json(401, {"ok": False, "message": "Unauthorized"})
            if not building_id:
                return self._send_json(400, {"ok": False, "message": "Chýba id objektu."})
            favorites = user.setdefault("favorites", [])
            if building_id in favorites:
                return self._send_json(200, {"ok": False, "message": "Už je v obľúbených!"})
            favorites.append(building_id)
            save_state(state)
            return self._send_json(200, {"ok": True, "message": "Pridané do obľúbených!"})

        if self.path == "/api/favorites/remove":
            payload = parse_json(self)
            building_id = str(payload.get("id", "")).strip()
            login, user, state = self._require_user()
            if not login or not user:
                return self._send_json(401, {"ok": False, "message": "Unauthorized"})
            favorites = user.setdefault("favorites", [])
            user["favorites"] = [x for x in favorites if x != building_id]
            save_state(state)
            return self._send_json(200, {"ok": True, "message": "Odstránené z obľúbených."})

        if self.path == "/api/favorites/clear":
            login, user, state = self._require_user()
            if not login or not user:
                return self._send_json(401, {"ok": False, "message": "Unauthorized"})
            user["favorites"] = []
            save_state(state)
            return self._send_json(200, {"ok": True, "message": "Obľúbené boli vymazané."})

        return self._send_json(404, {"ok": False, "message": "Not found"})


if __name__ == "__main__":
    handler = functools.partial(AppHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("0.0.0.0", 5500), handler)
    print("Serving at http://localhost:5500")
    print(f"Binary users file: {DATA_FILE}")
    print(f"Static root: {ROOT}")
    server.serve_forever()
