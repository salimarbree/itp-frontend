"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type MediaType = "text" | "image" | "audio" | "video" | "youtube";

interface MediaBlockInput {
  media_type: MediaType;
  title: string;
  content_text: string;
  media_url: string;
  order: number;
  file?: File | null;
}

interface TermMediaBlockInput {
  media_type: MediaType;
  title: string;
  content_text: string;
  media_url: string;
  order: number;
  file?: File | null;
}

interface TermInput {
  term: string;
  definition: string;
  language: string;
  order: number;
  media_blocks?: TermMediaBlockInput[];
}

interface AccordionInput {
  title: string;
  content: string;
  order: number;
}

const MEDIA_ICONS: Record<MediaType, string> = {
  text: "📝",
  image: "🖼",
  audio: "🔊",
  video: "🎬",
  youtube: "▶",
};

const MEDIA_COLORS: Record<MediaType, string> = {
  text: "#6366f1",
  image: "#ec4899",
  audio: "#f59e0b",
  video: "#ef4444",
  youtube: "#ef4444",
};

const MEDIA_ACCEPT: Record<MediaType, string> = {
  text: "",
  image: "image/*",
  audio: "audio/*",
  video: "video/*",
  youtube: "",
};

export default function CreateContentPage() {
  const router = useRouter();

  // Main content
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // Media blocks
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlockInput[]>([]);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [newMediaType, setNewMediaType] = useState<MediaType>("text");
  const [newMediaTitle, setNewMediaTitle] = useState("");
  const [newMediaContentText, setNewMediaContentText] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);

  // Highlighted terms
  const [terms, setTerms] = useState<TermInput[]>([]);
  const [showTermForm, setShowTermForm] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newTermDef, setNewTermDef] = useState("");
  const [newTermLang, setNewTermLang] = useState("bn");
  const [expandedTermIndex, setExpandedTermIndex] = useState<number | null>(null);
  const [showTermMediaForm, setShowTermMediaForm] = useState<{[key: number]: boolean}>({});
  const [termMediaForms, setTermMediaForms] = useState<{[key: number]: {type: MediaType; title: string; content_text: string; media_url: string; file: File | null}}>({});

  // Accordion sections
  const [accordions, setAccordions] = useState<AccordionInput[]>([]);
  const [showAccordionForm, setShowAccordionForm] = useState(false);
  const [newAccordionTitle, setNewAccordionTitle] = useState("");
  const [newAccordionContent, setNewAccordionContent] = useState("");

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addMediaBlock = () => {
    if (!newMediaTitle.trim()) return;
    setMediaBlocks([
      ...mediaBlocks,
      {
        media_type: newMediaType,
        title: newMediaTitle,
        content_text: newMediaContentText,
        media_url: newMediaUrl,
        order: mediaBlocks.length,
        file: newMediaFile,
      },
    ]);
    setNewMediaTitle("");
    setNewMediaContentText("");
    setNewMediaUrl("");
    setNewMediaFile(null);
    setShowMediaForm(false);
  };

  const removeMediaBlock = (index: number) => {
    setMediaBlocks(mediaBlocks.filter((_, i) => i !== index));
  };

  const addTerm = () => {
    if (!newTerm.trim() || !newTermDef.trim()) return;
    setTerms([
      ...terms,
      { term: newTerm, definition: newTermDef, language: newTermLang, order: terms.length, media_blocks: [] },
    ]);
    setNewTerm("");
    setNewTermDef("");
    setShowTermForm(false);
  };

  const removeTerm = (index: number) => {
    setTerms(terms.filter((_, i) => i !== index));
  };

  const openTermMediaForm = (termIndex: number) => {
    setExpandedTermIndex(termIndex);
    setShowTermMediaForm(prev => ({...prev, [termIndex]: true}));
    setTermMediaForms(prev => ({
      ...prev,
      [termIndex]: { type: "image", title: "", content_text: "", media_url: "", file: null }
    }));
  };

  const closeTermMediaForm = (termIndex: number) => {
    setShowTermMediaForm(prev => ({...prev, [termIndex]: false}));
    setExpandedTermIndex(null);
  };

  const updateTermMediaForm = (termIndex: number, field: string, value: any) => {
    setTermMediaForms(prev => ({
      ...prev,
      [termIndex]: { ...(prev[termIndex] || { type: "image", title: "", content_text: "", media_url: "", file: null }), [field]: value }
    }));
  };

  const addTermMediaBlock = (termIndex: number) => {
    const form = termMediaForms[termIndex];
    if (!form || !form.title.trim()) return;
    
    const updatedTerms = [...terms];
    if (!updatedTerms[termIndex].media_blocks) {
      updatedTerms[termIndex].media_blocks = [];
    }
    updatedTerms[termIndex].media_blocks!.push({
      media_type: form.type,
      title: form.title,
      content_text: form.content_text,
      media_url: form.media_url,
      order: updatedTerms[termIndex].media_blocks!.length,
      file: form.file,
    });
    setTerms(updatedTerms);
    closeTermMediaForm(termIndex);
  };

  const removeTermMediaBlock = (termIndex: number, blockIndex: number) => {
    const updatedTerms = [...terms];
    if (updatedTerms[termIndex].media_blocks) {
      updatedTerms[termIndex].media_blocks = updatedTerms[termIndex].media_blocks!.filter((_, i) => i !== blockIndex);
    }
    setTerms(updatedTerms);
  };

  const addAccordion = () => {
    if (!newAccordionTitle.trim()) return;
    setAccordions([
      ...accordions,
      { title: newAccordionTitle, content: newAccordionContent, order: accordions.length },
    ]);
    setNewAccordionTitle("");
    setNewAccordionContent("");
    setShowAccordionForm(false);
  };

  const removeAccordion = (index: number) => {
    setAccordions(accordions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Create content with media blocks and terms (without files)
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
        terms: terms.map((t, i) => ({
          term: t.term,
          definition: t.definition,
          language: t.language,
          order: i,
          media_blocks: (t.media_blocks || []).map((mb, j) => ({
            media_type: mb.media_type,
            title: mb.title,
            content_text: mb.content_text,
            media_url: mb.media_url,
            order: j,
          })),
        })),
        accordion_sections: accordions,
      });

      const contentId = result.id;

      // Step 2: Upload files for main media blocks (use IDs from created content)
      const createdMediaBlocks = result.media_blocks || [];
      for (let i = 0; i < mediaBlocks.length; i++) {
        const block = mediaBlocks[i];
        const createdBlock = createdMediaBlocks[i];
        if (block.file && createdBlock) {
          const formData = new FormData();
          formData.append("media_file", block.file);
          formData.append("media_type", block.media_type);
          formData.append("title", block.title);
          formData.append("order", String(i));

          try {
            await api.uploadMediaBlock(contentId, createdBlock.id, formData);
          } catch (err) {
            console.error(`Failed to upload file for ${block.title}:`, err);
          }
        }
      }

      // Step 3: Upload files for term media blocks (use IDs from created terms)
      const createdTerms = result.terms || [];
      for (let i = 0; i < terms.length; i++) {
        const term = terms[i];
        const createdTerm = createdTerms[i];
        if (createdTerm && term.media_blocks) {
          const createdTermMediaBlocks = createdTerm.media_blocks || [];
          for (let j = 0; j < term.media_blocks.length; j++) {
            const mediaBlock = term.media_blocks[j];
            const createdTermBlock = createdTermMediaBlocks[j];
            if (mediaBlock.file && createdTermBlock) {
              const formData = new FormData();
              formData.append("media_file", mediaBlock.file);
              formData.append("media_type", mediaBlock.media_type);
              formData.append("title", mediaBlock.title);
              formData.append("order", String(j));

              try {
                await api.uploadTermMediaBlock(contentId, createdTerm.id, createdTermBlock.id, formData);
              } catch (err) {
                console.error(`Failed to upload file for term "${term.term}" media "${mediaBlock.title}":`, err);
              }
            }
          }
        }
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create content");
      setLoading(false);
    }
  };

  const renderMediaPreview = (block: MediaBlockInput) => {
    if (block.file) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg">{MEDIA_ICONS[block.media_type]}</span>
          <span className="text-xs text-green-600 truncate">
            ✓ {block.file.name} ({(block.file.size / 1024).toFixed(0)} KB)
          </span>
        </div>
      );
    }
    if (block.media_url) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg">{MEDIA_ICONS[block.media_type]}</span>
          <span className="text-xs text-gray-500 truncate">{block.media_url}</span>
        </div>
      );
    }
    if (block.content_text) {
      return <p className="text-xs text-gray-600 truncate">{block.content_text.substring(0, 80)}...</p>;
    }
    return <span className="text-xs text-gray-400">Empty - will show placeholder</span>;
  };

  const renderTermMediaPreview = (block: TermMediaBlockInput) => {
    if (block.file) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm">{MEDIA_ICONS[block.media_type]}</span>
          <span className="text-xs text-green-600 truncate">
            ✓ {block.file.name}
          </span>
        </div>
      );
    }
    if (block.media_url) {
      return <span className="text-xs text-gray-500 truncate">{block.media_url}</span>;
    }
    if (block.content_text) {
      return <span className="text-xs text-gray-500 truncate">{block.content_text.substring(0, 50)}...</span>;
    }
    return <span className="text-xs text-gray-400">Empty</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="py-6 px-6 shadow-md" style={{ background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 60%, #6366f1 100%)" }}>
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Content</h1>
            <p className="text-indigo-200 text-sm mt-1">MS Word-like editor with multimedia support</p>
          </div>
          <button onClick={() => router.back()} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium">
            ← Back
          </button>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">{error}</div>
          )}

          {/* Basic Info */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-indigo-600 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter content title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Content</label>
                <textarea
                  value={content} onChange={(e) => setContent(e.target.value)} rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  placeholder="Write your main content here... (Bengali text with highlighted terms supported)"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <span className="text-sm text-gray-700">Publish immediately</span>
              </label>
            </div>
          </section>

          {/* Media Blocks */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-indigo-600">Media Blocks ({mediaBlocks.length})</h2>
              <button type="button" onClick={() => setShowMediaForm(!showMediaForm)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                + Add Media
              </button>
            </div>

            {showMediaForm && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                {/* Media Type Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Media Type</label>
                  <div className="flex gap-2">
                    {(Object.keys(MEDIA_ICONS) as MediaType[]).map((type) => (
                      <button key={type} type="button" onClick={() => { setNewMediaType(type); setNewMediaFile(null); setNewMediaUrl(""); }}
                        className={`flex-1 py-3 rounded-lg text-center text-sm font-medium transition-all ${
                          newMediaType === type
                            ? "text-white shadow-md scale-105"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                        style={newMediaType === type ? { backgroundColor: MEDIA_COLORS[type] } : {}}>
                        <span className="block text-xl">{MEDIA_ICONS[type]}</span>
                        <span className="block text-xs capitalize mt-1">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input type="text" value={newMediaTitle} onChange={(e) => setNewMediaTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder={`e.g., My ${newMediaType} block`} />
                  </div>

                  {newMediaType === "text" && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text Content (HTML supported)</label>
                      <textarea value={newMediaContentText} onChange={(e) => setNewMediaContentText(e.target.value)} rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm"
                        placeholder="<p>Your <strong>formatted</strong> text here...</p>" />
                    </div>
                  )}

                  {newMediaType === "youtube" && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL</label>
                      <input type="url" value={newMediaUrl} onChange={(e) => setNewMediaUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="https://youtube.com/watch?v=..." />
                    </div>
                  )}

                  {(newMediaType === "image" || newMediaType === "audio" || newMediaType === "video") && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload {newMediaType.charAt(0).toUpperCase() + newMediaType.slice(1)} File
                      </label>
                      <label className="flex items-center justify-center px-6 py-10 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-colors">
                        <input
                          type="file"
                          accept={MEDIA_ACCEPT[newMediaType]}
                          onChange={(e) => setNewMediaFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <div className="text-center">
                          <span className="text-4xl mb-2 block">{MEDIA_ICONS[newMediaType]}</span>
                          <span className="text-sm font-medium text-gray-700">
                            {newMediaFile ? newMediaFile.name : `Click to upload ${newMediaType}`}
                          </span>
                          <span className="text-xs text-gray-400 block mt-1">
                            {newMediaType === "image" && "JPG, PNG, GIF, WebP"}
                            {newMediaType === "audio" && "MP3, WAV, OGG, M4A"}
                            {newMediaType === "video" && "MP4, WebM, AVI, MOV"}
                          </span>
                        </div>
                      </label>
                      {newMediaFile && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs text-green-700">
                            ✓ File selected: <strong>{newMediaFile.name}</strong> ({(newMediaFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Or provide a URL instead:</p>
                      <input type="url" value={newMediaUrl} onChange={(e) => setNewMediaUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
                        placeholder={`https://example.com/${newMediaType}.mp4`} />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowMediaForm(false); setNewMediaFile(null); }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                  <button type="button" onClick={addMediaBlock}
                    className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                    Add {MEDIA_ICONS[newMediaType]} {newMediaType} Block
                  </button>
                </div>
              </div>
            )}

            {/* Existing Media Blocks */}
            {mediaBlocks.length > 0 && (
              <div className="space-y-2">
                {mediaBlocks.map((block, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <span className="text-2xl" style={{ color: MEDIA_COLORS[block.media_type] }}>
                      {MEDIA_ICONS[block.media_type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{block.title}</p>
                      {renderMediaPreview(block)}
                    </div>
                    <button type="button" onClick={() => removeMediaBlock(i)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none px-2">×</button>
                  </div>
                ))}
              </div>
            )}

            {mediaBlocks.length === 0 && !showMediaForm && (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-4xl mb-2">📎</p>
                <p className="text-sm font-medium">No media blocks added yet</p>
                <p className="text-xs mt-1">Click "Add Media" to insert text, image, audio, video, or YouTube</p>
              </div>
            )}
          </section>

          {/* Highlighted Terms */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-indigo-600">Highlighted Terms ({terms.length})</h2>
              <button type="button" onClick={() => setShowTermForm(!showTermForm)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                + Add Term
              </button>
            </div>

            {showTermForm && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Term (e.g., Bengali word)</label>
                    <input type="text" value={newTerm} onChange={(e) => setNewTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="সন্দেহ" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select value={newTermLang} onChange={(e) => setNewTermLang(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="bn">Bengali (bn)</option>
                      <option value="en">English (en)</option>
                      <option value="hi">Hindi (hi)</option>
                      <option value="ar">Arabic (ar)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Definition</label>
                    <textarea value={newTermDef} onChange={(e) => setNewTermDef(e.target.value)} rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      placeholder="Definition in English..." />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => setShowTermForm(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                  <button type="button" onClick={addTerm}
                    className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Add Term</button>
                </div>
              </div>
            )}

            {terms.length > 0 && (
              <div className="space-y-3">
                {terms.map((t, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    {/* Term header */}
                    <div className="flex items-center gap-4 p-3">
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">{t.term}</span>
                      <span className="text-sm text-gray-600 truncate flex-1">{t.definition.substring(0, 80)}...</span>
                      <button type="button" onClick={() => openTermMediaForm(i)}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors">
                        + Add Media
                      </button>
                      <button type="button" onClick={() => removeTerm(i)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none px-2">×</button>
                    </div>

                    {/* Existing media blocks for this term */}
                    {t.media_blocks && t.media_blocks.length > 0 && (
                      <div className="px-3 pb-3 space-y-2">
                        {t.media_blocks.map((mb, bi) => (
                          <div key={bi} className="flex items-center gap-3 p-2 bg-white rounded border border-gray-100">
                            <span className="text-lg" style={{ color: MEDIA_COLORS[mb.media_type] }}>{MEDIA_ICONS[mb.media_type]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800">{mb.title}</p>
                              {mb.file ? (
                                <p className="text-xs text-green-600 truncate">✓ {mb.file.name}</p>
                              ) : mb.media_url ? (
                                <p className="text-xs text-gray-500 truncate">{mb.media_url}</p>
                              ) : mb.content_text ? (
                                <p className="text-xs text-gray-500 truncate">{mb.content_text.substring(0, 50)}...</p>
                              ) : null}
                            </div>
                            <button type="button" onClick={() => removeTermMediaBlock(i, bi)}
                              className="text-red-400 hover:text-red-600 text-sm">×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Term media form */}
                    {showTermMediaForm[i] && (
                      <div className="px-3 pb-3 border-t border-gray-200 pt-3 bg-white">
                        <div className="space-y-3">
                          {/* Media type selector */}
                          <div className="flex gap-2">
                            {(Object.keys(MEDIA_ICONS) as MediaType[]).map((type) => (
                              <button key={type} type="button"
                                onClick={() => updateTermMediaForm(i, "type", type)}
                                className={`flex-1 py-2 rounded text-center text-xs font-medium transition-all ${
                                  termMediaForms[i]?.type === type
                                    ? "text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                                style={termMediaForms[i]?.type === type ? { backgroundColor: MEDIA_COLORS[type] } : {}}>
                                <span className="block">{MEDIA_ICONS[type]}</span>
                                <span className="block capitalize">{type}</span>
                              </button>
                            ))}
                          </div>

                          {/* Title */}
                          <input type="text"
                            value={termMediaForms[i]?.title || ""}
                            onChange={(e) => updateTermMediaForm(i, "title", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Media title..." />

                          {/* Type-specific fields */}
                          {termMediaForms[i]?.type === "text" && (
                            <textarea
                              value={termMediaForms[i]?.content_text || ""}
                              onChange={(e) => updateTermMediaForm(i, "content_text", e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono"
                              placeholder="<p>Formatted text...</p>" />
                          )}

                          {termMediaForms[i]?.type === "youtube" && (
                            <input type="url"
                              value={termMediaForms[i]?.media_url || ""}
                              onChange={(e) => updateTermMediaForm(i, "media_url", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="https://youtube.com/watch?v=..." />
                          )}

                          {(termMediaForms[i]?.type === "image" || termMediaForms[i]?.type === "audio" || termMediaForms[i]?.type === "video") && (
                            <div>
                              <label className="flex items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-indigo-50 transition-colors">
                                <input type="file"
                                  accept={MEDIA_ACCEPT[termMediaForms[i]?.type || "image"]}
                                  onChange={(e) => updateTermMediaForm(i, "file", e.target.files?.[0] || null)}
                                  className="hidden" />
                                <div className="text-center">
                                  <span className="text-2xl block mb-1">{MEDIA_ICONS[termMediaForms[i]?.type || "image"]}</span>
                                  <span className="text-xs font-medium text-gray-700">
                                    {termMediaForms[i]?.file ? termMediaForms[i].file.name : `Upload ${termMediaForms[i]?.type}`}
                                  </span>
                                </div>
                              </label>
                              <p className="text-xs text-gray-500 mt-1">Or URL:</p>
                              <input type="url"
                                value={termMediaForms[i]?.media_url || ""}
                                onChange={(e) => updateTermMediaForm(i, "media_url", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
                                placeholder={`https://example.com/${termMediaForms[i]?.type}`} />
                            </div>
                          )}

                          {/* Buttons */}
                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                            <button type="button" onClick={() => closeTermMediaForm(i)}
                              className="px-4 py-2 text-xs text-gray-600 hover:text-gray-800">Cancel</button>
                            <button type="button" onClick={() => addTermMediaBlock(i)}
                              className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700">
                              Add {MEDIA_ICONS[termMediaForms[i]?.type || "image"]} Media
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {terms.length === 0 && !showTermForm && (
              <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm">No highlighted terms. Add interactive vocabulary words that users can click.</p>
              </div>
            )}
          </section>

          {/* Accordion Sections */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-indigo-600">Accordion Sections ({accordions.length})</h2>
              <button type="button" onClick={() => setShowAccordionForm(!showAccordionForm)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                + Add Section
              </button>
            </div>

            {showAccordionForm && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                    <input type="text" value={newAccordionTitle} onChange={(e) => setNewAccordionTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Introduction" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section Content</label>
                    <textarea value={newAccordionContent} onChange={(e) => setNewAccordionContent(e.target.value)} rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      placeholder="Section content..." />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => setShowAccordionForm(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                  <button type="button" onClick={addAccordion}
                    className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Add Section</button>
                </div>
              </div>
            )}

            {accordions.length > 0 && (
              <div className="space-y-2">
                {accordions.map((a, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-lg">📂</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{a.title}</p>
                      <p className="text-xs text-gray-500 truncate">{a.content.substring(0, 80)}...</p>
                    </div>
                    <button type="button" onClick={() => removeAccordion(i)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none px-2">×</button>
                  </div>
                ))}
              </div>
            )}

            {accordions.length === 0 && !showAccordionForm && (
              <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm">No accordion sections. Add expandable content sections.</p>
              </div>
            )}
          </section>

          {/* Submit */}
          <div className="flex justify-end gap-4 pb-12">
            <button type="button" onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()}
              className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Creating..." : "Create Content"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
