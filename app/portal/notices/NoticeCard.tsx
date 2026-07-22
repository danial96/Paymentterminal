"use client";

import { useState, useTransition } from "react";
import { toggleReaction, addComment, deleteComment, toggleCommentReaction } from "@/app/actions/hrm-notice-interactions";

const EMOJIS = ["👍", "❤️", "😂", "😮", "🙏", "👏"];

const TYPE_STYLES: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  POLICY: "bg-blue-100 text-blue-700",
  EVENT:  "bg-purple-100 text-purple-700",
  HR:     "bg-yellow-100 text-yellow-700",
  GENERAL:"bg-zinc-100 text-zinc-600",
};

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH:   "bg-orange-400",
  NORMAL: "bg-zinc-300",
  LOW:    "bg-zinc-200",
};

type Reaction = { id: number; emoji: string; employeeId: number; employeeName: string };
type Reply    = { id: number; content: string; createdAt: Date; employeeId: number; employeeName: string; reactions: Reaction[] };
type Comment  = { id: number; content: string; createdAt: Date; employeeId: number; employeeName: string; reactions: Reaction[]; replies: Reply[] };

// ── mini reaction row for a comment or reply ─────────────────────────────────
function ReactionRow({ reactions, onToggle, currentEmpId, isPending }: {
  reactions: Reaction[];
  onToggle: (emoji: string) => void;
  currentEmpId: number;
  isPending: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const map: Record<string, { count: number; names: string[]; mine: boolean }> = {};
  for (const r of reactions) {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, names: [], mine: false };
    map[r.emoji].count++;
    map[r.emoji].names.push(r.employeeName);
    if (r.employeeId === currentEmpId) map[r.emoji].mine = true;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
      {Object.entries(map).map(([emoji, d]) => (
        <button key={emoji} type="button" title={d.names.join(", ")}
          onClick={() => onToggle(emoji)} disabled={isPending}
          className={`flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs transition-all ${
            d.mine ? "border-[#29c0d5]/50 bg-[#29c0d5]/10 text-[#29c0d5]"
                   : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"}`}>
          <span>{emoji}</span><span className="font-medium">{d.count}</span>
        </button>
      ))}
      <div className="relative">
        <button type="button" onClick={() => setShowPicker(v => !v)}
          className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-100 transition-all">
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 z-30 flex gap-1 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
            {EMOJIS.map(e => (
              <button key={e} type="button"
                onClick={() => { setShowPicker(false); onToggle(e); }}
                className="rounded-lg p-1 text-base hover:bg-zinc-100 transition-colors">{e}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── single comment (or reply) ────────────────────────────────────────────────
function CommentItem({ c, currentEmpId, noticeId, isReply, isPending, startTransition }: {
  c: Comment | Reply;
  currentEmpId: number;
  noticeId: number;
  isReply: boolean;
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const initials = c.employeeName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    const text = replyText;
    setReplyText(""); setShowReply(false);
    startTransition(async () => { await addComment(noticeId, text, c.id); });
  }

  return (
    <div className={`flex items-start gap-2.5 ${isReply ? "ml-9 mt-2" : ""}`}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-xl rounded-tl-none border border-zinc-100 bg-zinc-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-xs font-semibold text-zinc-800">{c.employeeName}</p>
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-[10px] text-zinc-400">
                {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{" "}
                {new Date(c.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
              {c.employeeId === currentEmpId && (
                <button type="button" disabled={isPending}
                  onClick={() => startTransition(async () => { await deleteComment(c.id); })}
                  className="text-zinc-300 hover:text-red-400 transition-colors">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-zinc-700">{c.content}</p>
        </div>

        {/* Reactions + Reply on comment */}
        <div className="flex items-center gap-3 mt-1 pl-1">
          <ReactionRow
            reactions={c.reactions}
            onToggle={(emoji) => startTransition(async () => { await toggleCommentReaction(c.id, emoji); })}
            currentEmpId={currentEmpId}
            isPending={isPending}
          />
          {!isReply && (
            <button type="button" onClick={() => setShowReply(v => !v)}
              className="text-[11px] text-zinc-400 hover:text-zinc-600 font-medium transition-colors">
              Reply
            </button>
          )}
        </div>

        {/* Replies */}
        {"replies" in c && (c as Comment).replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {(c as Comment).replies.map(r => (
              <CommentItem key={r.id} c={r} currentEmpId={currentEmpId} noticeId={noticeId}
                isReply isPending={isPending} startTransition={startTransition} />
            ))}
          </div>
        )}

        {/* Reply input */}
        {showReply && (
          <form onSubmit={submitReply} className="flex items-center gap-2 mt-2 ml-0">
            <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder={`Reply to ${c.employeeName.split(" ")[0]}...`}
              autoFocus
              className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#29c0d5]/40 placeholder-zinc-400" />
            <button type="submit" disabled={!replyText.trim() || isPending}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}>
              Reply
            </button>
            <button type="button" onClick={() => setShowReply(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600">Cancel</button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── main NoticeCard ──────────────────────────────────────────────────────────
export function NoticeCard({ noticeId, title, content, publishedAt, type, priority, isNew, reactions, comments, currentEmployeeId }: {
  noticeId: number;
  title: string;
  content: string | null;
  publishedAt: Date | null;
  type: string;
  priority: string;
  isNew: boolean;
  reactions: Reaction[];
  comments: Comment[];
  currentEmployeeId: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPending, startTransition] = useTransition();

  const reactionMap: Record<string, { count: number; names: string[]; mine: boolean }> = {};
  for (const r of reactions) {
    if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { count: 0, names: [], mine: false };
    reactionMap[r.emoji].count++;
    reactionMap[r.emoji].names.push(r.employeeName);
    if (r.employeeId === currentEmployeeId) reactionMap[r.emoji].mine = true;
  }

  const totalComments = comments.reduce((s, c) => s + 1 + c.replies.length, 0);

  function handleReaction(emoji: string) {
    setShowEmojiPicker(false);
    startTransition(async () => { await toggleReaction(noticeId, emoji); });
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText("");
    startTransition(async () => { await addComment(noticeId, text); });
  }

  return (
    <div className={`rounded-xl border bg-white transition-shadow hover:shadow-sm ${isNew ? "border-[#29c0d5]/40" : "border-zinc-200"}`}>
      {/* Header */}
      <button type="button" onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_STYLES[type] ?? "bg-zinc-100 text-zinc-600"}`}>{type}</span>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[priority] ?? "bg-zinc-300"}`} />
            {isNew && <span className="rounded-full bg-[#29c0d5]/10 px-2 py-0.5 text-[10px] font-semibold text-[#29c0d5]">NEW</span>}
          </div>
          <p className="text-sm font-semibold text-zinc-900 leading-snug">{title}</p>
          {publishedAt && (
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {new Date(publishedAt).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
          {!expanded && content && <p className="text-xs text-zinc-500 mt-1.5 line-clamp-1">{content}</p>}
        </div>
        <svg className={`h-4 w-4 shrink-0 mt-1 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-5 pb-2">
          <div className="h-px bg-zinc-100 mb-4" />
          {content
            ? <p className="text-sm text-zinc-700 whitespace-pre-line leading-relaxed">{content}</p>
            : <p className="text-sm text-zinc-400 italic">No content provided.</p>}
        </div>
      )}

      {/* Reactions + Comments bar */}
      <div className="px-5 pb-4 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(reactionMap).map(([emoji, data]) => (
            <button key={emoji} type="button" title={data.names.join(", ")}
              onClick={() => handleReaction(emoji)} disabled={isPending}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all ${
                data.mine ? "border-[#29c0d5]/50 bg-[#29c0d5]/10 text-[#29c0d5]"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"}`}>
              <span>{emoji}</span><span className="font-medium">{data.count}</span>
            </button>
          ))}

          <div className="relative">
            <button type="button" onClick={() => setShowEmojiPicker(v => !v)}
              className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 transition-all">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              React
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-1 z-20 flex gap-1 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => handleReaction(e)}
                    className="rounded-lg p-1.5 text-lg hover:bg-zinc-100 transition-colors">{e}</button>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 transition-all">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {totalComments > 0 ? `${totalComments} Comment${totalComments !== 1 ? "s" : ""}` : "Comment"}
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-4 space-y-3">
            <div className="h-px bg-zinc-100" />

            {comments.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-2">No comments yet. Be the first!</p>
            )}

            {comments.map(c => (
              <CommentItem key={c.id} c={c} currentEmpId={currentEmployeeId}
                noticeId={noticeId} isReply={false} isPending={isPending}
                startTransition={startTransition} />
            ))}

            {/* New comment input */}
            <form onSubmit={handleComment} className="flex items-center gap-2 pt-1">
              <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#29c0d5]/40 placeholder-zinc-400" />
              <button type="submit" disabled={!commentText.trim() || isPending}
                className="rounded-full px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #29c0d5 0%, #503d98 100%)" }}>
                Post
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
