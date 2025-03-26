import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FileSelection } from './components/FileSelection';
import { FileUpload } from './components/FileUpload';
import { PDFUpload } from './components/PDFUpload';
import { FileList } from './components/FileList';
import { FileEdit } from './components/FileEdit';
import { Auth } from './components/Auth';
import { Landing } from './components/Landing';
import { supabase } from './lib/supabase';
import { LogOut, ArrowLeftRight, HelpCircle, X } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [showHelp, setShowHelp] = useState(false);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {user ? (
        <div className="relative z-50 py-6 px-4 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <ArrowLeftRight className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                conv3rt
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                <HelpCircle className="w-4 h-4" />
                Help
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-full max-w-4xl mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Streamline Your Trial Balance Workflow
                </span>
              </h2>
              <p className="text-gray-600 text-lg">
                Convert and process your financial documents with precision and ease
              </p>
            </div>
              <Routes>
                <Route path="/" element={
                  <FileSelection />
                } />
                <Route path="/upload-excel" element={
                  <>
                    <FileUpload onFileUploaded={handleFileUploaded} />
                    <FileList 
                      files={files} 
                      setFiles={setFiles} 
                      category="excel"
                      title="Excel Documents"
                      className="border-t pt-8"
                    />
                  </>
                } />
                <Route path="/upload-pdf" element={
                  <>
                    <PDFUpload onFileUploaded={handleFileUploaded} />
                    <FileList 
                      files={files} 
                      setFiles={setFiles} 
                      category="pdf"
                      title="PDF Documents"
                      className="border-t pt-8"
                    />
                  </>
                } />
                <Route path="/edit/:fileId" element={<FileEdit />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          </div>
        </div>
        </div>
        ) : (
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        )}
        
        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white shadow-xl max-w-2xl w-full rounded-lg">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">How to use conv3rt?</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <section>
                  <h3 className="text-lg font-medium mb-2">Getting Started</h3>
                  <p className="text-gray-600">Choose between Excel or PDF processing on the home page.</p>
                </section>
                
                <section>
                  <h3 className="text-lg font-medium mb-2">Excel Processing</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    <li>Upload your Excel trial balance file</li>
                    <li>Click "Reformat" to prepare the data</li>
                    <li>Click "Process" to analyze and classify the entries</li>
                    <li>Review and edit the results directly in the table - click any cell to modify its content</li>
                    <li>Download the processed file using the download button</li>
                  </ol>
                </section>
                
                <section>
                  <h3 className="text-lg font-medium mb-2">PDF Processing</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    <li>Upload your PDF trial balance document</li>
                    <li>Click "Convert to Excel" to extract the data</li>
                    <li>Follow the Excel processing steps above</li>
                  </ol>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;