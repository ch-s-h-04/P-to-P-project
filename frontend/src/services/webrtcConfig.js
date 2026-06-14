export const getWebRTCConfig = () => {
  const stunUrls = (import.meta.env.VITE_STUN_URLS || 'stun:stun.l.google.com:19302').split(',');
  
  return {
    iceServers: [
      {
        urls: stunUrls,
      },
    ],
    iceCandidatePoolSize: 10,
  };
};

export const DATA_CHANNEL_OPTIONS = {
  ordered: true, // Guarantees in-order arrival for simple file assembly
};
