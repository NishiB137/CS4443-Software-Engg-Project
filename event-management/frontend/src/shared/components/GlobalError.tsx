import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export const GlobalError: React.FC = () => {
  const error = useRouteError();
  console.error("Router Error Caught:", error);

  let errorMessage = 'An unexpected error occurred while loading this page.';
  
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-xl border border-red-100 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Oops! Something went wrong</h1>
        <p className="text-gray-600 mb-8 font-medium">
          {errorMessage}
        </p>
        <Link 
          to="/" 
          className="inline-flex justify-center items-center bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-hover transition w-full shadow-md"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Return Home
        </Link>
      </div>
    </div>
  );
};
