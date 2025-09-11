import React from 'react';

export default function HealthPage() {
  return (
    <div>
      <h1>Service Health</h1>
      <p>Status: Healthy</p>
      <p>Service: Last Words Web</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}
