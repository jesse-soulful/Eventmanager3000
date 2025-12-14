import { useState, useEffect, useRef } from 'react';
import { Paperclip, File, Eye, Trash2, X, ChevronDown } from 'lucide-react';
import { documentsApi } from '../lib/api';

interface Document {
  name: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

interface FileAttachmentsButtonProps {
  lineItemId: string;
  onUpdate?: () => void;
}

export function FileAttachmentsButton({ lineItemId, onUpdate }: FileAttachmentsButtonProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [lineItemId]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFiles(false);
      }
    };

    if (showFiles) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFiles]);

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
      setShowFiles(true); // Show files after upload
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
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
    return `/api/documents/file/${filename}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const fileCount = documents.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowFiles(!showFiles)}
        disabled={uploading || loading}
        className="relative p-2 rounded-full text-gray-600 hover:bg-gray-200 hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Attach files"
      >
        <Paperclip className="w-5 h-5" />
        {fileCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] font-bold text-white bg-primary-600 rounded-full">
            {fileCount}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {showFiles && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Files ({fileCount})
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-2 py-1 text-xs text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : '+ Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowFiles(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />

          {/* Files list */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-gray-500">Loading files...</div>
            ) : fileCount === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                No files attached. Click "+ Add" to upload files.
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate" title={doc.name}>
                          {doc.name}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {formatFileSize(doc.size)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <a
                        href={getFileUrl(doc.filename)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
                        title="View file"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



