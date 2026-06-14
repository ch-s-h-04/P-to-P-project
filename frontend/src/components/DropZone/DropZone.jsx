import React, { useCallback } from 'react';
import styles from './DropZone.module.css';

export default function DropZone() {
  const onDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      console.log('Dropped file:', file.name, file.size);
    }
  }, []);

  const onFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('Selected file:', file.name, file.size);
    }
  }, []);

  return (
    <div 
      className={styles.dropzone}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="space-y-2 text-center pointer-events-none">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-brand-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-300">
          Drag and drop your file here, or <span className="text-brand-400 font-semibold cursor-pointer pointer-events-auto">browse</span>
        </p>
        <p className="text-xs text-slate-500">
          Files are transferred directly without server storage.
        </p>
      </div>
      <input 
        type="file" 
        className="absolute inset-0 opacity-0 cursor-pointer" 
        onChange={onFileChange} 
      />
    </div>
  );
}
