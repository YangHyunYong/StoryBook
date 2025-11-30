import request from 'supertest';
import { app } from '../src/index';
import { supabase } from '../src/supabaseClient';

// No mocks! We are hitting the real Supabase instance.

describe('🎯 post apis', () => {
  let testUserId: string;
  let testPostId: string;
  const timestamp = Date.now();
  const testWalletAddress = `test_wallet_${timestamp}`;
  const testNickname = `Test User ${timestamp}`;

  beforeAll(async () => {
    // 1. Create a real user directly via Supabase to ensure we have a valid owner
    const generatedId = `user_${Date.now()}`;
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: generatedId,
        wallet_address: testWalletAddress,
        nickname: testNickname,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create test user: ${error?.message}`);
    }
    testUserId = data.id;
  });

  afterAll(async () => {
    // Cleanup: delete everything related to this test user
    // Delete likes/reposts first if cascade isn't set up, but usually users cascade.
    // We'll try to be thorough.
    
    if (testPostId) {
      await supabase.from('likes').delete().eq('post_id', testPostId);
      await supabase.from('reposts').delete().eq('post_id', testPostId);
      await supabase.from('posts').delete().eq('id', testPostId);
    }
    if (testUserId) {
      // Also delete any posts this user might have made that we didn't track
      await supabase.from('posts').delete().eq('user_id', testUserId);
      await supabase.from('users').delete().eq('id', testUserId);
    }
  });

  describe('➡️ POST /posts', () => {
    it('🟢 Supabase에 실제 게시글이 생성되어야 한다', async () => {
      const res = await request(app)
        .post('/posts')
        .set('x-user-id', testUserId)
        .send({ content: 'Real E2E Test Content' });

      expect(res.status).toBe(201);
      expect(res.body.post).toBeDefined();
      expect(res.body.post.content).toBe('Real E2E Test Content');
      expect(res.body.post.user_id).toBe(testUserId);
      expect(res.body.post.nickname).toBe(testNickname);

      testPostId = res.body.post.id;
    });

    it('🔴 존재하지 않는 사용자인 경우 403을 반환해야 한다', async () => {
      const res = await request(app)
        .post('/posts')
        .set('x-user-id', 'invalid-user-id-12345')
        .send({ content: 'Should fail' });

      expect(res.status).toBe(403);
    });
  });

  describe('➡️ GET /posts', () => {
    it('🟢 새 게시글이 포함된 게시글 목록을 조회해야 한다', async () => {
      const res = await request(app).get('/posts');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.posts)).toBe(true);
      const found = res.body.posts.find((p: any) => p.id === testPostId);
      expect(found).toBeDefined();
      expect(found.content).toBe('Real E2E Test Content');
      expect(found.nickname).toBe(testNickname);
    });
  });

  describe('➡️ GET /posts/:id', () => {
    it('🟢 특정 게시글의 상세 정보를 조회해야 한다', async () => {
      const res = await request(app)
        .get(`/posts/${testPostId}`);

      expect(res.status).toBe(200);
      expect(res.body.post.id).toBe(testPostId);
      expect(res.body.post.content).toBe('Real E2E Test Content');
    });

    it('🔴 존재하지 않는 게시글인 경우 404를 반환해야 한다', async () => {
      const res = await request(app)
        .get('/posts/non-existent-id');

      expect(res.status).toBe(404);
    });
  });

  describe('➡️ POST /posts/:id/likes', () => {
    it('🟢 좋아요를 누르면 상태가 켜져야 한다', async () => {
      const res = await request(app)
        .post(`/posts/${testPostId}/likes`)
        .set('x-user-id', testUserId);

      expect(res.status).toBe(200);
      expect(res.body.liked).toBe(true);
      
      // Verify in DB directly
      const { data } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', testPostId)
        .eq('user_id', testUserId)
        .single();
      expect(data).toBeDefined();
    });

    it('🟢 좋아요를 다시 누르면 상태가 꺼져야 한다', async () => {
      const res = await request(app)
        .post(`/posts/${testPostId}/likes`)
        .set('x-user-id', testUserId);

      expect(res.status).toBe(200);
      expect(res.body.liked).toBe(false);

      // Verify in DB directly
      const { data } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', testPostId)
        .eq('user_id', testUserId)
        .maybeSingle();
      expect(data).toBeNull();
    });
  });
});

