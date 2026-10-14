const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { createServer } = require('../scripts/serve.cjs');
let server, browser, url;
before(async () => {
  server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chromium' });
});
after(async () => { await browser?.close(); await new Promise(resolve => server?.close(resolve)); });
async function pageForTest(t, options = {}, suffix = '') {
  const page = await browser.newPage(options);
  t.after(() => page.close());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, [], 'No uncaught browser exceptions'));
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({
    contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, 'mock-sdk.js'), 'utf8')
  }));
  await page.goto(url + suffix);
  await page.waitForFunction(() => document.querySelector('#resultCount').textContent === '2 ilan');
  return page;
}
async function signIn(page, user = 'owner', event = 'SIGNED_IN') {
  await page.evaluate(({ user, event }) => mock.emit(event, mock[user]), { user, event });
  await page.waitForFunction(() => !document.querySelector('#profileMenu').classList.contains('hidden'));
}
test('Real configuration initializes; discovery, Turkish search and login guard work', async t => {
  const page = await pageForTest(t);
  assert.match(await page.evaluate(() => mock.createArgs.url), /^https:\/\/gjjiomuxwkzgkvjxencd\.supabase\.co$/);
  await page.locator('#searchInput').fill('istanbul');
  // Turkish dotted capital I normalizes to i.
  assert.equal(await page.locator('#skillsGrid .skill-card').count(), 1);
  await page.locator('[data-page=skills]').click();
  assert.equal(await page.locator('#authModal').isVisible(), true);
  assert.equal(await page.locator('#homePage').isVisible(), true);
  await page.keyboard.press('Escape');
  await page.locator('#searchInput').fill('');
  await page.locator('#categoryFilter').selectOption('Dil');
  assert.equal(await page.locator('#skillsGrid .skill-card').count(), 1);
});
test('Incoming requests exclude outgoing requests; accept and cancel persist', async t => {
  const page = await pageForTest(t);
  await signIn(page);
  await page.locator('[data-page=requests]').click();
  await page.waitForFunction(() => document.querySelectorAll('#requestsList .request-card').length === 1);
  assert.match(await page.locator('#requestsList').innerText(), /Web geliştirme/);
  assert.doesNotMatch(await page.locator('#requestsList').innerText(), /İngilizce konuşma/);
  await page.getByRole('button', { name: 'Kabul et', exact: true }).click();
  await page.waitForFunction(() => mock.requests[0].status === 'accepted');
  await page.locator('[data-request-tab=outgoing]').click();
  await page.getByRole('button', { name: 'Talebi iptal et' }).click();
  await page.waitForFunction(() => mock.requests[1].status === 'cancelled');
  assert.match(await page.locator('#requestsList').innerText(), /İptal edildi/);
});
test('Recovery link opens password settings directly and changes password', async t => {
  const page = await pageForTest(t);
  await signIn(page, 'owner', 'PASSWORD_RECOVERY');
  await page.locator('#newPassword').waitFor({ state: 'visible' });
  await page.locator('#newPassword').fill('new-password-123');
  await page.locator('#confirmPassword').fill('new-password-123');
  await page.locator('#passwordForm button').click();
  await page.waitForFunction(() => mock.updatedUser?.password === 'new-password-123');
  assert.equal(await page.locator('#authModal').isVisible(), false);
});
test('Request composer handles duplicate responses; logout retains public discovery', async t => {
  const page = await pageForTest(t);
  await signIn(page, 'learner');
  await page.locator('[data-request-skill=offer-1]').click();
  assert.equal(await page.locator('#requestMessage').getAttribute('maxlength'), '1000');
  await page.locator('#requestForm button[type=submit]').click();
  await page.waitForFunction(() => [...document.querySelectorAll('.toast')].some(n => n.textContent.includes('daha önce')));
  assert.equal(await page.locator('#requestModal').isVisible(), true);
  assert.equal(await page.locator('#requestForm button[type=submit]').isEnabled(), true);
  await page.keyboard.press('Escape');
  await page.locator('#profileMenu').click();
  await page.locator('#logoutBtn').click();
  await page.locator('#loginBtn').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#skillsGrid .skill-card').count(), 2);
  assert.equal(await page.locator('#displayName').inputValue(), '');
});
test('Skill create and edit, profile update and empty results work', async t => {
  const page = await pageForTest(t);
  await signIn(page);
  await page.locator('#addSkillBtn').click();
  await page.locator('#skillTitle').fill('Gitar başlangıç');
  await page.locator('#skillCategory').selectOption('Müzik');
  await page.locator('#skillDescription').fill('Akor çalışalım.');
  await page.locator('#skillForm button').click();
  await page.waitForFunction(() => mock.skills.length === 3);
  await page.locator('#skillsGrid [data-edit-skill=new-2]').click();
  await page.locator('#skillTitle').fill('Gitar akorları');
  await page.locator('#skillForm button').click();
  await page.waitForFunction(() => mock.skills[2].title === 'Gitar akorları');
  await page.locator('#profileMenu').click();
  await page.locator('#displayName').fill('Yeni ad');
  await page.locator('#profileForm button').click();
  await page.waitForFunction(() => document.querySelector('#headerName').textContent === 'Yeni ad');
  await page.locator('.nav-link[data-page=home]').click();
  await page.locator('#searchInput').fill('bulunmayan konu');
  assert.equal(await page.locator('#resultCount').innerText(), '0 ilan');
});
test('Mobile layout fits; modal traps keyboard focus; failed fetch can be retried', async t => {
  const page = await pageForTest(t, { viewport: { width: 390, height: 844 } });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.locator('#signupBtn').click();
  await page.locator('#authSubmit').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-close')), 'authModal');
  await page.keyboard.press('Escape');
  await page.evaluate(() => { mock.failSkills = true; });
  await page.locator('#retrySkillsBtn').click();
  await page.waitForFunction(() => document.querySelector('#resultCount').textContent === 'İlanlar yüklenemedi');
  await page.evaluate(() => { mock.failSkills = false; });
  await page.locator('#retrySkillsBtn').click();
  await page.waitForFunction(() => document.querySelector('#resultCount').textContent === '2 ilan');
});
test('Recovery during initial session setup is handled before discovery loads', async t => {
  const page = await pageForTest(t, {}, '/?recovery');
  await page.locator('#newPassword').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#securitySettings').isVisible(), true);
});
test('Login form, signup confirmation and avatar upload work', async t => {
  const page = await pageForTest(t);
  await page.locator('#signupBtn').click();
  await page.locator('#authName').fill('Yeni kullanıcı');
  await page.locator('#authEmail').fill('new@example.test');
  await page.locator('#authPassword').fill('password-123');
  await page.locator('#authSubmit').click();
  await page.locator('#authModal').waitFor({ state: 'hidden' });
  assert.match(await page.locator('#toastRegion').innerText(), /Kayıt isteğin alındı/);
  await page.locator('#loginBtn').click();
  await page.locator('#authEmail').fill('owner@example.test');
  await page.locator('#authPassword').fill('password-123');
  await page.locator('#authSubmit').click();
  await page.locator('#authModal').waitFor({ state: 'hidden' });
  await page.locator('#profileMenu').click();
  await page.locator('#avatarInput').setInputFiles({
    name: 'avatar.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ0QAAAAASUVORK5CYII=', 'base64')
  });
  await page.waitForFunction(() => document.querySelector('#settingsAvatar').src.includes('/avatars/owner/avatar-'));
  assert.equal(await page.evaluate(() => mock.uploadedAvatar.type), 'image/png');
});
test('A new learning request is submitted and a rejected request is shown', async t => {
  const page = await pageForTest(t);
  await signIn(page, 'learner');
  await page.evaluate(() => mock.requests.splice(0, 1));
  await page.locator('[data-request-skill=offer-1]').click();
  await page.locator('#requestMessage').fill('Merhaba, hafta sonu öğrenebilir miyim?');
  await page.locator('#requestForm button[type=submit]').click();
  await page.locator('#requestModal').waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => mock.requests.at(-1).message), 'Merhaba, hafta sonu öğrenebilir miyim?');
  await page.evaluate(() => mock.emit('SIGNED_OUT', null));
  await signIn(page, 'owner');
  await page.locator('[data-page=requests]').click();
  await page.getByRole('button', { name: 'Reddet', exact: true }).click();
  await page.waitForFunction(() => mock.requests.at(-1).status === 'declined');
});
