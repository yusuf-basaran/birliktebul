// Browser integration fixture: implements the Supabase calls used by the app.
(() => {
  const owner = { id: 'owner', email: 'owner@example.test' };
  const learner = { id: 'learner', email: 'learner@example.test' };
  const profiles = [
    { id: owner.id, display_name: 'Paylaşan', city: 'İstanbul', bio: '' },
    { id: learner.id, display_name: 'Öğrenen', city: 'Ankara', bio: '' }
  ];
  const skills = [
    { id: 'offer-1', user_id: owner.id, title: 'Web geliştirme', description: 'HTML ve CSS öğrenelim.', category: 'Yazılım', city: 'İstanbul', created_at: '2026-10-01' },
    { id: 'offer-2', user_id: learner.id, title: 'İngilizce konuşma', description: 'Konuşma pratiği.', category: 'Dil', city: 'Ankara', created_at: '2026-10-02' }
  ];
  const requests = [
    { id: 'request-in', offer_id: 'offer-1', requester_id: learner.id, status: 'pending', message: 'Birlikte öğrenelim.' },
    { id: 'request-out', offer_id: 'offer-2', requester_id: owner.id, status: 'pending', message: 'Pratik yapalım.' }
  ];
  let callback;
  window.mock = {
    user: null, queries: [], skills, requests, profiles, owner, learner,
    emit(event, user) { this.user = user; callback?.(event, user ? { user } : null); },
    failSkills: false, createArgs: null
  };
  class Query {
    constructor(table) { this.table = table; this.filters = []; this.operation = 'select'; }
    select(columns) { this.columns = columns; return this; }
    eq(key, value) { this.filters.push([key, value]); return this; }
    order() { return this; }
    insert(payload) { this.operation = 'insert'; this.payload = payload; return this; }
    update(payload) { this.operation = 'update'; this.payload = payload; return this; }
    upsert(payload) { this.operation = 'upsert'; this.payload = payload; return this; }
    delete() { this.operation = 'delete'; return this; }
    single() { this.one = true; return this; }
    maybeSingle() { this.one = true; return this; }
    then(resolve, reject) { return Promise.resolve().then(() => this.run()).then(resolve, reject); }
    run() {
      mock.queries.push({ table: this.table, columns: this.columns, filters: this.filters, operation: this.operation });
      if (this.table === 'skill_offers' && mock.failSkills) return { data: null, error: { message: 'Bağlantı hatası' } };
      const table = this.table === 'profiles' ? profiles : this.table === 'skill_offers' ? skills : requests;
      const matches = row => this.filters.every(([key, value]) => key === 'skill_offers.user_id'
        ? (this.columns.includes('!inner') ? skills.find(s => s.id === row.offer_id)?.user_id === value : true)
        : row[key] === value);
      let rows = table.filter(matches);
      if (this.operation === 'insert') {
        if (this.table === 'skill_requests' && table.some(r => r.offer_id === this.payload.offer_id && r.requester_id === this.payload.requester_id)) {
          return { data: null, error: { code: '23505', message: 'Duplicate' } };
        }
        const row = { id: `new-${table.length}`, ...this.payload }; table.push(row); rows = [row];
      }
      if (this.operation === 'update') rows.forEach(row => Object.assign(row, this.payload));
      if (this.operation === 'upsert') {
        let row = table.find(r => r.id === this.payload.id);
        if (row) Object.assign(row, this.payload); else { row = { ...this.payload }; table.push(row); }
        rows = [row];
      }
      if (this.operation === 'delete') rows.forEach(row => table.splice(table.indexOf(row), 1));
      const data = rows.map(row => ({ ...row,
        ...(this.table === 'skill_offers' ? { profiles: profiles.find(p => p.id === row.user_id) } : {}),
        ...(this.table === 'skill_requests' ? { skill_offers: skills.find(s => s.id === row.offer_id), requester: profiles.find(p => p.id === row.requester_id) } : {})
      }));
      return { data: this.one ? data[0] || null : data, error: this.one && !data.length ? { message: 'Kayıt bulunamadı' } : null };
    }
  }
  window.supabase = {
    createClient(url, key) {
      mock.createArgs = { url, key };
      return {
        from: table => new Query(table),
        auth: {
          getSession: async () => {
            if (location.search.includes('recovery')) mock.emit('PASSWORD_RECOVERY', owner);
            return { data: { session: mock.user ? { user: mock.user } : null }, error: null };
          },
          onAuthStateChange: fn => { callback = fn; return { data: { subscription: { unsubscribe() {} } } }; },
          signInWithPassword: async () => { mock.emit('SIGNED_IN', owner); return { data: { user: owner }, error: null }; },
          signUp: async () => ({ data: { user: learner, session: null }, error: null }),
          signOut: async () => { mock.emit('SIGNED_OUT', null); return { error: null }; },
          updateUser: async payload => { mock.updatedUser = payload; return { data: { user: mock.user }, error: null }; },
          resetPasswordForEmail: async () => ({ error: null })
        },
        storage: {
          from: () => ({
            upload: async (path, file) => { mock.uploadedAvatar = { path, type: file.type }; return { error: null }; },
            getPublicUrl: path => ({ data: { publicUrl: `https://gjjiomuxwkzgkvjxencd.supabase.co/storage/v1/object/public/avatars/${path}` } }),
            remove: async () => ({ error: null })
          })
        }
      };
    }
  };
})();
