const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const owner = '00000000-0000-4000-8000-000000000001';
const learner = '00000000-0000-4000-8000-000000000002';
const stranger = '00000000-0000-4000-8000-000000000003';
test('Postgres schema is idempotent; RLS and column permissions enforce request ownership', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  // Minimal Supabase-owned schemas for exercising the actual project SQL in Postgres.
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key, bucket_id text, name text);
    create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1, '/') $$;
  `);
  const schema = fs.readFileSync(path.join(__dirname, '../supabase.sql'), 'utf8')
    .replace('create extension if not exists pgcrypto;', ''); // UUID generation is built into Postgres.
  await db.exec(schema);
  await db.exec(schema);
  await db.exec(`insert into auth.users values
    ('${owner}', 'owner@example.test', '{"display_name":"Paylaşan"}'),
    ('${learner}', 'learner@example.test', '{"display_name":"Öğrenen"}'),
    ('${stranger}', 'stranger@example.test', '{}');`);
  assert.equal((await db.query('select count(*)::int as count from public.profiles')).rows[0].count, 3);
  async function asUser(id) {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    await db.exec('set role authenticated');
  }
  await asUser(owner);
  const offer = (await db.query(`insert into public.skill_offers (user_id, title, description, category)
    values ($1, 'Web geliştirme', 'HTML ve CSS', 'Yazılım') returning id`, [owner])).rows[0].id;
  await assert.rejects(db.query(`insert into public.skill_requests (offer_id, requester_id) values ($1, $2)`, [offer, owner]), /row-level security/);
  await asUser(learner);
  const request = (await db.query(`insert into public.skill_requests (offer_id, requester_id, message)
    values ($1, $2, 'Merhaba') returning id`, [offer, learner])).rows[0].id;
  await assert.rejects(db.query(`insert into public.skill_requests (offer_id, requester_id) values ($1, $2)`, [offer, learner]), /unique/);
  await assert.rejects(db.query(`update public.skill_requests set message = 'Başka mesaj' where id = $1`, [request]), /permission denied/);
  await assert.rejects(db.query(`update public.skill_requests set requester_id = $1 where id = $2`, [stranger, request]), /permission denied/);
  await assert.rejects(db.query(`update public.skill_requests set status = 'accepted' where id = $1`, [request]), /row-level security/);
  await asUser(stranger);
  assert.equal((await db.query('select * from public.skill_requests')).rows.length, 0);
  assert.equal((await db.query(`update public.skill_requests set status = 'declined' where id = $1 returning id`, [request])).rows.length, 0);
  await asUser(owner);
  assert.equal((await db.query('select * from public.skill_requests')).rows.length, 1);
  await assert.rejects(db.query(`update public.skill_requests set status = 'cancelled' where id = $1`, [request]), /row-level security/);
  assert.equal((await db.query(`update public.skill_requests set status = 'accepted' where id = $1 returning status`, [request])).rows[0].status, 'accepted');
  assert.equal((await db.query(`update public.skill_requests set status = 'declined' where id = $1 returning id`, [request])).rows.length, 0);
  await asUser(learner);
  assert.equal((await db.query(`update public.skill_requests set status = 'cancelled' where id = $1 returning id`, [request])).rows.length, 0);
  await asUser(owner);
  const secondOffer = (await db.query(`insert into public.skill_offers (user_id, title, description, category)
    values ($1, 'Tasarım', 'Çizim', 'Tasarım') returning id`, [owner])).rows[0].id;
  await asUser(learner);
  const secondRequest = (await db.query(`insert into public.skill_requests (offer_id, requester_id)
    values ($1, $2) returning id`, [secondOffer, learner])).rows[0].id;
  assert.equal((await db.query(`update public.skill_requests set status = 'cancelled' where id = $1 returning status`, [secondRequest])).rows[0].status, 'cancelled');
  await db.exec('reset role; set role anon');
  assert.equal((await db.query('select * from public.skill_offers')).rows.length, 2);
  await assert.rejects(db.query('select * from public.skill_requests'), /permission denied/);
  await assert.rejects(db.query('select public.handle_new_user()'), /permission denied/);
});
