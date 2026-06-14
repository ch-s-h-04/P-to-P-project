import express from 'express';
import { getTurnCredentials } from '../services/turnCredentialService.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const credentials = getTurnCredentials();
    res.status(200).json(credentials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate TURN credentials' });
  }
});

export default router;
