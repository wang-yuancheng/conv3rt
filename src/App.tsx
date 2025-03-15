import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { FileEdit } from './components/FileEdit';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';
import { LogOut, FileSpreadsheet } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<FileRecord[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFileUploaded = (newFile: FileRecord) => {
    setFiles(prevFiles => [newFile, ...prevFiles]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                conv3rt
              </h1>
            </div>
            {user && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            {user ? (
              <Routes>
                <Route path="/" element={
                  <>
                    <FileUpload onFileUploaded={handleFileUploaded} />
                    <FileList files={files} setFiles={setFiles} />
                  </>
                } />
                <Route path="/edit/:fileId" element={<FileEdit />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            ) : (
              <Auth />
            )}
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;