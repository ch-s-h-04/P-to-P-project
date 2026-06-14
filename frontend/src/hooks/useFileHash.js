import { useState } from 'react';

export default function useFileHash() {
  const [hash, setHash] = useState(null);
  const [isHashing, setIsHashing] = useState(false);

  const calculateHash = async (file) => {
    setIsHashing(true);
    console.log('SubtleCrypto SHA-256 calculation for:', file.name);
    setHash('placeholder-sha256-hash-value');
    setIsHashing(false);
  };

  return {
    hash,
    isHashing,
    calculateHash
  };
}
