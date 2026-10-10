
"use strict";

// Supabase Dashboard > Project Settings > API bölümünden al.
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";

const isConfigured =
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  !SUPABASE_KEY.includes("YOUR_SUPABASE");

const db = isConfigured && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const $ = (selector) => document.querySelector(selector);

let offers = [];
let activeCategory = "Tümü";
let authMode = "signup";
let toastTimer;

const allowedCategories = [
  "Yazılım", "Dil", "Tasarım", "Müzik", "Kişisel gelişim", "Diğer"
];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function initials(name) {
  return (name || "BirlikteBul")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0] || "")
    .join("")
    .toLocaleUpperCase("tr-TR");
}

function showToast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3000);
}

function openModal(id) {
  $("#" + id).classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  $("#" + id).classList.add("hidden");

  if (!document.querySelector(".modal:not(.hidden)")) {
    document.body.style.overflow = "";
  }
}

document.querySelectorAll("[data-close]").forEach((element) => {
  element.addEventListener("click", () => closeModal(element.dataset.close));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal:not(.hidden)").forEach((modal) => {
      closeModal(modal.id);
    });
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    $("#search").focus();
  }
});

$("#year").textContent = new Date().getFullYear();

function setAuthMode(mode) {
  authMode = mode;
  const login = mode === "login";

  $("#tab-login").classList.toggle("selected", login);
  $("#tab-signup").classList.toggle("selected", !login);
  $("#name-wrap").classList.toggle("hidden", login);
  $("#auth-title").textContent = login
    ? "Tekrar hoş geldin."
    : "Birlikte öğrenmeye hazır mısın?";
  $("#auth-submit").textContent = login
    ? "Giriş yap ↗"
    : "Hesap oluştur ↗";

  $("#auth-msg").textContent = "";
  $("#auth-msg").classList.remove("error");
}

function showAuth(mode = "signup") {
  setAuthMode(mode);
  openModal("auth-modal");
}

$("#login-open").addEventListener("click", () => showAuth("login"));
$("#signup-open").addEventListener("click", () => showAuth("signup"));
$("#join").addEventListener("click", () => showAuth("signup"));
$("#tab-login").addEventListener("click", () => setAuthMode("login"));
$("#tab-signup").addEventListener("click", () => setAuthMode("signup"));

function setMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function setUserUI(user) {
  const loggedIn = Boolean(user);

  $("#user-label").textContent = user
    ? (user.user_metadata?.display_name || user.email || "Üye")
    : "";

  $("#user-label").classList.toggle("hidden", !loggedIn);
  $("#login-open").classList.toggle("hidden", loggedIn);
  $("#signup-open").classList.toggle("hidden", loggedIn);
  $("#logout").classList.toggle("hidden", !loggedIn);
}

async function getCurrentUser() {
  if (!db) return null;

  const { data, error } = await db.auth.getUser();

  if (error) {
    console.error("Kullanıcı bilgisi alınamadı:", error.message);
    return null;
  }

  return data.user;
}

async function refreshUserUI() {
  setUserUI(await getCurrentUser());
}

$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = $("#auth-msg");
  const submit = $("#auth-submit");

  if (!db) {
    setMessage(message, "Önce script.js dosyasındaki Supabase bilgilerini ayarla.", true);
    return;
  }

  const email = $("#email").value.trim();
  const password = $("#password").value;

  submit.disabled = true;
  setMessage(message, "");

  try {
    let result;

    if (authMode === "signup") {
      const displayName = $("#display-name").value.trim() ||
        email.split("@")[0];

      result = await db.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName }
        }
      });
    } else {
      result = await db.auth.signInWithPassword({ email, password });
    }

    if (result.error) throw result.error;

    if (authMode === "signup" && !result.data.session) {
      setMessage(
        message,
        "Kayıt oluşturuldu. E-posta doğrulaması isteniyorsa gelen kutunu kontrol et."
      );
      return;
    }

    closeModal("auth-modal");
    await refreshUserUI();
    await loadOffers();

    showToast(authMode === "login"
      ? "Giriş başarılı."
      : "Hesabın oluşturuldu.");
  } catch (error) {
    setMessage(message, error.message || "İşlem tamamlanamadı.", true);
  } finally {
    submit.disabled = false;
  }
});

$("#logout").addEventListener("click", async () => {
  if (!db) return;

  const { error } = await db.auth.signOut();

  if (error) {
    showToast("Çıkış yapılamadı: " + error.message);
    return;
  }

  setUserUI(null);
  showToast("Çıkış yaptın.");
});

function renderOffers() {
  const query = $("#search").value.trim().toLocaleLowerCase("tr-TR");

  let filtered = offers.filter((offer) => {
    const categoryMatch =
      activeCategory === "Tümü" || offer.category === activeCategory;

    const searchable = [
      offer.title, offer.description, offer.category,
      offer.city, offer.display_name
    ].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");

    return categoryMatch && searchable.includes(query);
  });

  if ($("#sort").value === "name") {
    filtered.sort((a, b) =>
      (a.display_name || "").localeCompare(b.display_name || "", "tr")
    );
  } else {
    filtered.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  $("#count").textContent = `${filtered.length} beceri paylaşımı`;
  $("#cards").classList.toggle("hidden", filtered.length === 0);
  $("#empty").classList.toggle("hidden", filtered.length !== 0);

  $("#cards").innerHTML = filtered.map((offer) => `
    <article class="card">
      <div class="person">
        <div class="avatar">${escapeHTML(initials(offer.display_name))}</div>
        <div class="person-info">
          <b>${escapeHTML(offer.display_name || "BirlikteBul üyesi")}</b>
          <small>${escapeHTML(offer.city || "Şehir belirtilmedi")}</small>
        </div>
        <span class="tag">${escapeHTML(offer.category)}</span>
      </div>
      <h3>${escapeHTML(offer.title)}</h3>
      <p>${escapeHTML(offer.description)}</p>
      <div class="card-foot">
        <span>${escapeHTML(new Date(offer.created_at).toLocaleDateString("tr-TR"))}</span>
        <button type="button" data-profile-id="${escapeHTML(offer.id)}">Ayrıntıları gör ↗</button>
      </div>
    </article>
  `).join("");
}

async function loadOffers() {
  if (!db) {
    offers = [];
    $("#count").textContent = "Supabase bağlantısı gerekli";
    $("#cards").innerHTML = "";
    $("#cards").classList.add("hidden");
    $("#empty").classList.remove("hidden");
    $("#empty-title").textContent = "Veritabanı bağlantısı kurulmadı";
    $("#empty-text").textContent =
      "Supabase bilgilerini script.js dosyasına ekle ve supabase.sql dosyasını çalıştır.";
    $("#notice").textContent =
      "Bağlantı kurulduğunda gerçek kullanıcıların beceri paylaşımları burada gösterilir.";
    return;
  }

  $("#count").textContent = "Paylaşımlar yükleniyor…";

  const { data, error } = await db
    .from("skill_offers")
    .select(`
      id, user_id, title, description, category, city, created_at,
      profiles ( display_name, city )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Paylaşımlar yüklenemedi:", error);
    $("#count").textContent = "Veriler yüklenemedi";
    $("#cards").innerHTML = "";
    $("#cards").classList.add("hidden");
    $("#empty").classList.remove("hidden");
    $("#empty-title").textContent = "Veritabanı bağlantısını kontrol et";
    $("#empty-text").textContent =
      "SQL kurulumunun tamamlandığından ve Supabase anahtarlarının doğru olduğundan emin ol.";
    return;
  }

  offers = (data || []).map((offer) => ({
    ...offer,
    display_name: offer.profiles?.display_name || "BirlikteBul üyesi",
    city: offer.city || offer.profiles?.city || ""
  }));

  $("#empty-title").textContent = "Henüz beceri bulunamadı";
  $("#empty-text").textContent =
    "Filtreleri değiştirebilir veya ilk beceriyi sen paylaşabilirsin.";
  renderOffers();
}

$("#search").addEventListener("input", renderOffers);
$("#sort").addEventListener("change", renderOffers);

$("#categories").addEventListener("click", (event) => {
  const button = event.target.closest("[data-cat]");
  if (!button) return;

  activeCategory = button.dataset.cat;

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip === button);
  });

  renderOffers();
});

$("#reset").addEventListener("click", () => {
  $("#search").value = "";
  $("#sort").value = "new";
  activeCategory = "Tümü";

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.cat === "Tümü");
  });

  renderOffers();
});

$("#cards").addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile-id]");
  if (!button) return;

  const offer = offers.find(item =>
    String(item.id) === button.dataset.profileId
  );

  if (offer) showOfferDetails(offer);
});

function showOfferDetails(offer) {
  $("#profile-detail").innerHTML = `
    <div class="profile-avatar">${escapeHTML(initials(offer.display_name))}</div>
    <div class="eyebrow">BECERİ PAYLAŞIMI</div>
    <h2 class="profile-title">${escapeHTML(offer.title)}</h2>
    <b>${escapeHTML(offer.display_name || "BirlikteBul üyesi")}</b>
    <div>
      <span class="profile-meta">
        ${escapeHTML(offer.category)} · ${escapeHTML(offer.city || "Şehir belirtilmedi")}
      </span>
    </div>
    <p class="profile-desc">${escapeHTML(offer.description)}</p>
    <button id="request-send" class="btn btn-primary btn-full">
      Öğrenme isteği gönder ↗
    </button>
    <p id="request-msg" class="form-message" aria-live="polite"></p>
  `;

  $("#request-send").addEventListener("click", () => sendRequest(offer));
  openModal("profile-modal");
}

async function sendRequest(offer) {
  const messageElement = $("#request-msg");
  const button = $("#request-send");

  if (!db) {
    setMessage(messageElement, "Supabase bağlantısı kurulmamış.", true);
    return;
  }

  const user = await getCurrentUser();

  if (!user) {
    closeModal("profile-modal");
    showAuth("login");
    setMessage($("#auth-msg"), "İstek göndermek için önce giriş yap.");
    return;
  }

  if (user.id === offer.user_id) {
    setMessage(messageElement, "Kendi paylaşımına istek gönderemezsin.", true);
    return;
  }

  const message = prompt("Ne öğrenmek istediğini kısaca yaz (isteğe bağlı):");
  if (message === null) return;

  const trimmedMessage = message.trim();

  if (trimmedMessage.length > 500) {
    setMessage(messageElement, "Mesaj en fazla 500 karakter olabilir.", true);
    return;
  }

  button.disabled = true;

  try {
    const { error } = await db.from("skill_requests").insert({
      offer_id: offer.id,
      requester_id: user.id,
      message: trimmedMessage
    });

    if (error) {
      if (error.code === "23505") {
        throw new Error("Bu beceri için daha önce istek göndermişsin.");
      }
      throw error;
    }

    setMessage(messageElement, "İsteğin başarıyla gönderildi.");
    showToast("Öğrenme isteğin kaydedildi.");
  } catch (error) {
    setMessage(messageElement, error.message || "İstek gönderilemedi.", true);
  } finally {
    button.disabled = false;
  }
}

$("#offer-open").addEventListener("click", async () => {
  if (!db) {
    showAuth("signup");
    setMessage($("#auth-msg"), "Önce Supabase bağlantısını yapılandır.", true);
    return;
  }

  const user = await getCurrentUser();

  if (!user) {
    showAuth("signup");
    setMessage($("#auth-msg"), "Beceri paylaşmak için önce giriş yap.");
    return;
  }

  $("#offer-form").reset();
  setMessage($("#offer-msg"), "");
  openModal("offer-modal");
});

$("#offer-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = $("#offer-msg");
  const submit = $("#offer-submit");

  if (!db) {
    setMessage(message, "Supabase bağlantısı kurulmamış.", true);
    return;
  }

  const user = await getCurrentUser();

  if (!user) {
    setMessage(message, "Oturumun sona ermiş. Tekrar giriş yap.", true);
    return;
  }

  const title = $("#offer-title").value.trim();
  const category = $("#offer-cat").value;
  const description = $("#offer-desc").value.trim();
  const city = $("#offer-city").value.trim();

  if (title.length < 3 || title.length > 70) {
    setMessage(message, "Başlık 3–70 karakter arasında olmalı.", true);
    return;
  }

  if (!allowedCategories.includes(category)) {
    setMessage(message, "Geçerli bir kategori seç.", true);
    return;
  }

  if (description.length < 10 || description.length > 500) {
    setMessage(message, "Açıklama 10–500 karakter arasında olmalı.", true);
    return;
  }

  submit.disabled = true;
  setMessage(message, "");

  try {
    const { error } = await db.from("skill_offers").insert({
      user_id: user.id,
      title,
      category,
      description,
      city: city || null
    });

    if (error) throw error;

    closeModal("offer-modal");
    showToast("Becerin yayınlandı!");
    await loadOffers();
  } catch (error) {
    setMessage(message, error.message || "Beceri yayınlanamadı.", true);
  } finally {
    submit.disabled = false;
  }
});

if (db) {
  db.auth.onAuthStateChange((event, session) => {
    // Bu callback içinde yeni bir Supabase auth isteği başlatma.
    setUserUI(session?.user || null);

    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      loadOffers();
    }
  });
}

(async function init() {
  await refreshUserUI();
  await loadOffers();
})();
