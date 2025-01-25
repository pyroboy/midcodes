import type { EnhancedPrintRequest, RequestMetadata } from '../types/enhanced-request-types';
import type { FlagOption } from '../types/requestTypes';
import { mockPrintRequests } from '../data/mock-print-requests';

export interface PrintRequestService {
  // Core CRUD operations
  getPrintRequest(id: string): Promise<EnhancedPrintRequest>;
  updatePrintRequest(request: EnhancedPrintRequest): Promise<void>;
  
  // Flag operations
  addFlag(referenceNumber: string, type: 'blocking' | 'nonBlocking', flag: FlagOption): Promise<void>;
  removeFlag(referenceNumber: string, type: 'blocking' | 'nonBlocking', flagId: string): Promise<void>;
  updateNotes(referenceNumber: string, notes: string): Promise<void>;
  
  // Step operations
  updateStep(referenceNumber: string, stepIndex: number, done: boolean): Promise<void>;
}

// Mock implementation for development
export class MockPrintRequestService implements PrintRequestService {
  private requests: Map<string, EnhancedPrintRequest>;

  constructor() {
    // Initialize with mock data using reference_number as key
    this.requests = new Map(
      mockPrintRequests.map(request => [request.reference_number, request])
    );
  }

  async getPrintRequest(id: string): Promise<EnhancedPrintRequest> {
    const request = this.requests.get(id);
    if (!request) {
      throw new Error(`Print request not found: ${id}`);
    }
    return request;
  }

  async updatePrintRequest(request: EnhancedPrintRequest): Promise<void> {
    this.requests.set(request.reference_number, {
      ...request
    });
  }

  async addFlag(referenceNumber: string, type: 'blocking' | 'nonBlocking', flag: FlagOption): Promise<void> {
    const request = await this.getPrintRequest(referenceNumber);
    if (!request.flags) {
      request.flags = {
        blocking: [],
        nonBlocking: [],
        notes: '',
        timestamp: new Date().toISOString()
      };
    }
    request.flags[type].push(flag);
    request.flags.timestamp = new Date().toISOString();
    await this.updatePrintRequest(request);
  }

  async removeFlag(referenceNumber: string, type: 'blocking' | 'nonBlocking', flagId: string): Promise<void> {
    const request = await this.getPrintRequest(referenceNumber);
    if (request.flags) {
      request.flags[type] = request.flags[type].filter(f => f.id !== flagId);
      request.flags.timestamp = new Date().toISOString();
      await this.updatePrintRequest(request);
    }
  }

  async updateNotes(referenceNumber: string, notes: string): Promise<void> {
    const request = await this.getPrintRequest(referenceNumber);
    if (request.flags) {
      request.flags.notes = notes;
      request.flags.timestamp = new Date().toISOString();
      await this.updatePrintRequest(request);
    }
  }

  async updateStep(referenceNumber: string, stepIndex: number, done: boolean): Promise<void> {
    const request = await this.getPrintRequest(referenceNumber);
    if (!request.steps) {
      request.steps = {
        steps: [],
        currentStep: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    request.steps.steps[stepIndex] = {
      ...request.steps.steps[stepIndex],
      done
    };
    request.steps.lastUpdated = new Date().toISOString();
    await this.updatePrintRequest(request);
  }
}
