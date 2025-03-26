import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, FileText, FileCheck, ArrowLeftRight } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  const shapes = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 60 + 20,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: Math.random() * 20 + 10
  }));

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_100%)]" />
        {shapes.map(shape => (
          <div
            key={shape.id}
            className="absolute rounded-full bg-gradient-to-br from-blue-200/20 to-indigo-200/20 blur-xl animate-float"
            style={{
              width: shape.size,
              height: shape.size,
              left: shape.left,
              top: shape.top,
              animationDelay: `${shape.delay}s`,
              animationDuration: `${shape.duration}s`
            }}
          />
        ))}
      </div>

      <nav className="bg-white shadow-sm relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <ArrowLeftRight className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                conv3rt
              </span>
            </div>
            <button
              onClick={() => navigate('/auth', { state: { mode: 'signin' } })}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative w-48 h-48 mx-auto mb-12">
            {/* Base platform with shadow */}
            <div className="absolute bottom-0 w-32 h-2 bg-black/10 rounded-full blur-xl mx-auto left-0 right-0" />
            
            {/* Floating documents stack */}
            <div className="absolute inset-0 animate-float" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
              {/* PDF Document */}
              <div className="absolute top-4 left-4 w-32 h-40 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-xl transform rotate-[-15deg] transition-transform hover:rotate-[-12deg]">
                <div className="absolute inset-1 bg-white rounded-lg p-3">
                  <FileText className="w-6 h-6 text-red-500 mb-2" />
                  <div className="space-y-2">
                    <div className="h-2 bg-red-100 rounded" />
                    <div className="h-2 bg-red-100 rounded w-2/3" />
                    <div className="h-2 bg-red-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
              
              {/* Arrow */}
              <div className="absolute top-16 left-24 w-12 h-12 text-blue-600 transform rotate-[30deg] animate-pulse">
                <FileCheck className="w-full h-full" />
              </div>

              {/* Excel Document */}
              <div className="absolute top-4 right-4 w-32 h-40 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-xl transform rotate-[15deg] transition-transform hover:rotate-[12deg]">
                <div className="absolute inset-1 bg-white rounded-lg p-3">
                  <FileSpreadsheet className="w-6 h-6 text-green-500 mb-2" />
                  <div className="space-y-2">
                    <div className="h-2 bg-green-100 rounded" />
                    <div className="h-2 bg-green-100 rounded w-3/4" />
                    <div className="h-2 bg-green-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Transform Your</span>
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Trial Balances
            </span>
          </h1>
          <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg max-w-2xl mx-auto">
            Streamline your workflow with our powerful conversion tool. Convert trial balances effortlessly and maintain data accuracy.
          </p>
          <div className="mt-8">
            <button
              onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
              className="px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};