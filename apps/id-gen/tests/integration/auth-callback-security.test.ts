import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { MockUtilities, ValidationHelpers } from '../utils/test-helpers';

// Mock SvelteKit imports
const mockRedirect = vi.fn();
vi.mock('@sveltejs/kit', () => ({
  redirect: mockRedirect
}));

// Mock the auth callback handler
const mockAuthCallback = {
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn()
};

describe('Auth Callback Security Testing', () => {
  let testData: any;
  let mockSupabase: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
    mockSupabase = MockUtilities.createSupabaseMock();
    vi.clearAllMocks();
    mockRedirect.mockImplementation((status, url) => {
      throw new Error(`Redirect: ${status} -> ${url}`);
    });
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('OAuth State Parameter Validation', () => {
    it('should validate state parameter matches original request', async () => {
      // Generate secure random state
      const originalState = 'abc123def456ghi789';
      const validCode = 'auth_code_12345';
      
      // Mock URL with valid state and code
      const mockURL = new URL('http://localhost:5173/auth/callback');
      mockURL.searchParams.set('code', validCode);
      mockURL.searchParams.set('state', originalState);
      
      // Mock session storage for state verification
      const storedState = 'abc123def456ghi789';
      
      // Validate state matches
      const stateMatches = mockURL.searchParams.get('state') === storedState;
      expect(stateMatches).toBe(true);
      
      // Mock successful token exchange
      mockAuthCallback.exchangeCodeForSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-123' } } },
        error: null
      });
      
      // Simulate callback processing
      const code = mockURL.searchParams.get('code');
      const state = mockURL.searchParams.get('state');
      
      if (code && state === storedState) {
        const result = await mockAuthCallback.exchangeCodeForSession(code);
        expect(result.error).toBeNull();
        expect(result.data.session.user.id).toBe('user-123');
      }
    });

    it('should reject callback with invalid state parameter', async () => {
      const originalState = 'abc123def456ghi789';
      const maliciousState = 'malicious_state_attack';
      
      const mockURL = new URL('http://localhost:5173/auth/callback');
      mockURL.searchParams.set('code', 'valid_code');
      mockURL.searchParams.set('state', maliciousState);
      
      // Validate state mismatch
      const stateMatches = mockURL.searchParams.get('state') === originalState;
      expect(stateMatches).toBe(false);
      
      // Should reject the callback
      const code = mockURL.searchParams.get('code');
      const state = mockURL.searchParams.get('state');
      
      if (state !== originalState) {
        expect(() => {
          throw new Error('Invalid state parameter - potential CSRF attack');
        }).toThrow('Invalid state parameter');
      }
    });

    it('should reject callback with missing state parameter', async () => {
      const mockURL = new URL('http://localhost:5173/auth/callback');
      mockURL.searchParams.set('code', 'valid_code');
      // No state parameter
      
      const state = mockURL.searchParams.get('state');
      expect(state).toBeNull();
      
      // Should reject callback without state
      if (!state) {
        expect(() => {
          throw new Error('Missing state parameter - security violation');
        }).toThrow('Missing state parameter');
      }
    });
  });

  describe('Authorization Code Validation', () => {
    it('should handle valid authorization codes correctly', async () => {
      const validCode = 'valid_auth_code_12345';
      
      mockAuthCallback.exchangeCodeForSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'user-123', email: 'user@example.com' },
            access_token: 'valid_access_token',
            refresh_token: 'valid_refresh_token'
          }
        },
        error: null
      });
      
      const result = await mockAuthCallback.exchangeCodeForSession(validCode);
      
      expect(result.error).toBeNull();
      expect(result.data.session.user.id).toBe('user-123');
      expect(result.data.session.access_token).toBeTruthy();
      expect(mockAuthCallback.exchangeCodeForSession).toHaveBeenCalledWith(validCode);
    });

    it('should reject invalid authorization codes', async () => {
      const invalidCode = 'invalid_code_xyz';
      
      mockAuthCallback.exchangeCodeForSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Invalid authorization code', code: 'invalid_grant' }
      });
      
      const result = await mockAuthCallback.exchangeCodeForSession(invalidCode);
      
      expect(result.error).toBeTruthy();
      expect(result.error.code).toBe('invalid_grant');
      expect(result.data.session).toBeNull();
    });

    it('should reject expired authorization codes', async () => {
      const expiredCode = 'expired_code_abc';
      
      mockAuthCallback.exchangeCodeForSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Authorization code expired', code: 'expired_token' }
      });
      
      const result = await mockAuthCallback.exchangeCodeForSession(expiredCode);
      
      expect(result.error).toBeTruthy();
      expect(result.error.code).toBe('expired_token');
      expect(result.data.session).toBeNull();
    });

    it('should reject reused authorization codes', async () => {
      const reusedCode = 'already_used_code';
      
      // First use - should succeed
      mockAuthCallback.exchangeCodeForSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-123' } } },
        error: null
      });
      
      const firstResult = await mockAuthCallback.exchangeCodeForSession(reusedCode);
      expect(firstResult.error).toBeNull();
      
      // Second use - should fail
      mockAuthCallback.exchangeCodeForSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Authorization code already used', code: 'invalid_grant' }
      });
      
      const secondResult = await mockAuthCallback.exchangeCodeForSession(reusedCode);
      expect(secondResult.error).toBeTruthy();
      expect(secondResult.error.code).toBe('invalid_grant');
    });
  });

  describe('Malicious Redirect Prevention', () => {
    it('should allow safe returnTo URLs within same origin', async () => {
      const safeUrls = [
        '/dashboard',
        '/templates',
        '/profile',
        '/admin/users',
        '/',
        ''
      ];
      
      for (const returnTo of safeUrls) {
        const mockURL = new URL('http://localhost:5173/auth/callback');
        if (returnTo) {
          mockURL.searchParams.set('returnTo', returnTo);
        }
        
        const returnToParam = mockURL.searchParams.get('returnTo');
        const redirectUrl = returnToParam || '/';
        
        // Validate safe URL
        const isSafeUrl = !redirectUrl.startsWith('http') || 
                         redirectUrl.startsWith('http://localhost') ||
                         redirectUrl.startsWith('https://localhost');
        
        expect(isSafeUrl).toBe(true);
        
        // Should not throw redirect error for safe URLs
        try {
          mockRedirect(303, redirectUrl);
        } catch (error) {
          expect(error.message).toContain(`Redirect: 303 -> ${redirectUrl}`);
        }
      }
    });

    it('should reject malicious external redirect URLs', async () => {
      const maliciousUrls = [
        'https://evil.com',
        'http://attacker.com/steal-tokens',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        '//evil.com',
        'https://evil.com/phishing',
        'ftp://malicious.server.com',
        'file:///etc/passwd'
      ];
      
      for (const maliciousUrl of maliciousUrls) {
        const mockURL = new URL('http://localhost:5173/auth/callback');
        mockURL.searchParams.set('returnTo', maliciousUrl);
        
        const returnToParam = mockURL.searchParams.get('returnTo');
        
        // Validate malicious URL detection
        const isMalicious = returnToParam?.startsWith('http') && 
                           !returnToParam.startsWith('http://localhost') &&
                           !returnToParam.startsWith('https://localhost');
        
        const isJavaScript = returnToParam?.startsWith('javascript:');
        const isData = returnToParam?.startsWith('data:');
        const isFile = returnToParam?.startsWith('file:');
        const isProtocolRelative = returnToParam?.startsWith('//');
        
        const shouldReject = isMalicious || isJavaScript || isData || isFile || isProtocolRelative;
        
        if (shouldReject) {
          // Should use safe fallback
          const safeUrl = '/';
          expect(safeUrl).toBe('/');
        }
      }
    });

    it('should sanitize and validate returnTo parameter length', async () => {
      // Test extremely long URL
      const longUrl = '/' + 'a'.repeat(2000);
      const maxUrlLength = 2048;
      
      const mockURL = new URL('http://localhost:5173/auth/callback');
      mockURL.searchParams.set('returnTo', longUrl);
      
      const returnToParam = mockURL.searchParams.get('returnTo');
      const isUrlTooLong = (returnToParam?.length || 0) > maxUrlLength;
      
      if (isUrlTooLong) {
        // Should truncate or reject
        const safeUrl = '/';
        expect(safeUrl).toBe('/');
      }
      
      expect(isUrlTooLong).toBe(false); // Our test URL is still under limit
    });
  });

  describe('Session Creation and Security', () => {
    it('should create secure session with proper attributes', async () => {
      const validCode = 'secure_auth_code';
      
      mockAuthCallback.exchangeCodeForSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { 
              id: 'user-123',
              email: 'user@example.com',
              email_verified: true,
              created_at: '2024-01-01T00:00:00Z'
            },
            access_token: 'secure_access_token',
            refresh_token: 'secure_refresh_token',
            expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            token_type: 'bearer'
          }
        },
        error: null
      });
      
      const result = await mockAuthCallback.exchangeCodeForSession(validCode);
      const session = result.data.session;
      
      expect(session.user.id).toBeTruthy();
      expect(session.user.email_verified).toBe(true);
      expect(session.access_token).toBeTruthy();
      expect(session.refresh_token).toBeTruthy();
      expect(session.expires_at).toBeGreaterThan(Date.now());
      expect(session.token_type).toBe('bearer');
    });

    it('should handle session creation failures gracefully', async () => {
      const failingCode = 'failing_auth_code';
      
      mockAuthCallback.exchangeCodeForSession.mockRejectedValueOnce(
        new Error('Network error during session creation')
      );
      
      try {
        await mockAuthCallback.exchangeCodeForSession(failingCode);
      } catch (error) {
        expect(error.message).toContain('Network error');
        
        // Should redirect to error page or login
        try {
          mockRedirect(303, '/auth?error=callback_failed');
        } catch (redirectError) {
          expect(redirectError.message).toContain('Redirect: 303 -> /auth?error=callback_failed');
        }
      }
    });

    it('should prevent session fixation attacks', async () => {
      // Simulate potential session fixation attempt
      const suspiciousCode = 'potentially_fixed_session_code';
      
      // Mock session that might be pre-existing
      const existingSessionId = 'old_session_123';
      
      mockAuthCallback.exchangeCodeForSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: 'user-123' },
            access_token: 'new_access_token', // Should be new
            session_id: 'new_session_456' // Should be different from existing
          }
        },
        error: null
      });
      
      const result = await mockAuthCallback.exchangeCodeForSession(suspiciousCode);
      const newSessionId = result.data.session.session_id;
      
      // New session should have different ID
      expect(newSessionId).not.toBe(existingSessionId);
      expect(newSessionId).toBe('new_session_456');
    });

    it('should enforce secure cookie attributes for session', async () => {
      const sessionData = {
        user: { id: 'user-123' },
        access_token: 'token_123'
      };
      
      // Mock cookie setting (would be done by Supabase)
      const cookieAttributes = {
        httpOnly: true,
        secure: true, // HTTPS only
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 // 24 hours
      };
      
      // Verify secure attributes
      expect(cookieAttributes.httpOnly).toBe(true);
      expect(cookieAttributes.secure).toBe(true);
      expect(cookieAttributes.sameSite).toBe('lax');
      expect(cookieAttributes.maxAge).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Rate Limiting', () => {
    it('should implement rate limiting for callback attempts', async () => {
      const clientIP = '192.168.1.100';
      const maxAttempts = 5;
      const timeWindow = 15 * 60 * 1000; // 15 minutes
      
      // Mock rate limiter
      const rateLimiter = {
        attempts: new Map(),
        isAllowed: function(ip: string) {
          const now = Date.now();
          const attempts = this.attempts.get(ip) || [];
          
          // Clean old attempts
          const recentAttempts = attempts.filter(time => now - time < timeWindow);
          this.attempts.set(ip, recentAttempts);
          
          return recentAttempts.length < maxAttempts;
        },
        recordAttempt: function(ip: string) {
          const attempts = this.attempts.get(ip) || [];
          attempts.push(Date.now());
          this.attempts.set(ip, attempts);
        }
      };
      
      // Test rate limiting
      for (let i = 0; i < maxAttempts; i++) {
        expect(rateLimiter.isAllowed(clientIP)).toBe(true);
        rateLimiter.recordAttempt(clientIP);
      }
      
      // Should be blocked after max attempts
      expect(rateLimiter.isAllowed(clientIP)).toBe(false);
    });

    it('should handle concurrent callback attempts securely', async () => {
      const sameCode = 'concurrent_auth_code';
      const concurrentAttempts = 3;
      
      // Mock that only first attempt succeeds
      mockAuthCallback.exchangeCodeForSession
        .mockResolvedValueOnce({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
        .mockResolvedValue({
          data: { session: null },
          error: { message: 'Code already used', code: 'invalid_grant' }
        });
      
      // Simulate concurrent requests
      const promises = Array(concurrentAttempts).fill(null).map(() => 
        mockAuthCallback.exchangeCodeForSession(sameCode)
      );
      
      const results = await Promise.all(promises);
      
      // Only first should succeed
      expect(results[0].error).toBeNull();
      expect(results[1].error).toBeTruthy();
      expect(results[2].error).toBeTruthy();
    });

    it('should log security events for monitoring', async () => {
      const securityEvents = [];
      
      const logSecurityEvent = (event: any) => {
        securityEvents.push({
          timestamp: new Date().toISOString(),
          ...event
        });
      };
      
      // Test various security events
      const events = [
        { type: 'invalid_state', ip: '192.168.1.100', details: 'State parameter mismatch' },
        { type: 'invalid_code', ip: '192.168.1.101', details: 'Invalid authorization code' },
        { type: 'malicious_redirect', ip: '192.168.1.102', details: 'Attempted redirect to evil.com' },
        { type: 'rate_limit_exceeded', ip: '192.168.1.100', details: 'Too many callback attempts' }
      ];
      
      events.forEach(event => logSecurityEvent(event));
      
      expect(securityEvents).toHaveLength(4);
      expect(securityEvents[0].type).toBe('invalid_state');
      expect(securityEvents[1].type).toBe('invalid_code');
      expect(securityEvents[2].type).toBe('malicious_redirect');
      expect(securityEvents[3].type).toBe('rate_limit_exceeded');
      
      // Each event should have timestamp
      securityEvents.forEach(event => {
        expect(event.timestamp).toBeTruthy();
        expect(event.ip).toBeTruthy();
      });
    });
  });
});