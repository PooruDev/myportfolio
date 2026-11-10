// Firebase adapter for Community Chat (ES module, no build step).
//
// Loaded lazily by community-chat.js via import() the first time the chat is
// opened, so the Firebase SDK is only downloaded (and a database connection is
// only opened) when a visitor actually uses the chat.
//
// Exposes loadChatFirebase() -> adapter:
//   ensureAuth()          -> Promise<uid>   (anonymous sign-in, memoized)
//   newKey()              -> string         (push id, nothing written)
//   send(key, data)       -> Promise        (atomic: message + rate-limit stamp)
//   exists(key)           -> Promise<bool>
//   subscribe(handlers)   -> unsubscribe()  (latest 60 + live new messages)
// Every rejection carries err.kind:
//   offline | timeout | network | load | config | auth | denied | unknown

const SDK_VERSION = "11.10.0";
const SDK_BASE = "https://www.gstatic.com/firebasejs/" + SDK_VERSION;

// Firebase web app config (Firebase Console -> Project settings -> Your apps).
// These values identify the web app and are not secrets; access is enforced by
// database.rules.json and Authentication. Analytics (measurementId) is kept in
// the config object but never initialized, so no analytics SDK is loaded.
const firebaseConfig = {
  apiKey: "AIzaSyDmLdFoUBdc2GBFOtZnvvKm74pF_Gl1C3k",
  authDomain: "communitychat-4de6d.firebaseapp.com",
  databaseURL:
    "https://communitychat-4de6d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "communitychat-4de6d",
  storageBucket: "communitychat-4de6d.firebasestorage.app",
  messagingSenderId: "773931167721",
  appId: "1:773931167721:web:5672fe933a68b5f82578",
  measurementId: "G-RFPNZV2HDC",
};

const HISTORY = 60; // latest N messages loaded
const WRITE_TIMEOUT = 10000;
const AUTH_TIMEOUT = 15000;

function fail(kind, message, cause) {
  const e = new Error(message || kind);
  e.kind = kind;
  if (cause) e.cause = cause;
  return e;
}

function classify(err) {
  if (err && err.kind) return err;
  const code = String((err && err.code) || "");
  const msg = String((err && err.message) || "");
  let kind = "unknown";
  if (/permission_denied/i.test(code + " " + msg)) kind = "denied";
  else if (navigator.onLine === false) kind = "offline";
  else if (code === "auth/network-request-failed" || /network|unavailable/i.test(code))
    kind = "network";
  else if (code.indexOf("auth/") === 0) kind = "auth";
  const e = fail(kind, msg || kind, err);
  e.code = code;
  return e;
}

function withTimeout(promise, ms) {
  let t;
  const timer = new Promise((_, reject) => {
    t = setTimeout(() => reject(fail("timeout", "timed out")), ms);
  });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}

let adapterPromise = null;
export function loadChatFirebase() {
  if (!adapterPromise) {
    adapterPromise = build().catch((e) => {
      adapterPromise = null; // allow a retry (e.g. after coming back online)
      throw classify(e);
    });
  }
  return adapterPromise;
}

async function build() {
  if (
    /^REPLACE_/.test(firebaseConfig.apiKey) ||
    /^REPLACE_/.test(firebaseConfig.appId)
  )
    throw fail("config", "Firebase web config (apiKey / appId) not filled in");

  let appMod, authMod, dbMod;
  try {
    [appMod, authMod, dbMod] = await Promise.all([
      import(SDK_BASE + "/firebase-app.js"),
      import(SDK_BASE + "/firebase-auth.js"),
      import(SDK_BASE + "/firebase-database.js"),
    ]);
  } catch (e) {
    throw fail("load", "could not load the Firebase SDK", e);
  }

  const { initializeApp, getApps, getApp } = appMod;
  const { getAuth, signInAnonymously } = authMod;
  const {
    getDatabase,
    ref,
    query,
    orderByKey,
    limitToLast,
    onChildAdded,
    onChildRemoved,
    onValue,
    push,
    update,
    get,
    serverTimestamp,
    goOnline,
    goOffline,
  } = dbMod;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app, firebaseConfig.databaseURL);

  // The database only connects once something subscribes/writes, but keep it
  // explicitly offline while the chat is closed so idle visitors never hold a
  // connection slot (Spark plan: 100 simultaneous connections).
  goOffline(db);

  let connected = null; // null = unknown yet, true/false once .info/connected reports
  let subscribed = false;
  let pendingWrites = 0;

  function maybeGoOffline() {
    if (!subscribed && pendingWrites === 0) goOffline(db);
  }

  // ── Anonymous auth (memoized; waits for any persisted session first) ──
  let authPromise = null;
  function ensureAuth() {
    if (!authPromise) {
      authPromise = (async () => {
        await auth.authStateReady();
        if (!auth.currentUser) await signInAnonymously(auth);
        const user = auth.currentUser;
        if (!user) throw fail("auth", "anonymous sign-in completed without a user");
        return user.uid;
      })().catch((e) => {
        authPromise = null; // let the caller retry
        throw classify(e);
      });
    }
    // Keep the underlying sign-in memoized if this caller times out; the SDK
    // request itself is not cancellable and a second sign-in could be created.
    return withTimeout(authPromise, AUTH_TIMEOUT).catch((e) => {
      throw classify(e);
    });
  }

  function newKey() {
    return push(ref(db, "messages")).key;
  }

  function toMessage(snap) {
    const v = snap.val();
    if (!v || typeof v !== "object") return null;
    return {
      id: snap.key,
      uid: typeof v.uid === "string" ? v.uid : "",
      name: String(v.name == null ? "" : v.name).slice(0, 40),
      message: String(v.message == null ? "" : v.message).slice(0, 500),
      location: String(v.location == null ? "" : v.location).slice(0, 60),
      device: String(v.device == null ? "" : v.device).slice(0, 20),
      at: typeof v.at === "number" ? v.at : 0,
    };
  }

  // One atomic multi-path write: the message plus this visitor's rate-limit
  // stamp. Both use the same server timestamp, which the rules compare.
  async function send(key, data) {
    const user = auth.currentUser;
    if (!user) throw fail("auth", "not signed in");
    if (navigator.onLine === false || connected === false)
      throw fail("offline", "offline");

    const stamp = serverTimestamp();
    const msg = {
      uid: user.uid,
      name: String(data.name).slice(0, 40),
      message: String(data.message).slice(0, 500),
      at: stamp,
    };
    if (data.location) msg.location = String(data.location).slice(0, 60);
    if (data.device) msg.device = String(data.device).slice(0, 20);

    const updates = {};
    updates["messages/" + key] = msg;
    updates["rateLimit/" + user.uid] = stamp;

    pendingWrites++;
    goOnline(db);
    const write = update(ref(db), updates);
    write
      .catch(() => {})
      .finally(() => {
        pendingWrites--;
        maybeGoOffline();
      });
    try {
      await withTimeout(write, WRITE_TIMEOUT);
    } catch (e) {
      const err = classify(e);
      if (err.kind === "denied") {
        // Firebase never says which rule refused a write, so log exactly what
        // was sent to make a refusal diagnosable from the browser console.
        console.warn("[chat] write refused by the database rules", {
          signedInUid: user.uid,
          paths: Object.keys(updates),
          messageFields: Object.keys(msg),
          nameLength: msg.name.length,
          messageLength: msg.message.length,
          locationLength: (msg.location || "").length,
          deviceLength: (msg.device || "").length,
        });
      }
      throw err;
    }
  }

  async function exists(key) {
    try {
      const snap = await withTimeout(get(ref(db, "messages/" + key)), WRITE_TIMEOUT);
      return snap.exists();
    } catch (e) {
      throw classify(e);
    }
  }

  // handlers: onAdded(msg, isInitial), onRemoved(id), onInitial(),
  //           onConnection(bool), onError(err)
  function subscribe(h) {
    const q = query(ref(db, "messages"), orderByKey(), limitToLast(HISTORY));
    const offs = [];
    let initial = true;
    let errored = false;
    const onCancel = (e) => {
      if (errored) return;
      errored = true;
      h.onError(classify(e));
    };

    subscribed = true;
    goOnline(db);

    // child_added fires for the stored history first, then for each new
    // message; the one-off value event marks the end of the history batch.
    offs.push(
      onChildAdded(
        q,
        (snap) => {
          const m = toMessage(snap);
          if (m) h.onAdded(m, initial);
        },
        onCancel,
      ),
    );
    offs.push(onChildRemoved(q, (snap) => h.onRemoved(snap.key), onCancel));
    onValue(
      q,
      () => {
        initial = false;
        h.onInitial();
      },
      onCancel,
      { onlyOnce: true },
    );
    offs.push(
      onValue(ref(db, ".info/connected"), (snap) => {
        connected = snap.val() === true;
        h.onConnection(connected);
      }),
    );

    return function unsubscribe() {
      offs.forEach((off) => {
        try {
          off();
        } catch (e) {}
      });
      subscribed = false;
      connected = null;
      maybeGoOffline();
    };
  }

  return { ensureAuth, newKey, send, exists, subscribe };
}
