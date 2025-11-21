import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline - Naly',
  description: 'You are currently offline',
};

export default function OfflinePage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mb-8 inline-block rounded-full bg-gray-200 p-6">
          <svg
            className="h-16 w-16 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          You&apos;re Offline
        </h1>

        <p className="mb-8 text-lg text-gray-600">
          It looks like you&apos;ve lost your internet connection.
          <br />
          Please check your network and try again.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center rounded-lg bg-black px-6 py-3 text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>

          <div className="text-sm text-gray-500">
            Tip: Some content may be available offline
          </div>
        </div>
      </div>
    </div>
  );
}
