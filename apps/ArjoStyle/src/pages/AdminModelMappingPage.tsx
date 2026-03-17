import React from 'react';
import ModelMappingEditor from '../components/admin/ModelMappingEditor';

const AdminModelMappingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage 3D model body part mappings for the tattoo booking application.
          </p>
        </div>
        
        <ModelMappingEditor />
      </div>
    </div>
  );
};

export default AdminModelMappingPage;
