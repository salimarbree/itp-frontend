"use client";

import { useAuth } from "@/context/AuthContext";
import InteractiveTeachingPlatform from "@/components/InteractiveTeachingPlatform";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewId = searchParams.get("view");
  
  const [contents, setContents] = useState<any[]>([]);
  const [viewingContent, setViewingContent] = useState<number | undefined>(viewId ? parseInt(viewId) : undefined);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const data = await api.getRichContents();
        setContents(data.results || data);
        // If viewId is set and we have contents, set viewingContent
        if (viewId && data.results && data.results.length > 0) {
          setViewingContent(parseInt(viewId));
        }
      } catch (err) {
        console.error("Failed to fetch contents:", err);
      }
    };

    if (user) {
      fetchContents();
    }
  }, [user, viewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="py-6 px-6 shadow-md" style={{ background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 60%, #6366f1 100%)" }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Interactive Teaching Platform</h1>
            <p className="text-indigo-200 text-sm mt-1">Powered by Django REST Framework - MS Word-like Content Editor</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white font-medium">{user.first_name || user.username}</p>
              <p className="text-indigo-200 text-sm">{user.email}</p>
            </div>
            <button onClick={logout} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">My Content</h2>
          <div className="flex gap-2">
            <a href="/editor" className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm whitespace-nowrap">
              + Create Content
            </a>
          </div>
        </div>

        {/* Content List */}
        {contents.length > 0 && (
          <div className="grid gap-4 mb-8">
            {contents.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{c.title}</h3>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{c.media_blocks_count} media blocks</span>
                      <span>{c.author_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${c.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {c.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/editor?id=${c.id}`} className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
                      ✏️ Edit
                    </a>
                    <a href={`/dashboard?view=${c.id}`} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors">
                      👁️ View
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview */}
        {viewingContent && <InteractiveTeachingPlatform contentId={viewingContent} />}

        {contents.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📄</p>
            <p className="text-gray-600 mb-4">No content yet. Create your first interactive content!</p>
            <a href="/editor" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">
              + Create Content
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
