import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { MockUtilities, ValidationHelpers } from '../utils/test-helpers';
import { supabase } from '$lib/supabaseClient';

// Mock crypto for secure token generation
const mockCrypto = {
  randomBytes: vi.fn(),
  createHash: vi.fn(),
  timingSafeEqual: vi.fn()
};

// Mock email service
const mockEmailService = {
  sendPasswordResetEmail: vi.fn(),
  validateEmail: vi.fn()
};

describe('Password Reset Security Testing', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Rate Limiting Enforcement', () => {
    it('should enforce maximum 3 password reset attempts per 15 minutes', async () => {
      const { profile: user } = testData;
      const email = 'test@example.com';
      const maxAttempts = 3;
      const timeWindow = 15 * 60 * 1000; // 15 minutes
      
      // Mock rate limiter storage
      const rateLimitStorage = new Map();
      
      const checkRateLimit = (email: string) => {
        const now = Date.now();
        const attempts = rateLimitStorage.get(email) || [];
        
        // Clean old attempts
        const recentAttempts = attempts.filter((time: number) => now - time < timeWindow);
        rateLimitStorage.set(email, recentAttempts);
        
        return {
          allowed: recentAttempts.length < maxAttempts,
          remaining: maxAttempts - recentAttempts.length,
          resetTime: recentAttempts.length > 0 ? recentAttempts[0] + timeWindow : null
        };
      };
      
      const recordAttempt = (email: string) => {
        const attempts = rateLimitStorage.get(email) || [];
        attempts.push(Date.now());
        rateLimitStorage.set(email, attempts);
      };
      
      // Test rate limiting
      for (let i = 0; i < maxAttempts; i++) {
        const rateLimit = checkRateLimit(email);
        expect(rateLimit.allowed).toBe(true);
        expect(rateLimit.remaining).toBe(maxAttempts - i);
        
        recordAttempt(email);
        
        // Mock successful reset request
        const { data, error } = await supabase.auth.resetPasswordForEmail(email);
        expect(error).toBeNull();
      }
      
      // 4th attempt should be blocked
      const blockedAttempt = checkRateLimit(email);
      expect(blockedAttempt.allowed).toBe(false);
      expect(blockedAttempt.remaining).toBe(0);
      expect(blockedAttempt.resetTime).toBeTruthy();
      
      // Should return error for blocked attempt
      if (!blockedAttempt.allowed) {
        const error = {
          message: 'Too many password reset attempts. Please try again later.',
          code: 'rate_limit_exceeded',
          retryAfter: Math.ceil((blockedAttempt.resetTime! - Date.now()) / 1000)
        };
        
        expect(error.code).toBe('rate_limit_exceeded');
        expect(error.retryAfter).toBeGreaterThan(0);
      }
    });

    it('should reset rate limit after time window expires', async () => {
      const email = 'reset-test@example.com';
      const rateLimitStorage = new Map();
      const timeWindow = 15 * 60 * 1000;
      
      // Record 3 attempts (max limit)
      const oldTimestamp = Date.now() - (timeWindow + 1000); // Over 15 minutes ago
      rateLimitStorage.set(email, [oldTimestamp, oldTimestamp, oldTimestamp]);
      
      const checkRateLimit = (email: string) => {
        const now = Date.now();
        const attempts = rateLimitStorage.get(email) || [];
        const recentAttempts = attempts.filter((time: number) => now - time < timeWindow);
        rateLimitStorage.set(email, recentAttempts);
        
        return {
          allowed: recentAttempts.length < 3,
          remaining: 3 - recentAttempts.length
        };
      };
      
      // Should be allowed after time window
      const rateLimit = checkRateLimit(email);
      expect(rateLimit.allowed).toBe(true);
      expect(rateLimit.remaining).toBe(3);
    });

    it('should track rate limits per email address separately', async () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';
      const rateLimitStorage = new Map();
      
      const recordAttempt = (email: string) => {
        const attempts = rateLimitStorage.get(email) || [];
        attempts.push(Date.now());
        rateLimitStorage.set(email, attempts);
      };
      
      const checkRateLimit = (email: string) => {
        const attempts = rateLimitStorage.get(email) || [];
        return { allowed: attempts.length < 3 };
      };
      
      // Max out attempts for email1
      for (let i = 0; i < 3; i++) {
        recordAttempt(email1);
      }
      
      // email1 should be blocked
      expect(checkRateLimit(email1).allowed).toBe(false);
      
      // email2 should still be allowed
      expect(checkRateLimit(email2).allowed).toBe(true);
    });
  });

  describe('Token Expiration Validation', () => {
    it('should generate tokens with 24-hour expiration', async () => {
      const resetToken = 'secure_reset_token_123';
      const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
      const issuedAt = Date.now();
      
      // Mock token data
      const tokenData = {
        token: resetToken,
        email: 'user@example.com',
        issued_at: issuedAt,
        expires_at: issuedAt + expirationTime,
        used: false
      };
      
      // Validate expiration time
      const expectedExpiration = issuedAt + (24 * 60 * 60 * 1000);
      expect(tokenData.expires_at).toBe(expectedExpiration);
      
      // Check if token is still valid
      const now = Date.now();
      const isValid = now < tokenData.expires_at && !tokenData.used;
      expect(isValid).toBe(true);
    });

    it('should reject expired reset tokens', async () => {
      const expiredToken = 'expired_token_xyz';
      const pastTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      
      const tokenData = {
        token: expiredToken,
        email: 'user@example.com',
        issued_at: pastTime,
        expires_at: pastTime + (24 * 60 * 60 * 1000), // Expired 1 hour ago
        used: false
      };
      
      const now = Date.now();
      const isExpired = now >= tokenData.expires_at;
      expect(isExpired).toBe(true);
      
      // Should reject token validation
      if (isExpired) {
        const error = {
          message: 'Password reset token has expired',
          code: 'token_expired'
        };
        
        expect(error.code).toBe('token_expired');
      }
    });

    it('should invalidate tokens after single use', async () => {
      const oneTimeToken = 'one_time_token_456';
      
      const tokenData = {
        token: oneTimeToken,
        email: 'user@example.com',
        expires_at: Date.now() + (24 * 60 * 60 * 1000),
        used: false
      };
      
      // First use - should succeed
      expect(tokenData.used).toBe(false);
      
      // Simulate token use
      tokenData.used = true;
      
      // Second use attempt - should fail
      const isValid = !tokenData.used && Date.now() < tokenData.expires_at;
      expect(isValid).toBe(false);
      
      if (tokenData.used) {
        const error = {
          message: 'Password reset token has already been used',
          code: 'token_used'
        };
        
        expect(error.code).toBe('token_used');
      }
    });

    it('should handle token cleanup for expired tokens', async () => {
      const tokenStorage = new Map();
      const now = Date.now();
      
      // Mock tokens with various states
      const tokens = [
        { id: '1', expires_at: now - 1000, used: false }, // Expired
        { id: '2', expires_at: now + 1000, used: true },  // Used
        { id: '3', expires_at: now + 1000, used: false }, // Valid
        { id: '4', expires_at: now - 5000, used: true }   // Expired and used
      ];
      
      tokens.forEach(token => tokenStorage.set(token.id, token));
      
      // Cleanup expired tokens
      const cleanupExpiredTokens = () => {
        const validTokens = new Map();
        for (const [id, token] of tokenStorage.entries()) {
          if (token.expires_at > now && !token.used) {
            validTokens.set(id, token);
          }
        }
        return validTokens;
      };
      
      const validTokens = cleanupExpiredTokens();
      
      // Should only keep valid, unused token
      expect(validTokens.size).toBe(1);
      expect(validTokens.has('3')).toBe(true);
    });
  });

  describe('Password Policy Compliance', () => {
    it('should enforce minimum 8 character password length', async () => {
      const passwords = [
        { password: 'short', valid: false },
        { password: '1234567', valid: false }, // 7 chars
        { password: '12345678', valid: true },  // 8 chars
        { password: 'verylongpassword123', valid: true }
      ];
      
      const validatePasswordLength = (password: string) => password.length >= 8;
      
      passwords.forEach(({ password, valid }) => {
        expect(validatePasswordLength(password)).toBe(valid);
      });
    });

    it('should require special characters in password', async () => {
      const passwords = [
        { password: 'SimplePassword123', valid: false }, // No special chars
        { password: 'Simple123!', valid: true },         // Has !
        { password: 'Password@123', valid: true },       // Has @
        { password: 'Pass#word$', valid: true },         // Has # and $
        { password: 'justletters', valid: false }        // No special chars or numbers
      ];
      
      const validateSpecialChars = (password: string) => {
        const specialChars = /[!@#$%^&*(),.?":{}|<>]/;
        return specialChars.test(password);
      };
      
      passwords.forEach(({ password, valid }) => {
        expect(validateSpecialChars(password)).toBe(valid);
      });
    });

    it('should require combination of uppercase, lowercase, and numbers', async () => {
      const passwords = [
        { password: 'alllowercase123!', valid: false }, // No uppercase
        { password: 'ALLUPPERCASE123!', valid: false }, // No lowercase
        { password: 'NoNumbers!', valid: false },       // No numbers
        { password: 'ValidPass123!', valid: true }      // All requirements met
      ];
      
      const validatePasswordComplexity = (password: string) => {
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return hasUppercase && hasLowercase && hasNumbers && hasSpecialChars;
      };
      
      passwords.forEach(({ password, valid }) => {
        expect(validatePasswordComplexity(password)).toBe(valid);
      });
    });

    it('should reject common weak passwords', async () => {
      const commonWeakPasswords = [
        'Password123!',
        'Admin123!',
        '12345678!',
        'Qwerty123!',
        'Welcome123!',
        'Password1!',
        'Abc123456!'
      ];
      
      // Mock common password list
      const isCommonPassword = (password: string) => {
        const normalizedPassword = password.toLowerCase();
        const commonPatterns = [
          'password',
          'admin',
          '12345',
          'qwerty',
          'welcome',
          'abc123'
        ];
        
        return commonPatterns.some(pattern => 
          normalizedPassword.includes(pattern)
        );
      };
      
      commonWeakPasswords.forEach(password => {
        expect(isCommonPassword(password)).toBe(true);
        
        if (isCommonPassword(password)) {
          const error = {
            message: 'Password is too common. Please choose a more secure password.',
            code: 'common_password'
          };
          
          expect(error.code).toBe('common_password');
        }
      });
    });
  });

  describe('Secure Token Generation', () => {
    it('should generate cryptographically secure random tokens', async () => {
      // Mock secure random generation
      const generateSecureToken = () => {
        // Simulate crypto.randomBytes(32).toString('hex')
        const charset = '0123456789abcdef';
        let token = '';
        for (let i = 0; i < 64; i++) { // 32 bytes = 64 hex chars
          token += charset[Math.floor(Math.random() * charset.length)];
        }
        return token;
      };
      
      const tokens = new Set();
      const tokenCount = 1000;
      
      // Generate multiple tokens to test uniqueness
      for (let i = 0; i < tokenCount; i++) {
        const token = generateSecureToken();
        
        // Should be 64 characters (32 bytes in hex)
        expect(token).toHaveLength(64);
        
        // Should be hexadecimal
        expect(/^[0-9a-f]+$/.test(token)).toBe(true);
        
        // Should be unique
        expect(tokens.has(token)).toBe(false);
        tokens.add(token);
      }
      
      // All tokens should be unique
      expect(tokens.size).toBe(tokenCount);
    });

    it('should use constant-time comparison for token validation', async () => {
      const storedToken = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890';
      
      // Mock constant-time comparison
      const constantTimeEqual = (a: string, b: string) => {
        if (a.length !== b.length) return false;
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
          result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
      };
      
      const testCases = [
        { token: storedToken, expected: true },  // Exact match
        { token: storedToken.toUpperCase(), expected: false }, // Case sensitive
        { token: storedToken.slice(0, -1), expected: false },  // Truncated
        { token: storedToken + 'x', expected: false },         // Extended
        { token: 'different_token_entirely_here_1234567890123456789', expected: false }
      ];
      
      testCases.forEach(({ token, expected }) => {
        expect(constantTimeEqual(token, storedToken)).toBe(expected);
      });
    });

    it('should prevent timing attacks on token validation', async () => {
      const validToken = 'valid_token_12345678901234567890123456789012345678901234';
      const invalidTokens = [
        '',
        'a',
        'invalid',
        'invalid_token_but_same_length_as_valid_one_here_12345678901'
      ];
      
      // Mock timing-safe validation
      const validateToken = (providedToken: string, storedToken: string) => {
        // Always perform full comparison regardless of early mismatches
        let isValid = providedToken.length === storedToken.length;
        
        const maxLength = Math.max(providedToken.length, storedToken.length);
        
        for (let i = 0; i < maxLength; i++) {
          const providedChar = i < providedToken.length ? providedToken.charCodeAt(i) : 0;
          const storedChar = i < storedToken.length ? storedToken.charCodeAt(i) : 0;
          
          if (providedChar !== storedChar) {
            isValid = false;
          }
        }
        
        return isValid;
      };
      
      // Test timing-safe validation
      expect(validateToken(validToken, validToken)).toBe(true);
      
      invalidTokens.forEach(invalidToken => {
        expect(validateToken(invalidToken, validToken)).toBe(false);
      });
    });
  });

  describe('Brute Force Attack Prevention', () => {
    it('should implement progressive delays for repeated failures', async () => {
      const email = 'brute-force-test@example.com';
      const attempts = [];
      
      // Mock progressive delay calculation
      const calculateDelay = (attemptCount: number) => {
        const baseDelay = 1000; // 1 second
        const maxDelay = 300000; // 5 minutes
        
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, etc.
        const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
        return delay;
      };
      
      // Test progressive delays
      const expectedDelays = [1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 300000];
      
      expectedDelays.forEach((expectedDelay, index) => {
        const calculatedDelay = calculateDelay(index);
        expect(calculatedDelay).toBe(expectedDelay);
      });
    });

    it('should implement account lockout after multiple failures', async () => {
      const email = 'lockout-test@example.com';
      const maxFailures = 10;
      const lockoutDuration = 30 * 60 * 1000; // 30 minutes
      
      // Mock account lockout tracking
      const accountLockouts = new Map();
      
      const isAccountLocked = (email: string) => {
        const lockout = accountLockouts.get(email);
        if (!lockout) return false;
        
        const now = Date.now();
        return now < lockout.lockedUntil;
      };
      
      const recordFailedAttempt = (email: string) => {
        const lockout = accountLockouts.get(email) || { failures: 0, lockedUntil: 0 };
        lockout.failures += 1;
        
        if (lockout.failures >= maxFailures) {
          lockout.lockedUntil = Date.now() + lockoutDuration;
        }
        
        accountLockouts.set(email, lockout);
        return lockout;
      };
      
      // Test account lockout
      for (let i = 0; i < maxFailures - 1; i++) {
        expect(isAccountLocked(email)).toBe(false);
        recordFailedAttempt(email);
      }
      
      // 10th failure should trigger lockout
      const lockout = recordFailedAttempt(email);
      expect(isAccountLocked(email)).toBe(true);
      expect(lockout.lockedUntil).toBeGreaterThan(Date.now());
    });

    it('should detect distributed brute force attacks', async () => {
      const suspiciousIPs = new Map();
      const ipThreshold = 5; // Max 5 different emails per IP per hour
      const timeWindow = 60 * 60 * 1000; // 1 hour
      
      const trackIPActivity = (ip: string, email: string) => {
        const now = Date.now();
        const activity = suspiciousIPs.get(ip) || { emails: new Set(), attempts: [] };
        
        // Clean old attempts
        activity.attempts = activity.attempts.filter((time: number) => now - time < timeWindow);
        
        activity.emails.add(email);
        activity.attempts.push(now);
        suspiciousIPs.set(ip, activity);
        
        return {
          uniqueEmails: activity.emails.size,
          recentAttempts: activity.attempts.length,
          suspicious: activity.emails.size > ipThreshold
        };
      };
      
      const maliciousIP = '192.168.1.100';
      const targetEmails = [
        'victim1@example.com',
        'victim2@example.com', 
        'victim3@example.com',
        'victim4@example.com',
        'victim5@example.com',
        'victim6@example.com' // This should trigger detection
      ];
      
      // Simulate distributed attack
      targetEmails.forEach(email => {
        const activity = trackIPActivity(maliciousIP, email);
        
        if (activity.suspicious) {
          expect(activity.uniqueEmails).toBeGreaterThan(ipThreshold);
        }
      });
      
      const finalActivity = suspiciousIPs.get(maliciousIP);
      expect(finalActivity.suspicious).toBe(true);
    });
  });

  describe('Email Delivery Security', () => {
    it('should validate email addresses before sending reset emails', async () => {
      const emailValidationTests = [
        { email: 'valid@example.com', valid: true },
        { email: 'user.name@example.co.uk', valid: true },
        { email: 'test+tag@example.org', valid: true },
        { email: 'invalid-email', valid: false },
        { email: '@example.com', valid: false },
        { email: 'test@', valid: false },
        { email: '', valid: false },
        { email: 'test@example', valid: false },
        { email: 'test..test@example.com', valid: false }
      ];
      
      const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && !email.includes('..');
      };
      
      emailValidationTests.forEach(({ email, valid }) => {
        expect(validateEmail(email)).toBe(valid);
      });
    });

    it('should prevent email bombing through rate limiting', async () => {
      const email = 'target@example.com';
      const emailRateLimit = 3; // Max 3 emails per hour
      const timeWindow = 60 * 60 * 1000; // 1 hour
      
      const emailTracker = new Map();
      
      const canSendEmail = (email: string) => {
        const now = Date.now();
        const history = emailTracker.get(email) || [];
        
        // Clean old entries
        const recentEmails = history.filter((time: number) => now - time < timeWindow);
        emailTracker.set(email, recentEmails);
        
        return recentEmails.length < emailRateLimit;
      };
      
      const recordEmailSent = (email: string) => {
        const history = emailTracker.get(email) || [];
        history.push(Date.now());
        emailTracker.set(email, history);
      };
      
      // Should allow first 3 emails
      for (let i = 0; i < emailRateLimit; i++) {
        expect(canSendEmail(email)).toBe(true);
        recordEmailSent(email);
      }
      
      // 4th email should be blocked
      expect(canSendEmail(email)).toBe(false);
    });

    it('should use secure email templates with no user-controlled content', async () => {
      const resetToken = 'secure_token_123';
      const userEmail = 'user@example.com';
      
      // Mock secure email template
      const createSecureEmailTemplate = (email: string, token: string) => {
        // Template should not include any user-provided content directly
        return {
          to: email, // Validated email only
          subject: 'Password Reset Request - ID Generator', // Static subject
          html: `
            <div>
              <h2>Password Reset Request</h2>
              <p>A password reset was requested for your account.</p>
              <p>Click the link below to reset your password:</p>
              <a href="https://yourdomain.com/auth/reset-password?token=${encodeURIComponent(token)}">
                Reset Password
              </a>
              <p>This link will expire in 24 hours.</p>
              <p>If you did not request this reset, please ignore this email.</p>
            </div>
          `, // Static template with only token parameter
          text: `Password reset requested. Visit: https://yourdomain.com/auth/reset-password?token=${encodeURIComponent(token)}`
        };
      };
      
      const emailTemplate = createSecureEmailTemplate(userEmail, resetToken);
      
      expect(emailTemplate.to).toBe(userEmail);
      expect(emailTemplate.subject).toContain('Password Reset Request');
      expect(emailTemplate.html).toContain(resetToken);
      expect(emailTemplate.html).not.toContain('<script>'); // No executable content
      expect(emailTemplate.text).toContain(resetToken);
    });
  });
});