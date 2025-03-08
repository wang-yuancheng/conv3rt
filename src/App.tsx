import React from 'react';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">File Upload System</h1>
        <div className="flex flex-col items-center">
          <FileUpload />
          <FileList />
        </div>
      </div>
    </div>
  );
}

export default App;