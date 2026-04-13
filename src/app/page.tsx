import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-500">
      <header className="bg-white/10 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">ITP</h1>
          <div className="flex gap-4">
            <Link href="/login" className="px-6 py-2 text-white hover:bg-white/20 rounded-lg transition-colors">Login</Link>
            <Link href="/register" className="px-6 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors">Register</Link>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20 text-center text-white">
        <h2 className="text-5xl font-bold mb-6">Interactive Teaching Platform</h2>
        <p className="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto">
          Learn with interactive multimedia content powered by Django REST Framework API
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/register" className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors text-lg">Get Started</Link>
          <Link href="/login" className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-lg">Login</Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">Rich Text Content</h3>
            <p className="text-indigo-100">Interactive articles with highlighted terms from Django API</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
            <div className="text-5xl mb-4">🎥</div>
            <h3 className="text-xl font-bold mb-2">Multimedia Support</h3>
            <p className="text-indigo-100">Text, images, audio, video, and YouTube embeds via API</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Interactive Learning</h3>
            <p className="text-indigo-100">Click terms to explore contextual multimedia from backend</p>
          </div>
        </div>
      </main>
    </div>
  );
}
