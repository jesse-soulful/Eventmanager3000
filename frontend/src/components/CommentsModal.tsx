import { useState, useEffect } from 'react';
import { commentsApi } from '../lib/api';
import type { Comment, CreateCommentInput } from '@event-management/shared';
import { X, MessageSquare, Send, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

interface CommentsModalProps {
  lineItemId: string;
  lineItemName: string;
  onClose: () => void;
  onCommentChange?: () => void; // Callback to refresh comment counts
}

export function CommentsModal({ lineItemId, lineItemName, onClose, onCommentChange }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [lineItemId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentsApi.getByLineItem(lineItemId);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await commentsApi.create({
        lineItemId,
        content: newComment.trim(),
      });
      setNewComment('');
      await loadComments();
      onCommentChange?.(); // Notify parent to refresh comment counts
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await commentsApi.update(commentId, {
        content: editContent.trim(),
      });
      setEditingCommentId(null);
      setEditContent('');
      await loadComments();
      onCommentChange?.(); // Notify parent to refresh comment counts
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsApi.delete(commentId);
      await loadComments();
      onCommentChange?.(); // Notify parent to refresh comment counts
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-2xl font-bold gradient-text">Comments</h2>
              <p className="text-sm text-gray-500 mt-1">{lineItemName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No comments yet. Be the first to add one!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-gray-700 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(comment.id)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-gray-200 whitespace-pre-wrap">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
                          {new Date(comment.updatedAt).getTime() !== new Date(comment.createdAt).getTime() && ' (edited)'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(comment)}
                          className="text-gray-400 hover:text-primary-400 transition-colors p-1"
                          title="Edit comment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors p-1"
                          title="Delete comment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <div className="border-t border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-3 border border-gray-700 bg-gray-900/50 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 resize-none placeholder-gray-500"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

