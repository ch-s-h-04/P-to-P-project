import React, { useCallback, useRef } from 'react';
import styles from './DropZone.module.css';
import useSocket from '../../hooks/useSocket';
import { useRoomStore } from '../../store/roomStore';
import { useTransferStore } from '../../store/transferStore';

export default function DropZone() {
  const { createRoom } = useSocket();
  const setFileMeta = useRoomStore((s) => s.setFileMeta);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    useRoomStore.getState().setFile(file);
    
    useTransferStore.getState().setStatus('hashing');
    
    let fileHash = '';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      useTransferStore.getState().setLocalHash(fileHash);
    } catch (err) {
      console.error('Error hashing file:', err);
    }

    useTransferStore.getState().setStatus('idle');

    const fileMeta = {
      name: file.name,
      size: file.size,
      type: file.type,
      hash: fileHash,
    };
    setFileMeta(fileMeta);
    createRoom(fileMeta);
  }, [createRoom, setFileMeta]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    handleFile(file);
    // Reset so the same file can be re-selected if needed
    e.target.value = '';
  }, [handleFile]);

  const onBrowseClick = useCallback(() => {
    inputRef.current?.click();
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-300">
          Drag and drop your file here, or{' '}
          <span
            className="text-brand-400 font-semibold cursor-pointer pointer-events-auto"
            onClick={onBrowseClick}
          >
            browse
          </span>
        </p>
        <p className="text-xs text-slate-500">
          Files are transferred directly without server storage.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={onFileChange}
      />
    </div>
  );
}
