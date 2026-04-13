"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

type MediaType = "text" | "image" | "audio" | "video" | "youtube";

interface MediaBlock {
  id?: number;
  media_type: MediaType;
  title: string;
  content_text: string;
  media_url: string;
  file_url?: string | null;
  order: number;
  file?: File | null;
}

interface Term {
  id?: number;
  term: string;
  definition: string;
  language: string;
  order: number;
  media_blocks?: Array<{
    id?: number;
    media_type: MediaType;
    title: string;
    content_text: string;
    media_url: string;
    file_url?: string | null;
    order: number;
  }>;
}

interface AccordionSection {
  id?: number;
  title: string;
  content: string;
  order: number;
}

const MEDIA_ICONS: Record<MediaType, string> = { text: "📝", image: "🖼", audio: "🔊", video: "🎬", youtube: "▶" };
const MEDIA_COLORS: Record<MediaType, string> = { text: "#6366f1", image: "#ec4899", audio: "#f59e0b", video: "#ef4444", youtube: "#ef4444" };
const MEDIA_ACCEPT: Record<MediaType, string> = { text: "", image: "image/*", audio: "audio/*", video: "video/*", youtube: "" };

export default function ContentEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentId = searchParams.get("id");
  const isEdit = !!contentId;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlock[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [accordions, setAccordions] = useState<AccordionSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState("");

  // Block insertion mode
  const [showInsertMenu, setShowInsertMenu] = useState(false);

  // Editing block
  const [editingBlockId, setEditingBlockId] = useState<number | string | null>(null);
  const [editBlockData, setEditBlockData] = useState<Partial<MediaBlock>>({});

  // Add term/section
  const [showAddTerm, setShowAddTerm] = useState(false);
  const [showAddAccordion, setShowAddAccordion] = useState(false);
  const [newTerm, setNewTerm] = useState({ term: "", definition: "", language: "bn" });
  const [newAccordion, setNewAccordion] = useState({ title: "", content: "" });

  // Term media block editing
  const [editingTermMedia, setEditingTermMedia] = useState<{ termIndex: number; show: boolean; type: MediaType; title: string; content_text: string; media_url: string }>({
    termIndex: -1, show: false, type: "text", title: "", content_text: "", media_url: ""
  });

  useEffect(() => {
    if (isEdit && contentId) {
      loadContent(parseInt(contentId));
    }
  }, [contentId]);

  const loadContent = async (id: number) => {
    try {
      const data = await api.getRichContent(id);
      setTitle(data.title);
      setContent(data.content || "");
      setIsPublished(data.is_published);

      // Load media blocks
      const blocks: MediaBlock[] = (data.media_blocks || []).map((b: any) => ({
        id: b.id,
        media_type: b.media_type,
        title: b.title,
        content_text: b.content_text || "",
        media_url: b.media_url || "",
        file_url: b.file_url || null,
        order: b.order,
      }));
      setMediaBlocks(blocks);

      // Load terms
      setTerms((data.terms || []).map((t: any, i: number) => ({ ...t, order: i })));

      // Load accordions
      setAccordions((data.accordion_sections || []).map((a: any, i: number) => ({ ...a, order: i })));
    } catch (err: any) {
      setError("Failed to load content: " + err.message);
    } finally {
      setFetching(false);
    }
  };

  const insertBlock = (type: MediaType) => {
    const newBlock: MediaBlock = {
      media_type: type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Block ${mediaBlocks.length + 1}`,
      content_text: type === "text" ? "<p>Start typing...</p>" : "",
      media_url: "",
      order: mediaBlocks.length,
    };
    setMediaBlocks([...mediaBlocks, newBlock]);
    setEditingBlockId(newBlock.order);
    setEditBlockData(newBlock);
    setShowInsertMenu(false);
  };

  const updateBlock = (index: number) => {
    const updated = [...mediaBlocks];
    updated[index] = { ...updated[index], ...editBlockData };
    setMediaBlocks(updated);
    setEditingBlockId(null);
    setEditBlockData({});
  };

  const removeBlock = (index: number) => {
    const updated = mediaBlocks.filter((_, i) => i !== index).map((b, i) => ({ ...b, order: i }));
    setMediaBlocks(updated);
    if (editingBlockId === index) {
      setEditingBlockId(null);
      setEditBlockData({});
    }
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === mediaBlocks.length - 1)) return;
    const updated = [...mediaBlocks];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    updated[index].order = index;
    updated[swapIndex].order = swapIndex;
    setMediaBlocks(updated);
  };

  const addTerm = () => {
    if (!newTerm.term.trim() || !newTerm.definition.trim()) return;
    setTerms([...terms, { ...newTerm, order: terms.length }]);
    setNewTerm({ term: "", definition: "", language: "bn" });
    setShowAddTerm(false);
  };

  const removeTerm = (index: number) => {
    setTerms(terms.filter((_, i) => i !== index).map((t, i) => ({ ...t, order: i })));
  };

  const addTermMediaBlock = (termIndex: number, type: MediaType) => {
    const updated = [...terms];
    const existingBlocks = updated[termIndex].media_blocks || [];
    updated[termIndex].media_blocks = [
      ...existingBlocks,
      {
        media_type: type,
        title: `${type.charAt(0).toUpperCase() + type.slice(type.length)} ${existingBlocks.length + 1}`,
        content_text: type === "text" ? "<p>Description or notes about this term</p>" : "",
        media_url: type === "youtube" ? "" : "",
        order: existingBlocks.length,
      }
    ];
    setTerms(updated);
  };

  const removeTermMediaBlock = (termIndex: number, blockIndex: number) => {
    const updated = [...terms];
    if (updated[termIndex].media_blocks) {
      updated[termIndex].media_blocks = updated[termIndex].media_blocks!.filter((_, i) => i !== blockIndex);
    }
    setTerms(updated);
  };

  const addAccordion = () => {
    if (!newAccordion.title.trim()) return;
    setAccordions([...accordions, { ...newAccordion, order: accordions.length }]);
    setNewAccordion({ title: "", content: "" });
    setShowAddAccordion(false);
  };

  const removeAccordion = (index: number) => {
    setAccordions(accordions.filter((_, i) => i !== index).map((a, i) => ({ ...a, order: i })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let contentIdToUse: number;
      let createdMediaBlocks: any[] = [];

      if (isEdit) {
        // Update existing content
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/courses/${contentId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            title,
            content,
            is_published: isPublished,
            media_blocks: mediaBlocks.filter(b => !b.id).map((b, i) => ({
              media_type: b.media_type,
              title: b.title,
              content_text: b.content_text,
              media_url: b.media_url,
              order: mediaBlocks.filter(bb => !bb.id).indexOf(b),
            })),
            terms,
            accordion_sections: accordions,
          }),
        });
        contentIdToUse = parseInt(contentId!);

        // Refetch to get updated media block IDs
        const updated = await api.getRichContent(contentIdToUse);
        createdMediaBlocks = updated.media_blocks || [];
      } else {
        // Create new content
        const result = await api.createRichContent({
          title,
          content,
          is_published: isPublished,
          media_blocks: mediaBlocks.map((b, i) => ({
            media_type: b.media_type,
            title: b.title,
            content_text: b.content_text,
            media_url: b.media_url,
            order: i,
          })),
          terms,
          accordion_sections: accordions,
        });
        contentIdToUse = result.id;
        createdMediaBlocks = result.media_blocks || [];
      }

      // Upload files for media blocks that have files
      for (let i = 0; i < mediaBlocks.length; i++) {
        const block = mediaBlocks[i];
        if (block.file) {
          const formData = new FormData();
          formData.append("media_file", block.file);

          // Find the created block ID (match by order)
          const createdBlock = createdMediaBlocks.find((cb: any) => cb.order === i);
          if (createdBlock && createdBlock.id) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/courses/${contentIdToUse}/media/${createdBlock.id}/`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
              body: formData,
            });
          }
        }
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save content");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !confirm("Are you sure you want to delete this content? This cannot be undone.")) return;
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/courses/${contentId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError("Failed to delete: " + err.message);
      setLoading(false);
    }
  };

  const renderBlockEditor = (block: MediaBlock, index: number) => {
    const isEditing = editingBlockId === index;
    const data = isEditing ? { ...block, ...editBlockData } : block;

    if (isEditing) {
      return (
        <div key={index} className="border-2 border-indigo-400 rounded-xl p-4 bg-white shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl" style={{ color: MEDIA_COLORS[block.media_type] }}>{MEDIA_ICONS[block.media_type]}</span>
              <span className="text-sm font-semibold text-indigo-700 capitalize">{block.media_type} Block</span>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => moveBlock(index, "up")} className="p-1 text-gray-400 hover:text-gray-600" title="Move up">↑</button>
              <button type="button" onClick={() => moveBlock(index, "down")} className="p-1 text-gray-400 hover:text-gray-600" title="Move down">↓</button>
            </div>
          </div>

          <input
            type="text"
            value={editBlockData.title || ""}
            onChange={(e) => setEditBlockData({ ...editBlockData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
            placeholder="Block title"
          />

          {block.media_type === "text" && (
            <textarea
              value={editBlockData.content_text || ""}
              onChange={(e) => setEditBlockData({ ...editBlockData, content_text: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-none"
              placeholder="<p>Your HTML content...</p>"
            />
          )}

          {block.media_type === "youtube" && (
            <input
              type="url"
              value={editBlockData.media_url || ""}
              onChange={(e) => setEditBlockData({ ...editBlockData, media_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="https://youtube.com/watch?v=..."
            />
          )}

          {["image", "audio", "video"].includes(block.media_type) && (
            <div className="space-y-2">
              <label className="block px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  accept={MEDIA_ACCEPT[block.media_type]}
                  onChange={(e) => setEditBlockData({ ...editBlockData, file: e.target.files?.[0] || null })}
                  className="hidden"
                />
                <span className="text-2xl block mb-1">{MEDIA_ICONS[block.media_type]}</span>
                <span className="text-xs text-gray-600">
                  {editBlockData.file ? editBlockData.file.name : "Click to upload file"}
                </span>
              </label>
              <input
                type="url"
                value={editBlockData.media_url || ""}
                onChange={(e) => setEditBlockData({ ...editBlockData, media_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder={`Or enter URL: https://example.com/${block.media_type}.mp4`}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={() => { setEditingBlockId(null); setEditBlockData({}); }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="button" onClick={() => updateBlock(index)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Save Block</button>
          </div>
        </div>
      );
    }

    // Preview mode
    return (
      <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-white hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl" style={{ color: MEDIA_COLORS[block.media_type] }}>{MEDIA_ICONS[block.media_type]}</span>
            <span className="text-sm font-medium text-gray-800">{block.title}</span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => moveBlock(index, "up")} className="p-1 text-gray-400 hover:text-gray-600">↑</button>
            <button type="button" onClick={() => moveBlock(index, "down")} className="p-1 text-gray-400 hover:text-gray-600">↓</button>
            <button type="button" onClick={() => { setEditingBlockId(index); setEditBlockData({}); }} className="p-1 text-blue-400 hover:text-blue-600" title="Edit">✏️</button>
            <button type="button" onClick={() => removeBlock(index)} className="p-1 text-red-400 hover:text-red-600" title="Delete">🗑️</button>
          </div>
        </div>

        {block.media_type === "text" && (
          <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: block.content_text || "No content" }} />
        )}

        {block.media_type === "youtube" && (
          block.media_url ? (
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-900">
              <iframe src={block.media_url.replace("watch?v=", "embed/")} className="w-full h-full" allowFullScreen />
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No YouTube URL set</p>
          )
        )}

        {block.media_type === "image" && (
          block.file_url || block.media_url ? (
            <img src={block.file_url || block.media_url} alt={block.title} className="w-full h-32 object-cover rounded-lg" />
          ) : (
            <p className="text-xs text-gray-400 italic">No image set</p>
          )
        )}

        {block.media_type === "audio" && (
          block.file_url || block.media_url ? (
            <audio controls className="w-full"><source src={block.file_url || block.media_url} /></audio>
          ) : (
            <p className="text-xs text-gray-400 italic">No audio file set</p>
          )
        )}

        {block.media_type === "video" && (
          block.file_url || block.media_url ? (
            <video controls className="w-full rounded-lg max-h-48"><source src={block.file_url || block.media_url} /></video>
          ) : (
            <p className="text-xs text-gray-400 italic">No video file set</p>
          )
        )}
      </div>
    );
  };

  if (fetching) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="py-5 px-6 shadow-md" style={{ background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 60%, #6366f1 100%)" }}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">{isEdit ? "Edit Content" : "Create Content"}</h1>
            <p className="text-indigo-200 text-sm mt-1">MS Word-like block editor</p>
          </div>
          <div className="flex gap-2">
            {isEdit && (
              <button type="button" onClick={handleDelete} disabled={loading}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
                🗑️ Delete
              </button>
            )}
            <button onClick={() => router.back()} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm">← Back</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

          {/* Title & Main Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full text-2xl font-bold border-none outline-none mb-4 placeholder-gray-300" placeholder="Content Title..." />
            <hr className="border-gray-200 mb-4" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5}
              className="w-full border-none outline-none resize-none text-sm leading-relaxed placeholder-gray-300"
              placeholder="Main content text (highlighted terms will be interactive)..." />
            <label className="flex items-center gap-2 mt-4">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-gray-600">Publish</span>
            </label>
          </div>

          {/* Media Blocks - MS Word Style */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Content Blocks</h3>

            {mediaBlocks.map((block, i) => renderBlockEditor(block, i))}

            {/* Insert Menu */}
            {showInsertMenu ? (
              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <p className="text-xs font-medium text-indigo-700 mb-2">Insert Block:</p>
                <div className="flex gap-2">
                  {(["text", "image", "audio", "video", "youtube"] as MediaType[]).map((type) => (
                    <button key={type} type="button" onClick={() => insertBlock(type)}
                      className="flex-1 py-2 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-center">
                      <span className="text-lg block">{MEDIA_ICONS[type]}</span>
                      <span className="text-xs capitalize">{type}</span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setShowInsertMenu(false)} className="mt-2 text-xs text-indigo-600 hover:text-indigo-800">Cancel</button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowInsertMenu(true)}
                className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-sm">
                + Insert Block (Text, Image, Audio, Video, YouTube)
              </button>
            )}
          </div>

          {/* Highlighted Terms */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Highlighted Terms ({terms.length})</h3>
              <button type="button" onClick={() => setShowAddTerm(!showAddTerm)} className="text-xs text-indigo-600 hover:text-indigo-800">+ Add</button>
            </div>

            {showAddTerm && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
                <input type="text" value={newTerm.term} onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Term (e.g., সন্দেহ)" />
                <input type="text" value={newTerm.definition} onChange={(e) => setNewTerm({ ...newTerm, definition: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Definition" />
                <div className="flex gap-2">
                  <button type="button" onClick={addTerm} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded">Add</button>
                  <button type="button" onClick={() => setShowAddTerm(false)} className="px-3 py-1 text-gray-600 text-xs">Cancel</button>
                </div>
              </div>
            )}

            {terms.map((t, termIndex) => (
              <div key={termIndex} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">{t.term}</span>
                    <span className="text-xs text-gray-500">{t.language}</span>
                  </div>
                  <button type="button" onClick={() => removeTerm(termIndex)} className="text-red-400 hover:text-red-600 text-xs">×</button>
                </div>
                <p className="text-xs text-gray-600 mb-3">{t.definition}</p>

                {/* Term Media Blocks */}
                <div className="space-y-2">
                  {(t.media_blocks || []).map((block, blockIndex) => (
                    <div key={blockIndex} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100 text-xs">
                      <span>{MEDIA_ICONS[block.media_type]}</span>
                      <span className="font-medium">{block.title}</span>
                      {block.media_url && <span className="text-gray-400 truncate">({block.media_url})</span>}
                      <button type="button" onClick={() => removeTermMediaBlock(termIndex, blockIndex)} className="ml-auto text-red-400 hover:text-red-600">×</button>
                    </div>
                  ))}
                </div>

                {/* Add Media to Term */}
                <div className="flex gap-1 mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-400 mr-1">+ Add media:</span>
                  {(["text", "image", "audio", "video", "youtube"] as MediaType[]).map((type) => (
                    <button key={type} type="button" onClick={() => addTermMediaBlock(termIndex, type)}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-xs hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                      {MEDIA_ICONS[type]} {type}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {terms.length === 0 && !showAddTerm && (
              <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm">No highlighted terms. Add interactive vocabulary words with media.</p>
              </div>
            )}
          </div>

          {/* Accordion Sections */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Accordion Sections ({accordions.length})</h3>
              <button type="button" onClick={() => setShowAddAccordion(!showAddAccordion)} className="text-xs text-indigo-600 hover:text-indigo-800">+ Add</button>
            </div>

            {showAddAccordion && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
                <input type="text" value={newAccordion.title} onChange={(e) => setNewAccordion({ ...newAccordion, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Section title" />
                <textarea value={newAccordion.content} onChange={(e) => setNewAccordion({ ...newAccordion, content: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" placeholder="Section content" />
                <div className="flex gap-2">
                  <button type="button" onClick={addAccordion} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded">Add</button>
                  <button type="button" onClick={() => setShowAddAccordion(false)} className="px-3 py-1 text-gray-600 text-xs">Cancel</button>
                </div>
              </div>
            )}

            {accordions.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded mb-2">
                <span className="text-sm">📂</span>
                <span className="text-sm font-medium text-gray-800">{a.title}</span>
                <button type="button" onClick={() => removeAccordion(i)} className="text-red-400 hover:text-red-600 text-xs ml-auto">×</button>
              </div>
            ))}
          </div>

          {/* Save */}
          <div className="flex justify-end gap-3 pb-8">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading || !title.trim()} className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Saving..." : isEdit ? "Update Content" : "Create Content"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
