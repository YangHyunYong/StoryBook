import request from 'supertest';
import { app } from '../src/index';
import { supabase } from '../src/supabaseClient';

describe('🎯 user apis', () => {
  // Variables for a "setup user" to be used in GET/PATCH tests
  let setupUserId: string;
  const timestamp = Date.now();
  const setupWalletAddress = `setup_wallet_${timestamp}`;
  const setupNickname = `Setup User ${timestamp}`;

  // Variables for a user created via POST test
  let createdUserId: string;

  beforeAll(async () => {
    // Create a user directly in DB for GET/PATCH tests
    const generatedId = `user_setup_${Date.now()}`;
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: generatedId,
        wallet_address: setupWalletAddress,
        nickname: setupNickname,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create setup user: ${error?.message}`);
    }
    setupUserId = data.id;
  });

  afterAll(async () => {
    // Cleanup setup user
    if (setupUserId) {
      await supabase.from('users').delete().eq('id', setupUserId);
    }
    // Cleanup user created by POST test
    if (createdUserId) {
      await supabase.from('users').delete().eq('id', createdUserId);
    }
  });

  describe('➡️ POST /users', () => {
    it('🟢 새로운 유저를 생성해야 한다', async () => {
      const newWallet = `new_wallet_${Date.now()}`;
      const res = await request(app)
        .post('/users')
        .send({
          wallet_address: newWallet,
          nickname: 'New User',
          avatar_url: 'http://example.com/avatar.png'
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.wallet_address).toBe(newWallet);
      expect(res.body.user.nickname).toBe('New User');
      
      createdUserId = res.body.user.id;
    });

    it('🔴 필수 필드가 누락된 경우 400을 반환해야 한다', async () => {
      const res = await request(app)
        .post('/users')
        .send({ nickname: 'Only Nickname' }); // missing wallet_address

      expect(res.status).toBe(400);
    });
  });

  describe('➡️ GET /users', () => {
    it('🟢 본인의 정보를 조회해야 한다', async () => {
      const res = await request(app)
        .get('/users')
        .set('x-user-id', setupUserId);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(setupUserId);
      expect(res.body.user.nickname).toBe(setupNickname);
    });

    it('🔴 헤더가 없는 경우 400을 반환해야 한다', async () => {
      const res = await request(app).get('/users');
      expect(res.status).toBe(400);
    });

    it('🔴 존재하지 않는 유저인 경우 404를 반환해야 한다', async () => {
      const res = await request(app)
        .get('/users')
        .set('x-user-id', 'non_existent_user');

      expect(res.status).toBe(404);
    });
  });

  describe('➡️ PATCH /users', () => {
    it('🟢 닉네임을 수정해야 한다', async () => {
      const newNick = 'Updated Nickname';
      const res = await request(app)
        .patch('/users')
        .set('x-user-id', setupUserId)
        .send({ nickname: newNick });

      expect(res.status).toBe(200);
      expect(res.body.user.nickname).toBe(newNick);
      
      // Verify DB
      const { data } = await supabase.from('users').select('nickname').eq('id', setupUserId).single();
      expect(data?.nickname).toBe(newNick);
    });

    it('🔴 수정할 필드가 없는 경우 400을 반환해야 한다', async () => {
       const res = await request(app)
        .patch('/users')
        .set('x-user-id', setupUserId)
        .send({}); 
       expect(res.status).toBe(400);
    });
  });
});
