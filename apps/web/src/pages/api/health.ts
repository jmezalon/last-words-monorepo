import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Health check endpoint for DAST scanning
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'last-words-web',
    version: process.env.npm_package_version || '1.0.0'
  });
}
