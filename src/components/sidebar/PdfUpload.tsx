'use client';

import { useState, useRef } from 'react';
import { useReaderStore } from '@/store/readerStore';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function PdfUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setContent } = useReaderStore();

  const handleFile = async (file: File) => {
    setError('');
    setFileName('');

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large (max 10MB)');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse/pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to parse PDF');
      }

      const data = await response.json();

      if (!data.words || data.words.length === 0) {
        throw new Error('No text found in PDF. It may be scanned/image-based.');
      }

      // Join words and set content with metadata
      const title = file.name.replace(/\.pdf$/i, '');
      setContent(data.words.join(' '), {
        title,
        source: 'pdf',
      });
      setFileName(`${file.name} (${data.words.length.toLocaleString()} words)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse PDF');
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
      <label className="text-sm text-gray-400">Upload PDF</label>

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
          accept="application/pdf"
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm">Drop PDF or click to upload</span>
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
        Note: Scanned PDFs (images) won&apos;t work - text must be selectable
      </p>
    </div>
  );
}
