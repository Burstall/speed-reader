'use client';

import { useState, useRef } from 'react';
import { useReaderStore } from '@/store/readerStore';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setContent } = useReaderStore();

  const handleFile = async (file: File) => {
    setError('');
    setFileName('');

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext !== 'pdf' && ext !== 'epub') {
      setError('Unsupported file type. Please upload a PDF or EPUB file.');
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

      const endpoint = ext === 'pdf' ? '/api/parse/pdf' : '/api/parse/epub';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to parse ${ext.toUpperCase()}`);
      }

      const data = await response.json();

      if (!data.words || data.words.length === 0) {
        throw new Error(
          ext === 'pdf'
            ? 'No text found in PDF. It may be scanned/image-based.'
            : 'No text found in EPUB.'
        );
      }

      if (ext === 'pdf') {
        const title = file.name.replace(/\.pdf$/i, '');
        setContent(data.words.join(' '), {
          title,
          source: 'pdf',
        });
      } else {
        const title = data.metadata?.title || file.name.replace(/\.epub$/i, '');
        setContent(data.words.join(' '), {
          title,
          source: 'epub',
          headings: data.headings,
        });
      }

      const displayTitle = ext === 'epub'
        ? (data.metadata?.title || file.name.replace(/\.epub$/i, ''))
        : file.name;
      setFileName(`${displayTitle} (${data.words.length.toLocaleString()} words)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to parse ${ext.toUpperCase()}`);
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
      <label className="text-sm text-gray-400">Upload File</label>

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
          accept=".pdf,.epub"
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
            <span className="text-sm">Drop file or click to upload</span>
            <span className="text-xs text-gray-600">Supports PDF and EPUB</span>
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
        Max 10MB. Scanned PDFs (images) won&apos;t work.
      </p>
    </div>
  );
}
