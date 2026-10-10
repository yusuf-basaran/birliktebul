
:root {
  --ink: #192e28;
  --muted: #78867e;
  --line: #e7ece7;
  --green: #284b3c;
  --mint: #d8f49c;
  --bg: #f7f9f5;
  --white: #fff;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 90px; }
body { margin: 0; color: var(--ink); font-family: "DM Sans", sans-serif; }
button, input, select, textarea { font: inherit; }
button, a { cursor: pointer; }
a { color: inherit; text-decoration: none; }
.hidden { display: none !important; }
button:focus-visible, a:focus-visible, input:focus-visible,
select:focus-visible, textarea:focus-visible {
  outline: 3px solid #9fc86b; outline-offset: 3px;
}
.topbar {
  height: 76px; padding: 0 6vw; display: flex; align-items: center;
  justify-content: space-between; gap: 20px; border-bottom: 1px solid #edf0ec;
  position: sticky; top: 0; z-index: 10; background: #ffffffed;
  backdrop-filter: blur(12px);
}
.brand {
  display: inline-flex; align-items: center; gap: 7px;
  font: 800 20px Manrope, sans-serif; letter-spacing: -.8px; white-space: nowrap;
}
.brand-icon {
  width: 34px; height: 34px; display: inline-grid; place-items: center;
  background: var(--mint); border-radius: 11px; color: var(--green); font-size: 21px;
}
.brand-muted { color: #839188; margin-left: -7px; }
.topbar nav { display: flex; gap: 28px; margin-right: auto; margin-left: 7%; }
.topbar nav a { font-size: 13px; color: #6f7c74; }
.topbar nav a:hover { color: var(--green); }
.header-actions { display: flex; align-items: center; gap: 7px; }
.user-label {
  max-width: 135px; overflow: hidden; text-overflow: ellipsis;
  font-size: 12px; font-weight: 700; white-space: nowrap;
}
.btn {
  border: 0; border-radius: 11px; padding: 12px 16px; font-size: 12px;
  font-weight: 700; display: inline-flex; align-items: center;
  justify-content: center; gap: 8px; transition: transform .18s, background .18s;
}
.btn:hover { transform: translateY(-1px); }
.btn:disabled { opacity: .6; cursor: wait; transform: none; }
.btn-primary { background: var(--green); color: white; }
.btn-primary:hover { background: #1d3b2e; }
.btn-light { background: transparent; color: var(--ink); }
.btn-outline { background: white; border: 1px solid #dce4dc; color: var(--ink); }
.btn-large { padding: 15px 20px; font-size: 13px; }
.btn-full { width: 100%; margin-top: 7px; }

.hero {
  min-height: 530px; padding: 70px 9vw 58px; display: grid;
  grid-template-columns: 1fr 1fr; align-items: center; gap: 35px;
  background: radial-gradient(ellipse at 80% 40%, #f0f7e6, transparent 60%), #fcfdfb;
}
.eyebrow { color: #748279; font-size: 10px; font-weight: 800; letter-spacing: 1.6px; }
.hero h1 {
  margin: 22px 0; font: 800 clamp(42px, 5vw, 64px)/1.08 Manrope, sans-serif;
  letter-spacing: -2.7px;
}
.hero h1 em { color: #779c3b; font-style: normal; }
.lead { max-width: 420px; color: var(--muted); font-size: 14px; line-height: 1.9; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 27px; }
.subtle { margin-top: 30px; color: #87938b; font-size: 11px; }
.hero-art { height: 360px; position: relative; display: grid; place-items: center; }
.orbit {
  position: absolute; width: 340px; height: 270px; border: 1px solid #dfe8d8;
  border-radius: 50%; transform: rotate(-25deg);
}
.hero-orb {
  z-index: 1; width: 210px; height: 210px; border-radius: 50%;
  background: linear-gradient(145deg, #e9f6d3, #c7eb85);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 20px 55px #83ad4b24; transform: rotate(-5deg);
}
.hero-orb span { font-size: 38px; color: #4c6d34; }
.hero-orb small { margin-top: 7px; color: #59733e; }
.hero-orb b { font: 800 22px Manrope, sans-serif; }
.float-card {
  position: absolute; z-index: 2; display: flex; align-items: center; gap: 10px;
  background: white; padding: 13px 15px; border: 1px solid #edf1e9;
  border-radius: 13px; box-shadow: 0 14px 45px #18362912;
  font-size: 20px; color: #779b40;
}
.float-card span { display: flex; flex-direction: column; gap: 4px; }
.float-card b { font-size: 11px; color: var(--ink); }
.float-card small { font-size: 10px; color: #87938b; }
.float-one { top: 25px; right: 0; transform: rotate(3deg); }
.float-two { bottom: 25px; left: 0; transform: rotate(-3deg); color: #bd7952; }

.section { max-width: 1180px; margin: auto; padding: 78px 28px 88px; }
.section-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; }
.section h2, .how-section h2 {
  margin: 12px 0 0; font: 800 clamp(29px, 3vw, 39px)/1.2 Manrope, sans-serif;
  letter-spacing: -1.8px;
}
.search-row { display: flex; gap: 12px; margin-top: 30px; }
.search-row input, .search-row select {
  height: 50px; padding: 0 15px; border: 1px solid var(--line);
  border-radius: 12px; outline: none; background: white; color: var(--ink); font-size: 12px;
}
.search-row input { flex: 1; min-width: 0; }
.search-row select { min-width: 130px; }
.search-row input:focus { border-color: #9db6a1; }
.categories { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.chip {
  border: 1px solid #e7ece7; border-radius: 30px; background: white;
  color: #6e7c73; padding: 10px 14px; font-size: 11px;
}
.chip.active { background: var(--green); border-color: var(--green); color: white; }
.results-meta {
  display: flex; justify-content: space-between; gap: 10px;
  margin: 28px 0 14px; color: #89958e; font-size: 11px;
}
.cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px; }
.card {
  display: flex; flex-direction: column; min-height: 245px; padding: 20px;
  border: 1px solid #e8eee8; border-radius: 16px; background: white;
  transition: transform .2s, box-shadow .2s;
}
.card:hover { transform: translateY(-3px); box-shadow: 0 12px 35px #1c362c0d; }
.person { display: flex; align-items: center; gap: 11px; min-width: 0; }
.avatar {
  width: 45px; height: 45px; flex-shrink: 0; border-radius: 14px;
  background: #e6f1dc; display: grid; place-items: center;
  color: #46673d; font: 800 15px Manrope, sans-serif;
}
.person-info { min-width: 0; }
.person-info b { display: block; font-size: 12px; overflow-wrap: anywhere; }
.person-info small { display: block; margin-top: 5px; color: #919c95; font-size: 10px; }
.tag {
  margin-left: auto; align-self: flex-start; background: #f0f7e7;
  border-radius: 7px; padding: 7px; color: #64833d; font-size: 9px;
}
.card h3 { margin: 20px 0 8px; font: 800 16px Manrope, sans-serif; overflow-wrap: anywhere; }
.card p {
  margin: 0 0 15px; color: #77847c; font-size: 11px; line-height: 1.75;
  white-space: pre-wrap; overflow-wrap: anywhere;
}
.card-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin-top: auto; padding-top: 12px; border-top: 1px solid #f0f2ef;
  color: #87938b; font-size: 10px;
}
.card-foot button { border: 0; background: transparent; color: #557744; font-size: 11px; font-weight: 800; }
.empty { text-align: center; padding: 45px 15px; border: 1px dashed #dce5dc; border-radius: 16px; }
.empty-icon { color: #779b40; font-size: 32px; }
.empty h3 { font: 800 20px Manrope, sans-serif; }
.empty p, .notice { color: #87938b; font-size: 11px; line-height: 1.7; }
.notice { margin: 24px auto 0; text-align: center; }

.how-section { padding: 75px 6vw 80px; background: var(--bg); text-align: center; }
.steps {
  max-width: 1100px; margin: 38px auto 0; display: grid;
  grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: left;
}
.step { padding: 23px; background: white; border: 1px solid #e8eee8; border-radius: 16px; }
.step-number { color: #98a49b; font-size: 10px; }
.step-icon {
  display: grid; place-items: center; width: 42px; height: 42px; margin-top: 18px;
  background: #edf8dc; border-radius: 13px; color: #63813e; font-size: 21px;
}
.step h3 { margin: 15px 0 8px; font: 800 15px Manrope, sans-serif; }
.step p { margin: 0; color: #7b8880; font-size: 11px; line-height: 1.8; }
footer {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 20px 6vw; border-top: 1px solid #edf0ec;
}
footer .brand { font-size: 17px; }
footer .brand-icon { width: 29px; height: 29px; font-size: 18px; }
footer > span { color: #89958e; font-size: 10px; }

.modal { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; padding: 18px; }
.backdrop { position: absolute; inset: 0; background: #11251ed9; backdrop-filter: blur(4px); }
.modal-panel {
  position: relative; width: min(100%, 440px); max-height: calc(100vh - 36px);
  overflow: auto; padding: 31px; border-radius: 20px; background: white;
  box-shadow: 0 25px 80px #0002;
}
.close-btn {
  position: absolute; top: 13px; right: 14px; width: 31px; height: 31px;
  border: 0; border-radius: 50%; background: #f1f5f0; color: #5b6d60; font-size: 22px;
}
.modal-logo { margin-bottom: 20px; }
.modal-panel h2 { margin: 15px 0 20px; font: 800 27px/1.2 Manrope, sans-serif; letter-spacing: -1px; }
.tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; margin-bottom: 18px; border-radius: 10px; background: #f3f6f2; }
.tabs button { padding: 10px; border: 0; border-radius: 7px; background: transparent; color: #7b887f; font-size: 12px; font-weight: 700; }
.tabs button.selected { background: white; color: var(--green); }
form label { display: block; margin: 13px 0; color: #45574d; font-size: 11px; font-weight: 700; }
form input, form select, form textarea {
  display: block; width: 100%; margin-top: 7px; padding: 12px;
  border: 1px solid #e2e9e2; border-radius: 10px; outline: none;
  background: white; color: var(--ink); font-size: 12px;
}
form input:focus, form select:focus, form textarea:focus { border-color: #9bb89f; }
form textarea { resize: vertical; }
.form-message { color: #557744; font-size: 11px; line-height: 1.6; overflow-wrap: anywhere; }
.form-message.error { color: #b14c42; }
.profile-avatar {
  width: 60px; height: 60px; margin-bottom: 18px; border-radius: 18px;
  display: grid; place-items: center; background: #e6f1dc; color: #46673d;
  font: 800 21px Manrope, sans-serif;
}
.profile-title { margin: 15px 0 8px; font: 800 24px Manrope, sans-serif; overflow-wrap: anywhere; }
.profile-desc { color: #718078; font-size: 13px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
.profile-meta { display: inline-block; margin: 10px 0 15px; padding: 8px; border-radius: 8px; background: #f0f7e7; color: #64833d; font-size: 10px; }
#toast {
  position: fixed; bottom: 22px; left: 50%; z-index: 50; max-width: calc(100vw - 30px);
  padding: 13px 18px; border-radius: 11px; background: #1f4034; color: white;
  font-size: 12px; text-align: center; opacity: 0; pointer-events: none;
  transform: translate(-50%, 20px); transition: opacity .2s, transform .2s;
}
#toast.show { opacity: 1; transform: translate(-50%, 0); }

@media (max-width: 850px) {
  .hero { padding-left: 6vw; padding-right: 6vw; }
  .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .topbar nav { margin-left: 2%; gap: 16px; }
}
@media (max-width: 620px) {
  .topbar { height: 66px; padding: 0 15px; gap: 8px; }
  .brand { font-size: 17px; }
  .topbar nav { display: none; }
  .header-actions { gap: 3px; }
  .header-actions .btn { padding: 10px; font-size: 10px; }
  .user-label { max-width: 85px; font-size: 10px; }
  .hero { grid-template-columns: 1fr; padding: 48px 23px 25px; gap: 0; }
  .hero h1 { font-size: 46px; }
  .lead { font-size: 13px; }
  .hero-art { height: 300px; margin: 0 -20px; transform: scale(.88); }
  .section { padding: 55px 19px 60px; }
  .section-heading { align-items: flex-start; flex-direction: column; }
  .section h2, .how-section h2 { font-size: 30px; }
  .search-row { margin-top: 23px; }
  .search-row input, .search-row select { height: 46px; }
  .search-row select { min-width: 95px; padding: 0 7px; }
  .categories { gap: 7px; }
  .chip { padding: 9px 11px; font-size: 10px; }
  .cards { grid-template-columns: 1fr; }
  .card { min-height: 220px; padding: 17px; }
  .steps { grid-template-columns: 1fr; }
  .how-section { padding: 55px 20px; }
  .step { padding: 20px; }
  footer { padding: 20px; flex-wrap: wrap; }
  footer > span:nth-child(2) { display: none; }
  .modal-panel { padding: 27px 22px; }
  .modal-panel h2 { font-size: 25px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
}
