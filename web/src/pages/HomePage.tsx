export function HomePage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Vitafolio
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Your personal collection management system
      </p>
      <div className="space-x-4">
        <a
          href="/collections"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Collections
        </a>
      </div>
    </div>
  );
}
