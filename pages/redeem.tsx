import { useState } from 'react';

export default function RedeemPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setPdfUrl(null);

    const res = await fetch('/api/redeem-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();

    if (res.ok && data.pdfUrl) {
      setPdfUrl(data.pdfUrl);
    } else {
      setError(data.error || 'Access code not found or doesn’t match your email.');
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        backgroundColor: '#3C5A78', // Blue
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FDF7F1', // Cream card background
          padding: '3rem',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '2rem', color: '#E84C3D', marginBottom: '1rem' }}>
          🎲 Redeem Your Dice Map
        </h1>
        <p style={{ fontSize: '1rem', color: '#333', marginBottom: '2rem' }}>
          Enter the email and access code from your confirmation email.
        </p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: '0.75rem',
            width: '100%',
            marginBottom: '1rem',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        />

        <input
          type="text"
          placeholder="Access code (e.g. ABC123)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={{
            padding: '0.75rem',
            width: '100%',
            marginBottom: '1.5rem',
            borderRadius: '6px',
            border: '1px solid #ccc',
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: '#E84C3D',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {loading ? 'Checking...' : 'Get My Dice Map'}
        </button>

        {error && (
          <p style={{ color: '#b91c1c', marginTop: '1.5rem', fontWeight: 'bold' }}>{error}</p>
        )}

        {pdfUrl && (
          <div style={{ marginTop: '2rem' }}>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <button
                style={{
                  backgroundColor: '#E84C3D',
                  color: '#fff',
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                }}
              >
                Download Dice Map PDF
              </button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
