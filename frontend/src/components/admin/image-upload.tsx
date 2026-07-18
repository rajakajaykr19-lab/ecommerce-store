'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface UploadedImage {
  url: string;
  filename: string;
}

interface ImageUploadProps {
  onUpload: (images: UploadedImage[]) => void;
  maxFiles?: number;
}

export function ImageUpload({ onUpload, maxFiles = 10 }: ImageUploadProps) {
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const newFiles = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type)
    );
    setPreviews((prev) => {
      const newPreviews = newFiles.map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
      }));
      return [...prev, ...newPreviews].slice(0, maxFiles);
    });
  }, [maxFiles]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    previews.forEach((p) => formData.append('images', p.file));

    try {
      const res = await fetch('/api/upload/product-images', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        onUpload(data.data);
        setPreviews([]);
      }
    } catch {
      console.error('Upload failed');
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          Drag & drop images here, or <span className="text-purple-600 font-medium">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP up to 10MB each (max {maxFiles})</p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previews.map((p, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border">
              <Image
                src={p.preview}
                alt={`Preview ${i + 1}`}
                width={150}
                height={150}
                className="object-cover w-full h-32"
              />
              <button
                onClick={() => removePreview(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-purple-600 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {previews.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Uploading...' : `Upload ${previews.length} Image${previews.length > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
}
