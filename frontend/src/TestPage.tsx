import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          SwiftNotes Test Page
        </h1>
        <p className="text-gray-600 mb-4">
          If you can see this, the frontend is working correctly!
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">✅ React is working</p>
          <p className="text-sm text-gray-500">✅ Tailwind CSS is working</p>
          <p className="text-sm text-gray-500">✅ TypeScript is working</p>
        </div>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Test Button
        </button>
      </div>
    </div>
  );
};

export default TestPage;
