"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface MediaBlock {
  id: string;
  media_type: string;
  media_type_display: string;
  title: string;
  content_text: string;
  media_url: string;
  file_url?: string | null;
  order: number;
}

interface Term {
  id: string;
  term: string;
  definition: string;
  language: string;
  order: number;
  media_blocks?: Array<{
    id: number;
    media_type: string;
    media_type_display: string;
    title: string;
    content_text: string;
    media_url: string;
    file_url?: string | null;
    order: number;
  }>;
}

interface ContentSection {
  type: "text" | "audio" | "video" | "image" | "youtube" | "highlighted";
  content?: string;
  mediaBlock?: MediaBlock;
}

interface AccordionSection {
  id: string;
  title: string;
  content: string;
}

interface PreviewData {
  title: string;
  content: string;
  media_blocks: MediaBlock[];
  terms: Term[];
  accordion_sections: AccordionSection[];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MediaCard({ item }: { item: MediaBlock }) {
  const [open, setOpen] = useState(false);

  const getColor = () => {
    const colors: Record<string, string> = {
      text: "#6366f1",
      image: "#ec4899",
      audio: "#f59e0b",
      video: "#ef4444",
      youtube: "#ef4444",
    };
    return colors[item.media_type] || "#6366f1";
  };

  const getIcon = () => {
    const icons: Record<string, string> = {
      text: "A",
      image: "🖼",
      audio: "🔊",
      video: "🎬",
      youtube: "▶",
    };
    return icons[item.media_type] || "📄";
  };

  const renderContent = () => {
    switch (item.media_type) {
      case "text":
        return <p className="text-sm leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: item.content_text }} />;
      case "image":
        return (
          <div className="flex flex-col items-center gap-2">
            {item.file_url ? (
              <img src={item.file_url} alt={item.title} className="w-full h-32 object-cover rounded-lg" />
            ) : item.media_url ? (
              <img src={item.media_url} alt={item.title} className="w-full h-32 object-cover rounded-lg" />
            ) : (
              <div className="w-full h-32 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-4xl">🌄</div>
            )}
            <p className="text-xs text-gray-500">{item.title}</p>
          </div>
        );
      case "audio":
        return (
          <div className="flex flex-col gap-2">
            {item.file_url || item.media_url ? (
              <audio controls className="w-full">
                <source src={item.file_url || item.media_url} />
                Your browser does not support audio.
              </audio>
            ) : (
              <div className="flex items-center gap-3 bg-amber-50 rounded-lg p-3">
                <button className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white text-sm">▶</button>
                <div className="flex-1 h-1.5 bg-amber-200 rounded-full">
                  <div className="w-1/3 h-full bg-amber-500 rounded-full" />
                </div>
                <span className="text-xs text-amber-700">{item.title}</span>
              </div>
            )}
          </div>
        );
      case "video":
        return (
          <div className="w-full">
            {item.file_url || item.media_url ? (
              <video controls className="w-full rounded-lg max-h-64">
                <source src={item.file_url || item.media_url} />
                Your browser does not support video.
              </video>
            ) : (
              <div className="w-full h-32 rounded-lg bg-gray-900 flex items-center justify-center text-white text-3xl cursor-pointer hover:opacity-90 transition-opacity">▶</div>
            )}
          </div>
        );
      case "youtube":
        return (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-900">
            {item.media_url ? (
              <iframe
                src={item.media_url.replace("watch?v=", "embed/")}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-xl">▶</div>
                  <span className="text-xs opacity-70">{item.title}</span>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-sm text-gray-700">{item.content_text}</p>;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all text-sm font-medium text-gray-700 w-full"
      >
        <span className="text-base w-5 text-center" style={{ color: getColor() }}>{getIcon()}</span>
        <span>{item.title}</span>
        <span className="ml-auto text-gray-400 text-xs">🔍</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-20 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: getColor() }}>
              {item.media_type_display}
            </span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>
          {renderContent()}
        </div>
      )}
    </div>
  );
}

function HighlightedText({
  text,
  terms,
  mediaBlocks,
}: {
  text: string;
  terms: Term[];
  mediaBlocks: MediaBlock[];
}) {
  const [activeTerm, setActiveTerm] = useState<string | null>(null);

  if (!text && !terms?.length && !mediaBlocks?.length) {
    return <p className="text-sm leading-loose text-gray-400 italic">No content yet.</p>;
  }

  // Parse content into sections: text, media markers, and highlighted terms
  // Media markers format: [media:type:id] or simple markers like [audio], [video], [image], [youtube], [text]
  const parseContent = (): ContentSection[] => {
    const sections: ContentSection[] = [];
    let remaining = text || "";

    // Pattern matches: [media:type:id] or [audio], [video], [image], [youtube], [text]
    const markerPattern = /\[media:(\w+):(\w+)\]|\[(audio|video|image|youtube|text)\]/g;
    
    let lastIndex = 0;
    let match;

    while ((match = markerPattern.exec(remaining)) !== null) {
      // Add text before marker
      if (match.index > lastIndex) {
        const textBefore = remaining.slice(lastIndex, match.index);
        sections.push({ type: "text", content: textBefore });
      }

      // Parse marker
      const mediaType = match[1] || match[3]; // Either from [media:type:id] or [type]
      const mediaId = match[2]; // Only from [media:type:id]

      if (mediaId) {
        // Find the media block by id
        const block = mediaBlocks.find((m) => m.id === mediaId || m.id.toString() === mediaId);
        if (block) {
          sections.push({ type: mediaType as ContentSection["type"], mediaBlock: block });
        } else {
          // ID not found, render as text
          sections.push({ type: "text", content: match[0] });
        }
      } else {
        // Simple marker like [audio] - find first matching media block by type
        const matchingBlock = mediaBlocks.find((m) => m.media_type === mediaType);
        if (matchingBlock) {
          sections.push({ type: mediaType as ContentSection["type"], mediaBlock: matchingBlock });
        } else {
          // No matching block, render placeholder
          sections.push({ type: mediaType as ContentSection["type"], mediaBlock: {
            id: mediaType,
            media_type: mediaType,
            media_type_display: mediaType.charAt(0).toUpperCase() + mediaType.slice(1),
            title: mediaType.charAt(0).toUpperCase() + mediaType.slice(1),
            content_text: "",
            media_url: "",
            order: 0,
          } as MediaBlock });
        }
      }

      lastIndex = markerPattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < remaining.length) {
      sections.push({ type: "text", content: remaining.slice(lastIndex) });
    }

    // If no markers found at all, treat entire text as one section
    if (sections.length === 0) {
      sections.push({ type: "text", content: remaining });
    }

    return sections;
  };

  const renderMediaInline = (block: MediaBlock) => {
    switch (block.media_type) {
      case "text":
        return (
          <span className="inline-block my-1 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100 text-xs text-gray-700 align-middle">
            <strong className="text-indigo-600 mr-1">📝 {block.title}:</strong>
            <span dangerouslySetInnerHTML={{ __html: block.content_text }} />
          </span>
        );
      case "image":
        return (
          <span className="inline-block my-1 align-middle">
            {block.file_url || block.media_url ? (
              <img src={block.file_url || block.media_url} alt={block.title} className="h-24 w-auto max-w-48 object-cover rounded-lg border border-gray-200" />
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-50 rounded-lg border border-pink-200 text-xs text-pink-600">🖼 {block.title}</span>
            )}
          </span>
        );
      case "audio":
        return (
          <span className="inline-block my-1 align-middle">
            {block.file_url || block.media_url ? (
              <audio controls className="h-8 w-64">
                <source src={block.file_url || block.media_url} />
                Your browser does not support audio.
              </audio>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">🔊 {block.title}</span>
            )}
          </span>
        );
      case "video":
        return (
          <span className="inline-block my-1 align-middle">
            {block.file_url || block.media_url ? (
              <video controls className="h-32 w-auto max-w-64 rounded-lg bg-gray-900 border border-gray-200">
                <source src={block.file_url || block.media_url} />
                Your browser does not support video.
              </video>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200 text-xs text-red-600">🎬 {block.title}</span>
            )}
          </span>
        );
      case "youtube":
        return (
          <span className="inline-block my-1 align-middle">
            {block.media_url ? (
              <div className="w-64 h-36 rounded-lg overflow-hidden bg-gray-900 border border-gray-200">
                <iframe
                  src={block.media_url.replace("watch?v=", "embed/").replace("/youtu.be/", "/youtube/embed/")}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200 text-xs text-red-600">▶ {block.title}</span>
            )}
          </span>
        );
      default:
        return null;
    }
  };

  const sections = parseContent();

  return (
    <div className="text-sm leading-loose text-gray-700 relative">
      {sections.map((section, i) => {
        if (section.type === "text") {
          // Still process highlighted terms within text sections
          return <HighlightedTextWithTerms key={i} text={section.content || ""} terms={terms} activeTerm={activeTerm} setActiveTerm={setActiveTerm} />;
        }
        
        // Render media inline
        if (section.mediaBlock) {
          return <div key={i}>{renderMediaInline(section.mediaBlock)}</div>;
        }
        
        return null;
      })}
    </div>
  );
}

// Sub-component for rendering text with highlighted terms
function HighlightedTextWithTerms({
  text,
  terms,
  activeTerm,
  setActiveTerm,
}: {
  text: string;
  terms: Term[];
  activeTerm: string | null;
  setActiveTerm: (term: string | null) => void;
}) {
  if (!terms || terms.length === 0) {
    return <span>{text}</span>;
  }

  interface HighlightRange {
    start: number;
    end: number;
    term: Term;
  }

  const ranges: HighlightRange[] = [];
  for (const term of terms) {
    let idx = 0;
    while (true) {
      const found = text.indexOf(term.term, idx);
      if (found === -1) break;
      ranges.push({ start: found, end: found + term.term.length, term });
      idx = found + 1;
    }
  }

  ranges.sort((a, b) => a.start - b.start);

  const segments: Array<{ text: string; term: Term | null }> = [];
  let lastIdx = 0;
  for (const range of ranges) {
    if (range.start > lastIdx) {
      segments.push({ text: text.slice(lastIdx, range.start), term: null });
    }
    segments.push({ text: text.slice(range.start, range.end), term: range.term });
    lastIdx = range.end;
  }
  if (lastIdx < text.length) {
    segments.push({ text: text.slice(lastIdx), term: null });
  }

  const renderMediaBlock = (block: any) => {
    switch (block.media_type) {
      case "text":
        return (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-700">{block.title}</p>
            <p className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: block.content_text }} />
          </div>
        );
      case "image":
        return (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-700">{block.title}</p>
            {block.file_url || block.media_url ? (
              <img src={block.file_url || block.media_url} alt={block.title} className="w-full h-auto max-h-48 object-cover rounded" />
            ) : (
              <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">No image</div>
            )}
          </div>
        );
      case "audio":
        return (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-700">{block.title}</p>
            {block.file_url || block.media_url ? (
              <audio controls className="w-full">
                <source src={block.file_url || block.media_url} />
                Your browser does not support audio.
              </audio>
            ) : (
              <div className="w-full h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">No audio</div>
            )}
          </div>
        );
      case "video":
        return (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-700">{block.title}</p>
            {block.file_url || block.media_url ? (
              <video controls className="w-full rounded max-h-48">
                <source src={block.file_url || block.media_url} />
                Your browser does not support video.
              </video>
            ) : (
              <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">No video</div>
            )}
          </div>
        );
      case "youtube":
        return (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-700">{block.title}</p>
            {block.media_url ? (
              <div className="aspect-video w-full rounded overflow-hidden bg-gray-900">
                <iframe
                  src={block.media_url.replace("watch?v=", "embed/").replace("/youtu.be/", "/youtube/embed/")}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">No YouTube video</div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.term) {
          return (
            <span key={i} className="relative inline-block">
              <button
                type="button"
                onClick={() => setActiveTerm(activeTerm === seg.term!.term ? null : seg.term!.term)}
                className="font-bold text-red-500 underline decoration-dotted cursor-pointer hover:text-red-600 transition-colors px-0.5"
              >
                {seg.text}
              </button>
              <span className="ml-0.5 text-xs text-red-400 align-super">🔍</span>
              {activeTerm === seg.term.term && (
                <span className="absolute bottom-full left-0 mb-2 z-10 w-80 bg-white border border-indigo-200 shadow-xl rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-gray-100 bg-indigo-50">
                    <span className="font-bold text-indigo-600 text-base">{seg.term.term}</span>
                    <br />
                    <span className="text-xs text-gray-600">{seg.term.definition}</span>
                  </div>
                  {seg.term.media_blocks && seg.term.media_blocks.length > 0 && (
                    <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
                      {seg.term.media_blocks.map((block, bi) => (
                        <div key={bi} className="pb-2 border-b border-gray-100 last:border-b-0">
                          {renderMediaBlock(block)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-3 pb-2 border-t border-gray-100">
                    <button type="button" onClick={() => setActiveTerm(null)} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1">✕ close</button>
                  </div>
                </span>
              )}
            </span>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function InteractiveTeachingPlatform({ contentId }: { contentId?: number }) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const id = contentId || 1;
        const data = await api.getRichContentPreview(id);
        setPreviewData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [contentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        <p className="font-semibold">Error loading content</p>
        <p className="text-sm">{error}</p>
        <p className="text-xs mt-2 text-gray-600">Make sure Django backend is running and content exists</p>
      </div>
    );
  }

  if (!previewData) {
    return <div className="text-gray-600">No content found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header
        className="py-10 px-6 text-center"
        style={{
          background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 60%, #6366f1 100%)",
        }}
      >
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          {previewData.title}
        </h1>
        <p className="text-indigo-200 text-sm">
          Click on highlighted terms to explore multimedia content
        </p>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Multimedia Content Examples */}
          {previewData.media_blocks.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-indigo-600 mb-1">
                Multimedia Content Examples
              </h2>
              <hr className="border-indigo-100 mb-5" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previewData.media_blocks.slice(0, 4).map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
              </div>
              {previewData.media_blocks.length > 4 && (
                <div className="mt-3 w-40">
                  <MediaCard item={previewData.media_blocks[4]} />
                </div>
              )}
            </section>
          )}

          {/* News Article / Main Content */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-indigo-600 mb-1">
              Interactive Content
            </h2>
            <hr className="border-indigo-100 mb-5" />
            {(previewData.terms.length > 0 || previewData.media_blocks.length > 0) ? (
              <HighlightedText 
                text={previewData.content} 
                terms={previewData.terms} 
                mediaBlocks={previewData.media_blocks} 
              />
            ) : (
              <p className="text-sm leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: previewData.content }} />
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {previewData.accordion_sections.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-base font-bold text-gray-800 mb-4">
                Expandable Content
              </h2>
              <AccordionSectionComponent sections={previewData.accordion_sections} />
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

// Accordion Section Component
function AccordionSectionComponent({ sections }: { sections: AccordionSection[] }) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id || null);

  return (
    <div className="flex flex-col gap-2">
      {sections.map((section) => {
        const isOpen = openId === section.id;
        return (
          <div key={section.id} className="rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : section.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
            >
              <span>{section.title}</span>
              <span className="text-lg leading-none">{isOpen ? "∧" : "∨"}</span>
            </button>
            {isOpen && (
              <div className="px-4 py-3 bg-indigo-50 border border-indigo-100 text-sm text-gray-700 leading-relaxed">
                {section.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
