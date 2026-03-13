export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-3xl text-center">
        <h1 className="text-6xl font-bold mb-6 text-balance">
          Where stories live
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          A modern blog platform for writers and readers. Share your thoughts,
          discover new perspectives, and connect with a community of storytellers.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:opacity-80 transition">
            Start Writing
          </button>
          <button className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition">
            Sign In
          </button>
        </div>
      </div>
    </main>
  )
}
