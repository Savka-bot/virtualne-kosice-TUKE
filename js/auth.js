(function () {
    var STORAGE_KEY = "vk_auth_ok";
    var REGISTERED_KEY = "vk_registered_users";

    /**
     * Predvolení používatelia (v kóde).
     */
    var AUTH_USERS = [
        { login: "kosice", password: "virt2026" },
        { login: "student", password: "student" },
        { login: "demo", password: "demo" },
    ];

    function loadRegistered() {
        try {
            var raw = localStorage.getItem(REGISTERED_KEY);
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveRegistered(arr) {
        try {
            localStorage.setItem(REGISTERED_KEY, JSON.stringify(arr));
        } catch (e) {}
    }

    function loginExists(login) {
        var u = String(login || "").trim();
        if (!u) return false;
        if (AUTH_USERS.some(function (x) { return x.login === u; })) return true;
        return loadRegistered().some(function (x) { return x.login === u; });
    }

    function emailExistsRegistered(email) {
        var e = String(email || "").trim().toLowerCase();
        if (!e) return false;
        return loadRegistered().some(function (x) {
            return String(x.email || "").trim().toLowerCase() === e;
        });
    }

    function getAllAccountsForLogin() {
        return AUTH_USERS.concat(loadRegistered());
    }

    function isLoggedIn() {
        try {
            return sessionStorage.getItem(STORAGE_KEY) === "1";
        } catch (e) {
            return false;
        }
    }

    function login(loginStr, password) {
        var user = String(loginStr || "").trim();
        var pass = String(password || "");
        var ok = getAllAccountsForLogin().some(function (u) {
            return u.login === user && u.password === pass;
        });
        if (ok) {
            try {
                sessionStorage.setItem(STORAGE_KEY, "1");
            } catch (e) {}
        }
        return ok;
    }

    /**
     * Registrácia — uloží účet do localStorage (iba v tomto prehliadači).
     * @param {{ login: string, firstName: string, lastName: string, email: string, password: string, passwordAgain: string }} data
     * @returns {{ ok: boolean, message: string }}
     */
    function register(data) {
        data = data || {};
        var user = String(data.login || "").trim();
        var firstName = String(data.firstName || "").trim();
        var lastName = String(data.lastName || "").trim();
        var email = String(data.email || "").trim().toLowerCase();
        var pass = String(data.password || "");
        var pass2 = String(data.passwordAgain || "");

        if (firstName.length < 2) {
            return { ok: false, message: "Meno musí mať aspoň 2 znaky." };
        }
        if (lastName.length < 2) {
            return { ok: false, message: "Priezvisko musí mať aspoň 2 znaky." };
        }
        if (user.length < 3) {
            return { ok: false, message: "Používateľské meno musí mať aspoň 3 znaky." };
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(user)) {
            return {
                ok: false,
                message: "Používateľské meno: len písmená, číslice, bodka, pomlčka, podčiarkovník.",
            };
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { ok: false, message: "Zadaj platný e-mail." };
        }
        if (pass.length < 4) {
            return { ok: false, message: "Heslo musí mať aspoň 4 znaky." };
        }
        if (pass !== pass2) {
            return { ok: false, message: "Heslá sa nezhodujú." };
        }
        if (loginExists(user)) {
            return { ok: false, message: "Toto používateľské meno už existuje." };
        }
        if (emailExistsRegistered(email)) {
            return { ok: false, message: "Tento e-mail je už zaregistrovaný." };
        }

        var list = loadRegistered();
        list.push({
            login: user,
            password: pass,
            firstName: firstName,
            lastName: lastName,
            email: email,
        });
        saveRegistered(list);
        return { ok: true, message: "Účet bol vytvorený. Môžeš sa prihlásiť." };
    }

    function logout() {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }

    function requireAuth() {
        if (isLoggedIn()) return;
        var page = "";
        try {
            page =
                window.location.pathname.split("/").pop() ||
                "locations.html";
        } catch (e) {
            page = "locations.html";
        }
        var next = page + (window.location.search || "");
        window.location.replace("index.html?next=" + encodeURIComponent(next));
    }

    window.AUTH = {
        BUILTIN_USERS: AUTH_USERS,
        isLoggedIn: isLoggedIn,
        login: login,
        logout: logout,
        register: register,
        requireAuth: requireAuth,
        loginExists: loginExists,
        emailExistsRegistered: emailExistsRegistered,
    };
})();
