interface Profile {
  role: string;
  org_id: string | null;
}

interface Organization {
  id: string;
  name: string;
}

interface EmulationSession {
  user_id: string;
  emulated_role: string;
  emulated_org_id: string | null;
  status: 'active' | 'ended';
}

export class MockTestHelpers {
  private mockData: {
    profiles: Record<string, Profile>;
    organizations: Record<string, Organization>;
    emulationSessions: Record<string, EmulationSession>;
  } = {
    profiles: {},
    organizations: {},
    emulationSessions: {}
  };

  cleanupOrganization(testOrgId: string) {
    this.mockData.organizations[testOrgId] = {
      id: testOrgId,
      name: 'Test Organization'
    }
  }

  getProfile(userId: string): Profile {
    const profile = this.mockData.profiles[userId]
    if (!profile) throw new Error('Profile not found')
    return profile
  }

  cleanupEmulationSessions(userId: string) {
    if (this.mockData.emulationSessions[userId]) {
      this.mockData.emulationSessions[userId].status = 'ended'
    }
  }

  ensureTestUser(_email: string, _password: string) {
    return { userId: 'mock-user-id' }
  }

  updateUserRole(userId: string, role: string, orgId: string | null) {
    this.mockData.profiles[userId] = {
      role,
      org_id: orgId
    }
  }

  signIn(_email: string, _password: string): { access_token: string; user: { id: string } } {
    return {
      access_token: 'mock-token',
      user: { id: 'mock-user-id' }
    }
  }

  // Helper methods for testing
  setMockProfile(userId: string, profile: Profile) {
    this.mockData.profiles[userId] = profile
  }

  setMockOrganization(orgId: string, org: Organization) {
    this.mockData.organizations[orgId] = org
  }

  setMockEmulationSession(userId: string, session: EmulationSession) {
    this.mockData.emulationSessions[userId] = session
  }
}
