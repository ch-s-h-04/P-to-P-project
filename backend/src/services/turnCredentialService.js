import crypto from 'crypto';
import { TURN_SECRET, TURN_SERVER_URL } from '../config/env.js';

export function getTurnCredentials() {
  const unixTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity
  const username = `${unixTimestamp}:p2p-web-share`;
  
  const hmac = crypto.createHmac('sha1', TURN_SECRET);
  hmac.update(username);
  const credential = hmac.digest('base64');

  return {
    urls: [TURN_SERVER_URL],
    username,
    credential,
    ttl: 3600
  };
}
