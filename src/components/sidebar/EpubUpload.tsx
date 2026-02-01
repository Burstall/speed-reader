'use client';

import { useState, useRef } from 'react';
import { useReaderStore } from '@/store/readerStore';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function EpubUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setContent } = useReaderStore();

  const handleFile = async (file: File) => {
    setError('');
    setFileName('');

    if (!file.name.endsWith('.epub')) {
      setError('Please upload an EPUB file');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File too large (max 10MB)');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse/epub', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to parse EPUB');
      }

      const data = await response.json();

      if (!data.words || data.words.length === 0) {
        throw new Error('No text found in EPUB.');
      }

      const title = data.metadata?.title || file.name.replace(/\.epub$/i, '');
      setContent(data.words.join(' '), {
        title,
        source: 'epub',
        headings: data.headings,
      });
      setFileName(`${title} (${data.words.length.toLocaleString()} words)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse EPUB');
      setFileName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm text-gray-400">Upload EPUB</label>

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex flex-col items-center justify-center
          h-32 border-2 border-dashed rounded-lg cursor-pointer
          transition-colors
          ${isDragging
            ? 'border-white bg-gray-800'
            : 'border-gray-700 hover:border-gray-500'
          }
          ${isLoading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub"
          onChange={handleInputChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Processing...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sm">Drop EPUB or click to upload</span>
            <span className="text-xs text-gray-600">Max 10MB</span>
          </div>
        )}
      </div>

      {/* Status */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {fileName && !error && (
        <p className="text-sm text-green-500 truncate">{fileName}</p>
      )}

      <p className="text-xs text-gray-600">
        Supports standard EPUB files with text content
      </p>
    </div>
  );
}
