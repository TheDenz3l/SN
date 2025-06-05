import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Test adding auth store
import { useAuthStore } from './stores/authStore';

// Test adding services (removed direct Supabase import)
import { noteService } from './services/noteService';

// Test adding the suspected problematic component
// import NoteGenerationPage from './pages/NoteGenerationPage';

// Test individual imports from NoteGenerationPage dependencies
import EditableNoteSection from './components/EditableNoteSection';
// import WritingStyleConfidence from './components/WritingStyleConfidence';
// import writingAnalyticsService from './services/writingAnalyticsService';

// Test isolated component - DISABLED FOR NOW
// import TestWritingStyleConfidence from './TestWritingStyleConfidence';

// Test if basic components work
const HomePage = () => {
  const { user } = useAuthStore();

  // Test services connection
  const testServices = () => {
    console.log('Note service:', noteService);
  };

  return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        🎉 SwiftNotes Basic App
      </h1>
      <p className="text-gray-600 mb-4">
        Testing basic routing and components.
      </p>
      <div className="space-y-2 text-sm text-green-600">
        <p>✅ React Router working</p>
        <p>✅ Basic components working</p>
        <p>✅ Auth store working</p>
        <p>✅ Supabase client working</p>
        <p>✅ Note service working</p>
        <p>🔄 NoteGenerationPage import disabled</p>
        <p>✅ EditableNoteSection imported</p>
        <p>🔄 WritingStyleConfidence disabled</p>
        <p>🔄 writingAnalyticsService disabled</p>
        <p>✅ TestWritingStyleConfidence imported</p>
        <p>✅ User: {user ? user.email : 'Not logged in'}</p>
        <p>✅ Ready to add more features</p>
      </div>
      <div className="mt-6 space-y-2">
        <a 
          href="/login" 
          className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Test Login Page
        </a>
        <a
          href="/dashboard"
          className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
        >
          Test Dashboard
        </a>
        <button
          onClick={testSupabase}
          className="block w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
        >
          Test Supabase (Check Console)
        </button>
      </div>

      {/* Test isolated component - DISABLED FOR NOW */}
      <div className="mt-6 border-t pt-6">
        <div className="text-sm text-gray-500">
          <p>🔄 WritingStyleConfidence test disabled</p>
          <p>✅ Basic app working perfectly!</p>
        </div>
      </div>
    </div>
  </div>
  );
};

// Simple test pages
const LoginPage = () => (
  <div className="min-h-screen bg-blue-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
      <h1 className="text-2xl font-bold text-blue-900 mb-4">
        🔐 Login Page
      </h1>
      <p className="text-gray-600 mb-4">
        This is a placeholder login page.
      </p>
      <a 
        href="/" 
        className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
      >
        ← Back to Home
      </a>
    </div>
  </div>
);

const DashboardPage = () => (
  <div className="min-h-screen bg-green-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
      <h1 className="text-2xl font-bold text-green-900 mb-4">
        📊 Dashboard
      </h1>
      <p className="text-gray-600 mb-4">
        This is a placeholder dashboard page.
      </p>
      <a 
        href="/" 
        className="inline-block bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
      >
        ← Back to Home
      </a>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="min-h-screen bg-red-50 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
      <h1 className="text-2xl font-bold text-red-900 mb-4">
        ❌ Page Not Found
      </h1>
      <p className="text-gray-600 mb-4">
        The page you're looking for doesn't exist.
      </p>
      <a 
        href="/" 
        className="inline-block bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
      >
        ← Back to Home
      </a>
    </div>
  </div>
);

const MinimalWorkingApp: React.FC = () => {
  console.log('🚀 MinimalWorkingApp is rendering successfully!');
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default MinimalWorkingApp;
