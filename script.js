
/* =========================================================
   BİRLİKTEBUL — UYGULAMA KODU
   Supabase Dashboard > Project Settings > API
   URL ve Publishable/anon key değerlerini buraya ekle.
   service_role / secret key'i asla buraya koyma.
========================================================= */

const SUPABASE_URL = "https://gjjiomuxwkzgkvjxencd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqamlvbXV4d2t6Z2t2anhlbmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MjA4ODcsImV4cCI6MjEwNzE5Njg4N30.sgL8ZFeeNk5ggSPAA8n7LKqykbxH8JPq1UxEm4HlvwU";
const AVATAR_BUCKET = "avatars";

const supabaseConfigured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(SUPABASE_URL) &&
  (SUPABASE_KEY.startsWith("sb_publishable_") || SUPABASE_KEY.startsWith("eyJ")) &&
  Boolean(window.supabase?.createClient);

const db = supabaseConfigured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  user: null,
  profile: null,
  skills: [],
  mySkills: [],
  requestTab: "incoming",
  authMode: "login",
  settingsTab: "profile",
  editingSkill: null,
  requests: [],
  requestSkillId: null,
  sessionVersion: 0,
  requestVersion: 0
};

const placeholderAvatar =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#e8f5ed"/><circle cx="60" cy="43" r="23" fill="#9ac7a8"/><path d="M18 113c3-25 20-39 42-39s39 14 42 39" fill="#9ac7a8"/></svg>`);

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function toast(message, type = "success") {
  const node = document.createElement("div");
  node.className = `toast ${type === "error" ? "error" : ""}`;
  node.textContent = message;
  $("#toastRegion").appendChild(node);
  window.setTimeout(() => node.remove(), 4500);
}

function setBusy(button, busy, busyText = "İşleniyor...") {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function handleError(error, fallback = "İşlem tamamlanamadı.") {
  console.error(error);
  const message = error?.message || fallback;
  toast(message, "error");
}

function requireDb() {
  if (!db) {
    toast("Bağlantı başlatılamadı. Sayfayı yenileyip tekrar dene.", "error");
    return false;
  }
  return true;
}

function requireLogin() {
  if (!state.user) {
    openAuth("login");
    toast("Bu işlem için önce giriş yapmalısın.", "error");
    return false;
  }
  return true;
}

const modalFocus = new Map();

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("hidden");
    modalFocus.set(id, document.activeElement);
    document.body.style.overflow = "hidden";
    modal.querySelector("input:not([type=hidden]), textarea, button")?.focus();
  }
}

function closeModal(id) {
  document.getElementById(id)?.classList.add("hidden");
  if (!$(".modal:not(.hidden)")) document.body.style.overflow = "";
  const previous = modalFocus.get(id);
  if (previous?.isConnected) previous.focus();
  modalFocus.delete(id);
}

function openAuth(mode = "login") {
  $$(".modal:not(.hidden)").forEach(modal => closeModal(modal.id));
  setAuthMode(mode);
  openModal("authModal");
}

function setAuthMode(mode) {
  state.authMode = mode;
  const isSignup = mode === "signup";
  $("#authTitle").textContent = isSignup ? "Aramıza katıl" : "Tekrar hoş geldin";
  $("#authDescription").textContent = isSignup
    ? "Ücretsiz hesabını oluştur ve becerilerini paylaş."
    : "Hesabına giriş yap ve öğrenmeye devam et.";
  $("#authSubmit").textContent = isSignup ? "Hesap oluştur" : "Giriş yap";
  $("#authName").closest("label").classList.toggle("hidden", !isSignup);
  $("#authName").required = isSignup;
  $("#authPassword").autocomplete = isSignup ? "new-password" : "current-password";
  $("#forgotPasswordBtn").classList.toggle("hidden", isSignup);
  $$("[data-auth-mode]").forEach(button =>
    button.classList.toggle("active", button.dataset.authMode === mode)
  );
}

function showPage(page) {
  if (page !== "home" && !requireLogin()) return;
  const pageMap = {
    home: "homePage",
    skills: "skillsPage",
    requests: "requestsPage",
    profile: "profilePage"
  };

  $("#heroSection").classList.toggle("hidden", page !== "home");
  Object.entries(pageMap).forEach(([key, id]) => {
    document.getElementById(id).classList.toggle("hidden", key !== page);
  });

  $$(".nav-link").forEach(button =>
    button.classList.toggle("active", button.dataset.page === page)
  );

  if (page === "skills") loadMySkills();
  if (page === "requests") loadRequests();
  if (page === "profile") {
    if (!requireLogin()) return;
    renderProfile();
    loadMySkills();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showSettingsTab(tab) {
  state.settingsTab = tab;

  const panelIds = {
    profile: "profileSettings",
    security: "securitySettings",
    "my-skills": "mySkillsSettings",
    "my-requests": "myRequestsSettings"
  };

  Object.entries(panelIds).forEach(([key, id]) => {
    document.getElementById(id).classList.toggle("hidden", key !== tab);
  });

  $$("[data-settings-tab]").forEach(button =>
    button.classList.toggle("active", button.dataset.settingsTab === tab)
  );

  if (tab === "my-skills") loadMySkills();
}

function avatarUrl(profile) {
  return profile?.avatar_url || placeholderAvatar;
}

function renderProfile() {
  if (!state.user) return;

  const profile = state.profile || {};
  const name = profile.display_name || state.user.email?.split("@")[0] || "Kullanıcı";
  const avatar = avatarUrl(profile);

  $("#headerName").textContent = name;
  $("#headerAvatar").src = avatar;
  $("#sidebarAvatar").src = avatar;
  $("#settingsAvatar").src = avatar;
  $("#sidebarName").textContent = name;
  $("#sidebarEmail").textContent = state.user.email || "";
  $("#currentEmail").value = state.user.email || "";
  $("#displayName").value = profile.display_name || "";
  $("#cityInput").value = profile.city || "";
  $("#bioInput").value = profile.bio || "";
  $("#skillCity").value = profile.city || "";

  $("#profileMenu").classList.remove("hidden");
  $("#loginBtn").classList.add("hidden");
  $("#signupBtn").classList.add("hidden");
}

function renderLoggedOut() {
  state.sessionVersion++;
  state.requestVersion++;
  state.user = null;
  state.profile = null;
  state.mySkills = [];
  state.requests = [];
  state.requestSkillId = null;
  $$(".modal:not(.hidden)").forEach(modal => closeModal(modal.id));
  ["#profileForm", "#emailForm", "#passwordForm", "#skillForm", "#authForm", "#requestForm"].forEach(id => $(id).reset());

  $("#profileMenu").classList.add("hidden");
  $("#loginBtn").classList.remove("hidden");
  $("#signupBtn").classList.remove("hidden");

  if (!$("#profilePage").classList.contains("hidden") ||
      !$("#skillsPage").classList.contains("hidden") ||
      !$("#requestsPage").classList.contains("hidden")) {
    showPage("home");
  }

  renderSkills(state.skills);
  $("#mySkillsGrid").innerHTML =
    '<div class="empty-state">İlanlarını görmek için giriş yap.</div>';
  $("#dashboardSkills").innerHTML =
    '<div class="empty-state">İlanlarını görmek için giriş yap.</div>';
  $("#requestsList").innerHTML =
    '<div class="empty-state">Taleplerini görmek için giriş yap.</div>';
}

async function loadProfile() {
  if (!state.user) return;
  const user = state.user;
  const version = state.sessionVersion;

  const { data, error } = await db
    .from("profiles")
    .select("id, display_name, city, bio, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (version !== state.sessionVersion || state.user?.id !== user.id) return;

  if (data) {
    state.profile = data;
  } else {
    const fallbackName = (user.user_metadata?.display_name ||
      user.email?.split("@")[0] || "Kullanıcı").trim().slice(0, 60) || "Kullanıcı";

    const { data: created, error: createError } = await db
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: fallbackName
      })
      .select()
      .single();

    if (createError) throw createError;
    if (version !== state.sessionVersion || state.user?.id !== user.id) return;
    state.profile = created;
  }

  renderProfile();
}

async function loadSkills() {
  if (!requireDb()) return;

  $("#skillsGrid").innerHTML =
    '<div class="empty-state">Beceriler yükleniyor...</div>';

  const { data, error } = await db
    .from("skill_offers")
    .select(`
      id, user_id, title, description, category, city, created_at,
      profiles!skill_offers_user_id_fkey(id, display_name, city, avatar_url)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    handleError(error, "Beceriler yüklenemedi.");
    $("#resultCount").textContent = "İlanlar yüklenemedi";
    $("#skillsGrid").innerHTML =
      '<div class="empty-state">İlanlar yüklenemedi. Veritabanı kurulumunu kontrol et.</div>';
    return;
  }

  state.skills = data || [];
  renderSkills(state.skills);
}

function renderSkills(skills) {
  const query = ($("#searchInput")?.value || "").trim().toLocaleLowerCase("tr");
  const category = $("#categoryFilter")?.value || "";

  const filtered = skills.filter(skill => {
    const owner = skill.profiles || {};
    const haystack = [
      skill.title, skill.description, skill.category, skill.city,
      owner.display_name, owner.city
    ].filter(Boolean).join(" ").toLocaleLowerCase("tr");

    return (!query || haystack.includes(query)) &&
      (!category || skill.category === category);
  });

  $("#resultCount").textContent = `${filtered.length} ilan`;

  if (!filtered.length) {
    $("#skillsGrid").innerHTML =
      `<div class="empty-state">${query || category ? "Bu aramayla eşleşen ilan bulunamadı. Başka bir kelime deneyebilirsin." : "Henüz bir beceri paylaşılmadı. İlk ilanı sen ekleyebilirsin."}</div>`;
    return;
  }

  $("#skillsGrid").innerHTML = filtered.map(skill => {
    const owner = skill.profiles || {};
    const ownerName = owner.display_name || "BirlikteBul kullanıcısı";
    const city = skill.city || owner.city || "Şehir belirtilmedi";
    const mine = state.user && skill.user_id === state.user.id;

    return `
      <article class="skill-card">
        <div class="skill-card-top">
          <span class="category-tag">${escapeHTML(skill.category)}</span>
          <span class="muted">⌖ ${escapeHTML(city)}</span>
        </div>
        <h3>${escapeHTML(skill.title)}</h3>
        <p class="skill-description">${escapeHTML(skill.description.length > 150
          ? skill.description.slice(0, 150) + "…" : skill.description)}</p>
        <div class="skill-owner">
          <img src="${escapeHTML(owner.avatar_url || placeholderAvatar)}" alt="">
          <div><strong>${escapeHTML(ownerName)}</strong><span>Paylaşmaya hazır</span></div>
        </div>
        <div class="skill-card-footer">
          <button class="btn btn-outline" data-view-skill="${escapeHTML(skill.id)}">Detayları gör</button>
          ${mine
            ? `<button class="btn btn-primary" data-edit-skill="${escapeHTML(skill.id)}">Düzenle</button>`
            : `<button class="btn btn-primary" data-request-skill="${escapeHTML(skill.id)}">Talep gönder</button>`}
        </div>
      </article>`;
  }).join("");
}

async function loadMySkills() {
  if (!state.user || !requireDb()) return;
  const userId = state.user.id;
  const version = state.sessionVersion;

  const { data, error } = await db
    .from("skill_offers")
    .select("id, user_id, title, category, city, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    handleError(error, "İlanların yüklenemedi.");
    return;
  }

  if (version !== state.sessionVersion || state.user?.id !== userId) return;
  state.mySkills = data || [];
  const markup = state.mySkills.length
    ? state.mySkills.map(skill => `
      <div class="compact-item">
        <div>
          <strong>${escapeHTML(skill.title)}</strong>
          <span class="muted">${escapeHTML(skill.category)} · ${escapeHTML(skill.city || "Şehir belirtilmedi")}</span>
        </div>
        <div class="compact-actions">
          <button class="btn btn-outline" data-edit-skill="${escapeHTML(skill.id)}">Düzenle</button>
          <button class="btn btn-outline" data-delete-skill="${escapeHTML(skill.id)}">Sil</button>
        </div>
      </div>`).join("")
    : '<div class="empty-state">Henüz beceri ilanı eklemedin.</div>';

  $("#mySkillsGrid").innerHTML = state.mySkills.length
    ? state.mySkills.map(skill => `
      <article class="skill-card">
        <div class="skill-card-top"><span class="category-tag">${escapeHTML(skill.category)}</span></div>
        <h3>${escapeHTML(skill.title)}</h3>
        <p class="skill-description">${escapeHTML(skill.description)}</p>
        <div class="skill-card-footer">
          <button class="btn btn-outline" data-edit-skill="${escapeHTML(skill.id)}">Düzenle</button>
          <button class="btn btn-outline" data-delete-skill="${escapeHTML(skill.id)}">Sil</button>
        </div>
      </article>`).join("")
    : '<div class="empty-state">Henüz beceri ilanı eklemedin.</div>';

  $("#dashboardSkills").innerHTML = markup;
}

function openSkillEditor(skill = null) {
  if (!requireLogin()) return;

  state.editingSkill = skill;
  $("#editSkillId").value = skill?.id || "";
  $("#skillTitle").value = skill?.title || "";
  $("#skillCategory").value = skill?.category || "";
  $("#skillCity").value = skill?.city || state.profile?.city || "";
  $("#skillDescription").value = skill?.description || "";
  $("#skillModalTitle").textContent = skill ? "İlanı düzenle" : "Yeni beceri ilanı";
  $("#skillForm").querySelector('[type="submit"]').textContent =
    skill ? "Değişiklikleri kaydet" : "İlanı yayınla";

  openModal("skillModal");
}

async function saveSkill(event) {
  event.preventDefault();
  if (!requireLogin() || !requireDb()) return;

  const button = event.submitter || $("#skillForm button[type=submit]");
  setBusy(button, true, "Kaydediliyor...");

  const skillId = $("#editSkillId").value;
  const payload = {
    user_id: state.user.id,
    title: $("#skillTitle").value.trim(),
    category: $("#skillCategory").value,
    city: $("#skillCity").value.trim() || null,
    description: $("#skillDescription").value.trim()
  };

  try {
    if (!payload.title || !payload.description) throw new Error("Başlık ve açıklama boş olamaz.");
    let result;

    if (skillId) {
      result = await db.from("skill_offers")
        .update(payload)
        .eq("id", skillId)
        .eq("user_id", state.user.id).select("id").single();
    } else {
      result = await db.from("skill_offers").insert(payload);
    }

    if (result.error) throw result.error;

    toast(skillId ? "İlan güncellendi." : "Beceri ilanı yayınlandı.");
    closeModal("skillModal");
    $("#skillForm").reset();
    $("#editSkillId").value = "";

    await Promise.all([loadSkills(), loadMySkills()]);
  } catch (error) {
    handleError(error, "İlan kaydedilemedi.");
  } finally {
    setBusy(button, false);
  }
}

async function deleteSkill(id) {
  if (!requireLogin() || !requireDb()) return;
  const skill = state.mySkills.find(item => item.id === id);
  if (!skill) return;

  if (!window.confirm(`"${skill.title}" ilanını silmek istediğine emin misin?`)) return;

  const { error } = await db.from("skill_offers")
    .delete()
    .eq("id", id)
    .eq("user_id", state.user.id);

  if (error) {
    handleError(error, "İlan silinemedi.");
    return;
  }

  toast("İlan silindi.");
  await Promise.all([loadSkills(), loadMySkills()]);
}

function openSkillDetail(id) {
  const skill = state.skills.find(item => item.id === id) ||
    state.mySkills.find(item => item.id === id);

  if (!skill) {
    toast("İlan bulunamadı. Listeyi yenileyip tekrar dene.", "error");
    return;
  }

  const owner = skill.profiles || {};
  const ownerName = owner.display_name || "BirlikteBul kullanıcısı";
  const ownerCity = skill.city || owner.city || "Şehir belirtilmedi";
  const mine = state.user && skill.user_id === state.user.id;

  $("#skillDetail").innerHTML = `
    <span class="category-tag">${escapeHTML(skill.category)}</span>
    <h2 id="detailTitle" style="margin-top:16px">${escapeHTML(skill.title)}</h2>
    <div class="detail-owner">
      <img src="${escapeHTML(owner.avatar_url || placeholderAvatar)}" alt="">
      <div><strong>${escapeHTML(ownerName)}</strong><div class="muted">${escapeHTML(ownerCity)}</div></div>
    </div>
    <p class="detail-description">${escapeHTML(skill.description)}</p>
    <div class="skill-card-footer">
      ${mine
        ? `<button class="btn btn-primary" data-edit-skill="${escapeHTML(skill.id)}">İlanı düzenle</button>`
        : `<button class="btn btn-primary" data-request-skill="${escapeHTML(skill.id)}">Öğrenme talebi gönder</button>`}
    </div>`;

  openModal("detailModal");
}

function requestSkill(id) {
  if (!requireLogin() || !requireDb()) return;

  const skill = state.skills.find(item => item.id === id) ||
    state.mySkills.find(item => item.id === id);

  if (!skill) {
    toast("İlan bulunamadı. Sayfayı yenileyip tekrar dene.", "error");
    return;
  }

  if (skill.user_id === state.user.id) {
    toast("Kendi ilanına öğrenme talebi gönderemezsin.", "error");
    return;
  }

  state.requestSkillId = id;
  $("#requestSkillTitle").textContent = skill.title;
  $("#requestMessage").value = "Merhaba, paylaştığın beceriyi öğrenmek istiyorum.";
  closeModal("detailModal");
  openModal("requestModal");
}

async function submitRequest(event) {
  event.preventDefault();
  if (!requireLogin() || !requireDb() || !state.requestSkillId) return;
  const button = event.submitter || $("#requestForm button[type=submit]");
  const message = $("#requestMessage").value.trim();
  if (message.length > 1000) return toast("Mesaj en fazla 1000 karakter olabilir.", "error");
  setBusy(button, true, "Gönderiliyor...");
  try {
    const { error } = await db.from("skill_requests").insert({
      offer_id: state.requestSkillId,
      requester_id: state.user.id,
      message: message || null,
      status: "pending"
    });
    if (error) {
      if (error.code === "23505") {
        toast("Bu ilan için daha önce talep göndermişsin.", "error");
      } else {
        handleError(error, "Talep gönderilemedi.");
      }
      return;
    }
    closeModal("requestModal");
    state.requestSkillId = null;
    toast("Öğrenme talebin gönderildi.");
    if (!$("#requestsPage").classList.contains("hidden")) await loadRequests();
  } catch (error) {
    handleError(error, "Talep gönderilemedi.");
  } finally {
    setBusy(button, false);
  }
}

function statusLabel(status) {
  const labels = {
    pending: "Bekliyor",
    accepted: "Kabul edildi",
    declined: "Reddedildi",
    cancelled: "İptal edildi"
  };
  return labels[status] || status;
}

async function loadRequests() {
  if (!requireLogin() || !requireDb()) return;
  const userId = state.user.id;
  const version = ++state.requestVersion;

  $("#requestsList").innerHTML =
    '<div class="empty-state">Talepler yükleniyor...</div>';

  const incoming = state.requestTab === "incoming";
  let query = db.from("skill_requests").select(`
    id, offer_id, requester_id, message, status, created_at,
    skill_offers!skill_requests_offer_id_fkey!inner(id, title, user_id),
    requester:profiles!skill_requests_requester_id_fkey(id, display_name, city, avatar_url)
  `);

  if (incoming) {
    query = query.eq("skill_offers.user_id", userId);
  } else {
    query = query.eq("requester_id", userId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (version !== state.requestVersion || state.user?.id !== userId) return;

  if (error) {
    handleError(error, "Talepler yüklenemedi.");
    $("#requestsList").innerHTML =
      '<div class="empty-state">Talepler yüklenemedi. Veritabanı politikalarını kontrol et.</div>';
    return;
  }

  const requests = data || [];
  state.requests = requests;
  if (!requests.length) {
    $("#requestsList").innerHTML =
      `<div class="empty-state">${incoming ? "Henüz gelen talebin yok." : "Henüz bir öğrenme talebi göndermedin."}</div>`;
    return;
  }

  $("#requestsList").innerHTML = requests.map(request => {
    const skillTitle = request.skill_offers?.title || "Silinmiş veya erişilemeyen ilan";
    const requester = request.requester || {};
    const canManage = incoming && request.status === "pending";

    return `
      <article class="request-card">
        <div>
          <span class="category-tag">${incoming ? "Gelen talep" : "Gönderdiğin talep"}</span>
          <h3>${escapeHTML(skillTitle)}</h3>
          <p>${incoming
            ? `<strong>${escapeHTML(requester.display_name || "Kullanıcı")}</strong> bu beceriyi öğrenmek istiyor.`
            : "Öğrenme talebin."}</p>
          ${request.message ? `<p>“${escapeHTML(request.message)}”</p>` : ""}
          <span class="status ${escapeHTML(request.status)}">${escapeHTML(statusLabel(request.status))}</span>
        </div>
        ${canManage ? `
          <div class="request-actions">
            <button class="btn btn-primary" data-request-status="${escapeHTML(request.id)}" data-status="accepted">Kabul et</button>
            <button class="btn btn-outline" data-request-status="${escapeHTML(request.id)}" data-status="declined">Reddet</button>
          </div>` : (!incoming && request.status === "pending" ? `
          <div class="request-actions"><button class="btn btn-outline" data-request-status="${escapeHTML(request.id)}" data-status="cancelled">Talebi iptal et</button></div>` : "")}
      </article>`;
  }).join("");
}

async function updateRequestStatus(id, status) {
  if (!requireLogin() || !requireDb()) return;
  if (!["accepted", "declined", "cancelled"].includes(status)) return;
  const request = state.requests.find(item => item.id === id);
  if (!request || request.status !== "pending") return;
  if (status === "cancelled" ? request.requester_id !== state.user.id : request.skill_offers?.user_id !== state.user.id) return;

  const buttons = $$(`[data-request-status="${id}"]`);
  if (buttons.some(button => button.disabled)) return;
  buttons.forEach(button => setBusy(button, true));
  try {
    const { error } = await db.from("skill_requests")
      .update({ status })
      .eq("id", id).eq("status", "pending").select("id").single();
    if (error) throw error;
    toast(status === "accepted" ? "Talep kabul edildi." : status === "cancelled" ? "Talep iptal edildi." : "Talep reddedildi.");
    await loadRequests();
  } catch (error) {
    handleError(error, "Talep durumu güncellenemedi.");
  } finally {
    buttons.forEach(button => setBusy(button, false));
  }
}

async function saveProfile(event) {
  event.preventDefault();
  if (!requireLogin() || !requireDb()) return;

  const button = event.submitter || $("#profileForm button[type=submit]");
  setBusy(button, true, "Kaydediliyor...");

  const payload = {
    id: state.user.id,
    display_name: $("#displayName").value.trim(),
    city: $("#cityInput").value.trim() || null,
    bio: $("#bioInput").value.trim() || null
  };

  try {
    if (!payload.display_name) throw new Error("Görünen ad boş olamaz.");
    const { data, error } = await db.from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;
    state.profile = { ...state.profile, ...data };
    renderProfile();
    toast("Profil bilgilerin güncellendi.");
    await loadSkills();
  } catch (error) {
    handleError(error, "Profil güncellenemedi.");
  } finally {
    setBusy(button, false);
  }
}

async function uploadAvatar(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file || !requireLogin() || !requireDb()) return;

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    toast("Yalnızca JPG, PNG veya WebP fotoğraf yükleyebilirsin.", "error");
    return;
  }
  if (file.size > 3 * 1024 * 1024) {
    toast("Fotoğraf en fazla 3 MB olabilir.", "error");
    return;
  }

  const extension = file.type === "image/png" ? "png" :
    file.type === "image/webp" ? "webp" : "jpg";
  const path = `${state.user.id}/avatar-${Date.now()}.${extension}`;

  try {
    const { error: uploadError } = await db.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: publicData } = db.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(path);

    const avatar_url = publicData.publicUrl;

    const { data, error } = await db.from("profiles")
      .upsert({ id: state.user.id, avatar_url }, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      await db.storage.from(AVATAR_BUCKET).remove([path]);
      throw error;
    }

    const oldUrl = state.profile?.avatar_url;
    state.profile = { ...state.profile, ...data };
    renderProfile();
    await loadSkills();

    // Eski fotoğraf bu kullanıcının avatars klasöründeyse temizle.
    if (oldUrl && oldUrl.includes(`/storage/v1/object/public/${AVATAR_BUCKET}/${state.user.id}/`)) {
      const oldPath = oldUrl.split(`/storage/v1/object/public/${AVATAR_BUCKET}/`)[1];
      if (oldPath && oldPath !== path) {
        await db.storage.from(AVATAR_BUCKET).remove([oldPath]);
      }
    }

    toast("Profil fotoğrafın güncellendi.");
  } catch (error) {
    handleError(error, "Fotoğraf yüklenemedi. Storage ayarlarını kontrol et.");
  }
}

async function changeEmail(event) {
  event.preventDefault();
  if (!requireLogin() || !requireDb()) return;

  const newEmail = $("#newEmail").value.trim();
  if (!newEmail || newEmail.toLowerCase() === state.user.email?.toLowerCase()) {
    toast("Mevcut e-postandan farklı bir adres yaz.", "error");
    return;
  }

  const button = event.submitter;
  setBusy(button, true, "Gönderiliyor...");

  try {
    const { error } = await db.auth.updateUser({ email: newEmail });
    if (error) throw error;
    $("#newEmail").value = "";
    toast("E-posta değişikliği başlatıldı. İstenirse yeni adresini e-postandaki bağlantıyla onayla.");
  } catch (error) {
    handleError(error, "E-posta güncellenemedi.");
  } finally {
    setBusy(button, false);
  }
}

async function changePassword(event) {
  event.preventDefault();
  if (!requireLogin() || !requireDb()) return;

  const password = $("#newPassword").value;
  const confirm = $("#confirmPassword").value;

  if (password.length < 8) {
    toast("Şifre en az 8 karakter olmalı.", "error");
    return;
  }
  if (password !== confirm) {
    toast("Şifreler birbiriyle eşleşmiyor.", "error");
    return;
  }

  const button = event.submitter;
  setBusy(button, true, "Güncelleniyor...");

  try {
    const { error } = await db.auth.updateUser({ password });
    if (error) throw error;
    $("#passwordForm").reset();
    toast("Şifren başarıyla değiştirildi.");
  } catch (error) {
    handleError(error, "Şifre değiştirilemedi.");
  } finally {
    setBusy(button, false);
  }
}

async function forgotPassword() {
  if (!requireDb()) return;
  const email = $("#authEmail").value.trim();

  if (!email) {
    toast("Önce e-posta adresini yaz.", "error");
    $("#authEmail").focus();
    return;
  }

  try {
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    toast("Şifre sıfırlama bağlantısı e-posta adresine gönderildiyse gelen kutunu kontrol et.");
  } catch (error) {
    handleError(error, "Şifre sıfırlama isteği gönderilemedi.");
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!requireDb()) return;

  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  const button = $("#authSubmit");
  setBusy(button, true, "Lütfen bekle...");

  try {
    if (state.authMode === "signup") {
      const display_name = $("#authName").value.trim();
      if (!display_name) throw new Error("Görünen ad boş olamaz.");
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: { display_name },
          emailRedirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) throw error;

      if (data.session) {
        state.user = data.user;
        await loadProfile();
        closeModal("authModal");
        toast("Hesabın oluşturuldu. Hoş geldin!");
      } else {
        closeModal("authModal");
        toast("Kayıt isteğin alındı. E-posta doğrulaması gerekiyorsa gelen kutunu kontrol et.");
      }
    } else {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      state.user = data.user;
      await loadProfile();
      closeModal("authModal");
      toast("Başarıyla giriş yaptın.");
      await Promise.all([loadSkills(), loadMySkills()]);
    }
    $("#authForm").reset();
  } catch (error) {
    handleError(error, "Giriş veya kayıt işlemi başarısız.");
  } finally {
    setBusy(button, false);
  }
}

async function logout() {
  if (!db) return;
  const { error } = await db.auth.signOut();
  if (error) {
    handleError(error, "Çıkış yapılamadı.");
    return;
  }
  renderLoggedOut();
  toast("Hesabından çıkış yaptın.");
}

function bindEvents() {
  $("#year").textContent = new Date().getFullYear();

  $("#loginBtn").addEventListener("click", () => openAuth("login"));
  $("#signupBtn").addEventListener("click", () => openAuth("signup"));
  $("#profileMenu").addEventListener("click", () => showPage("profile"));
  $("#logoutBtn").addEventListener("click", logout);

  $("#heroExplore").addEventListener("click", () => {
    $("#homePage").scrollIntoView({ behavior: "smooth" });
  });
  $("#heroAddSkill").addEventListener("click", () => {
    if (requireLogin()) openSkillEditor();
  });
  $("#addSkillBtn").addEventListener("click", () => openSkillEditor());
  $("#myAddSkillBtn").addEventListener("click", () => openSkillEditor());
  $("#dashboardAddSkill").addEventListener("click", () => openSkillEditor());
  $("#openAllRequests").addEventListener("click", () => showPage("requests"));

  $$("[data-page]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      const page = button.dataset.page;
      if (page === "profile" && !requireLogin()) return;
      showPage(page);
    });
  });

  $$("[data-close]").forEach(button => {
    button.addEventListener("click", () => closeModal(button.dataset.close));
  });

  $$(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeModal(modal.id);
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      $$(".modal:not(.hidden)").forEach(modal => closeModal(modal.id));
    }
    if (event.key === "Tab") {
      const modal = $(".modal:not(.hidden)");
      if (!modal) return;
      const nodes = [...modal.querySelectorAll('button, input:not([type=hidden]), textarea, select, [tabindex="0"]')]
        .filter(node => !node.disabled && node.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });

  $$("[data-auth-mode]").forEach(button => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
  });

  $$("[data-settings-tab]").forEach(button => {
    button.addEventListener("click", () => showSettingsTab(button.dataset.settingsTab));
  });

  $$("[data-request-tab]").forEach(button => {
    button.addEventListener("click", () => {
      state.requestTab = button.dataset.requestTab;
      $$("[data-request-tab]").forEach(tab =>
        tab.classList.toggle("active", tab === button)
      );
      loadRequests();
    });
  });

  $("#authForm").addEventListener("submit", handleAuthSubmit);
  $("#forgotPasswordBtn").addEventListener("click", forgotPassword);
  $("#profileForm").addEventListener("submit", saveProfile);
  $("#emailForm").addEventListener("submit", changeEmail);
  $("#passwordForm").addEventListener("submit", changePassword);
  $("#avatarInput").addEventListener("change", uploadAvatar);
  $("#skillForm").addEventListener("submit", saveSkill);
  $("#requestForm").addEventListener("submit", submitRequest);
  $("#retrySkillsBtn").addEventListener("click", loadSkills);

  $("#searchInput").addEventListener("input", () => renderSkills(state.skills));
  $("#categoryFilter").addEventListener("change", () => renderSkills(state.skills));

  // Dinamik olarak oluşturulan ilan ve talep butonları.
  document.addEventListener("click", event => {
    const view = event.target.closest("[data-view-skill]");
    const edit = event.target.closest("[data-edit-skill]");
    const request = event.target.closest("[data-request-skill]");
    const remove = event.target.closest("[data-delete-skill]");
    const status = event.target.closest("[data-request-status]");

    if (view) openSkillDetail(view.dataset.viewSkill);

    if (edit) {
      const id = edit.dataset.editSkill;
      const skill = state.skills.find(item => item.id === id) ||
        state.mySkills.find(item => item.id === id);
      if (skill) {
        closeModal("detailModal");
        openSkillEditor(skill);
      }
    }

    if (request) requestSkill(request.dataset.requestSkill);
    if (remove) deleteSkill(remove.dataset.deleteSkill);
    if (status) updateRequestStatus(status.dataset.requestStatus, status.dataset.status);
  });
}

async function initialize() {
  bindEvents();

  if (!requireDb()) {
    $("#skillsGrid").innerHTML =
      '<div class="empty-state">Kurulum tamamlanmadı. script.js içine Supabase URL ve anahtarını ekle.</div>';
    return;
  }

  // Register before getSession so recovery events from email links are not missed.
  db.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;
    if (event === "TOKEN_REFRESHED" && session?.user.id === state.user?.id) {
      state.user = session.user;
      return;
    }
    const version = ++state.sessionVersion;
    window.setTimeout(async () => {
      if (version !== state.sessionVersion) return;
      if (event === "SIGNED_OUT") { renderLoggedOut(); return; }
      if (!session?.user) return;
      state.user = session.user;
      try {
        await loadProfile();
        if (version !== state.sessionVersion) return;
        if (event === "PASSWORD_RECOVERY") {
          closeModal("authModal");
          showPage("profile");
          showSettingsTab("security");
          $("#newPassword").focus();
          toast("Yeni şifreni belirleyip kaydet.");
        }
        renderSkills(state.skills);
      } catch (error) { handleError(error, "Oturum bilgileri güncellenemedi."); }
    }, 0);
  });

  const initialVersion = state.sessionVersion;
  const { data: { session }, error } = await db.auth.getSession();
  if (error) handleError(error, "Oturum alınamadı.");
  if (session?.user && initialVersion === state.sessionVersion) {
    state.user = session.user;
    try {
      await loadProfile();
    } catch (error) {
      handleError(error, "Profil bilgileri alınamadı.");
    }
  }

  await loadSkills();

}

document.addEventListener("DOMContentLoaded", () => initialize().catch(error => {
  handleError(error, "Uygulama başlatılamadı. Tekrar dene.");
  $("#resultCount").textContent = "Bağlantı kurulamadı";
  $("#skillsGrid").innerHTML = '<div class="empty-state">Bağlantı kurulamadı. İlanları yenilemeyi deneyebilirsin.</div>';
}));
