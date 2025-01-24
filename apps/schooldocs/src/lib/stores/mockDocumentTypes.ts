import { writable } from 'svelte/store';
import type { DocumentType } from '$lib/types/document-types';

const mockData: DocumentType[] = [
    {
        id: '1',
        organization_id: 'org1',
        name: 'Transcript of Records',
        description: 'Official transcript of academic records',
        price: 500.00,
        processing_time_hours: 72,
        requirements: ['Valid ID', 'Clearance Form'],
        max_copies: 3,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '2',
        organization_id: 'org1',
        name: 'Diploma',
        description: 'Official diploma certificate',
        price: 1000.00,
        processing_time_hours: 120,
        requirements: ['Valid ID', 'Clearance Form', 'Exit Interview Form'],
        max_copies: 1,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '3',
        organization_id: 'org1',
        name: 'Certificate of Enrollment',
        description: 'Current enrollment verification',
        price: 100.00,
        processing_time_hours: 24,
        requirements: ['Valid ID'],
        max_copies: 5,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '4',
        organization_id: 'org1',
        name: 'Certificate of Good Moral Character',
        description: 'Character certification from the institution',
        price: 150.00,
        processing_time_hours: 48,
        requirements: ['Valid ID', 'Disciplinary Clearance'],
        max_copies: 3,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '5',
        organization_id: 'org1',
        name: 'Course Description',
        description: 'Detailed description of completed courses',
        price: 300.00,
        processing_time_hours: 96,
        requirements: ['Valid ID', 'TOR Request'],
        max_copies: 2,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '6',
        organization_id: 'org1',
        name: 'Certification of Units Earned',
        description: 'Official certification of completed academic units',
        price: 200.00,
        processing_time_hours: 48,
        requirements: ['Valid ID'],
        max_copies: 3,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '7',
        organization_id: 'org1',
        name: 'Leave of Absence Form',
        description: 'Official leave of absence request',
        price: 100.00,
        processing_time_hours: 72,
        requirements: ['Valid ID', 'Parent Consent', 'Medical Certificate'],
        max_copies: 1,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '8',
        organization_id: 'org1',
        name: 'Certification of Graduation',
        description: 'Proof of graduation certification',
        price: 250.00,
        processing_time_hours: 72,
        requirements: ['Valid ID', 'Clearance Form'],
        max_copies: 3,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '9',
        organization_id: 'org1',
        name: 'Transfer Credentials',
        description: 'Complete transfer documentation package',
        price: 800.00,
        processing_time_hours: 120,
        requirements: ['Valid ID', 'Clearance Form', 'Exit Interview'],
        max_copies: 1,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '10',
        organization_id: 'org1',
        name: 'Authentication of Documents',
        description: 'Document authentication service',
        price: 150.00,
        processing_time_hours: 48,
        requirements: ['Valid ID', 'Original Document'],
        max_copies: 5,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '11',
        organization_id: 'org1',
        name: 'Certification of Grades',
        description: 'Term-specific grade certification',
        price: 150.00,
        processing_time_hours: 48,
        requirements: ['Valid ID'],
        max_copies: 3,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '12',
        organization_id: 'org1',
        name: 'Academic Calendar',
        description: 'Official academic calendar copy',
        price: 50.00,
        processing_time_hours: 24,
        requirements: ['Valid ID'],
        max_copies: 2,
        purpose_required: false,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '13',
        organization_id: 'org1',
        name: 'Student Handbook',
        description: 'Official student handbook copy',
        price: 100.00,
        processing_time_hours: 24,
        requirements: ['Valid ID'],
        max_copies: 1,
        purpose_required: false,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '14',
        organization_id: 'org1',
        name: 'Diploma Replacement',
        description: 'Replacement for lost/damaged diploma',
        price: 2000.00,
        processing_time_hours: 240,
        requirements: ['Valid ID', 'Affidavit of Loss', 'Police Report'],
        max_copies: 1,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '15',
        organization_id: 'org1',
        name: 'Enrollment History',
        description: 'Complete enrollment history record',
        price: 200.00,
        processing_time_hours: 72,
        requirements: ['Valid ID'],
        max_copies: 2,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '16',
        organization_id: 'org1',
        name: 'Special Study Permit',
        description: 'Permission for special study arrangements',
        price: 300.00,
        processing_time_hours: 96,
        requirements: ['Valid ID', 'Study Plan', 'Adviser Recommendation'],
        max_copies: 1,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '17',
        organization_id: 'org1',
        name: 'Certification of Latin Honors',
        description: 'Official certification of academic honors',
        price: 250.00,
        processing_time_hours: 72,
        requirements: ['Valid ID', 'TOR'],
        max_copies: 3,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '18',
        organization_id: 'org1',
        name: 'Student Organizations Certificate',
        description: 'Certification of student organization membership',
        price: 100.00,
        processing_time_hours: 48,
        requirements: ['Valid ID', 'Organization Endorsement'],
        max_copies: 2,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '19',
        organization_id: 'org1',
        name: 'Thesis/Dissertation Approval',
        description: 'Official approval documentation for thesis/dissertation',
        price: 500.00,
        processing_time_hours: 120,
        requirements: ['Valid ID', 'Adviser Approval', 'Department Clearance'],
        max_copies: 1,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '20',
        organization_id: 'org1',
        name: 'Comprehensive Exam Certificate',
        description: 'Certification of comprehensive examination results',
        price: 300.00,
        processing_time_hours: 72,
        requirements: ['Valid ID', 'Department Endorsement'],
        max_copies: 2,
        purpose_required: true,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

function createDocumentTypeStore() {
    const { subscribe, set, update } = writable<DocumentType[]>(mockData);

    return {
        subscribe,
        getAll: () => mockData,
        getById: (id: string) => mockData.find(doc => doc.id === id),
        addDocumentType: (doc: Omit<DocumentType, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
            const organization_id = 'org1'; // Default organization ID for mock data
            const newDoc = {
                ...doc,
                organization_id,
                id: crypto.randomUUID(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            update(docs => [...docs, newDoc]);
            return newDoc;
        },
        updateDocumentType: (id: string, updates: Partial<DocumentType>) => {
            update(docs => docs.map(doc => 
                doc.id === id 
                    ? { ...doc, ...updates, updated_at: new Date().toISOString() } 
                    : doc
            ));
        },
        deleteDocumentType: (id: string) => {
            update(docs => docs.filter(doc => doc.id !== id));
        }
    };
}

export const documentTypes = createDocumentTypeStore();