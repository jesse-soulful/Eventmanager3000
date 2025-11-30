import { useState, useEffect, useRef } from 'react';
import { Paperclip, X, File, Eye, Trash2 } from 'lucide-react';
import { documentsApi } from '../lib/api';

interface Document {
  name: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

interface FileAttachmentsProps {
  lineItemId: string;
  onUpdate?: () => void;
}

export function FileAttachments({ lineItemId, onUpdate }: FileAttachmentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [lineItemId]);

  const loadDocuments = async () => {
    try {
      const response = await documentsApi.getByLineItem(lineItemId);
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      await documentsApi.upload(lineItemId, Array.from(files));
      await loadDocuments();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await documentsApi.delete(lineItemId, index);
      await loadDocuments();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const getFileUrl = (filename: string) => {
    // Use relative URL matching the API base URL pattern
    return `/api/documents/file/${filename}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="text-xs text-gray-500">Loading files...</div>;
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach file"
        >
          <Paperclip className="w-3 h-3" />
          <span>{uploading ? 'Uploading...' : 'Attach File'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        {documents.length > 0 && (
          <span className="text-xs text-gray-500">
            {documents.length} {documents.length === 1 ? 'file' : 'files'}
          </span>
        )}
      </div>

      {documents.length > 0 && (
        <div className="space-y-1">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs group hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 truncate flex-1" title={doc.name}>
                  {doc.name}
                </span>
                <span className="text-gray-500 text-[10px] flex-shrink-0">
                  {formatFileSize(doc.size)}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                <a
                  href={getFileUrl(doc.filename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-600 hover:text-primary-600 transition-colors"
                  title="View file"
                >
                  <Eye className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                  title="Delete file"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

