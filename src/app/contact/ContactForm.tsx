'use client';

import { useState } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

export function ContactForm({ accessKey }: { accessKey: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 13px',
    borderRadius: 'var(--r-sm)',
    border: '1px solid var(--line-2)',
    background: 'var(--surface)',
    color: 'var(--ink)',
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 700,
    fontSize: 13,
    color: 'var(--ink-2)',
    marginBottom: 6,
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setError('');

    const form = e.currentTarget;
    const data = new FormData(form);
    data.append('access_key', accessKey);
    data.append('subject', 'New message from everyfouryears.futbol');
    data.append('from_name', 'everyfouryears.futbol contact form');

    try {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
        setError(json.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setError('Network error. Please try again in a moment.');
    }
  }

  if (status === 'success') {
    return (
      <div
        style={{
          background: 'var(--live-soft)',
          border: '1px solid var(--live)',
          borderRadius: 'var(--r-md)',
          padding: '22px 24px',
          color: 'var(--live-ink)',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>
          Message sent
        </div>
        <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 14.5 }}>
          Thanks for reaching out. We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Honeypot — bots fill this, humans never see it */}
      <input
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="name" style={labelStyle}>
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="email" style={labelStyle}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="message" style={labelStyle}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
        />
      </div>

      {status === 'error' && (
        <div
          style={{
            background: 'var(--danger-soft)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--r-sm)',
            padding: '10px 13px',
            color: 'var(--danger)',
            fontSize: 13.5,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{
          background: 'var(--navy)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          padding: '12px 24px',
          borderRadius: 'var(--r-sm)',
          border: 'none',
          cursor: status === 'submitting' ? 'default' : 'pointer',
          opacity: status === 'submitting' ? 0.6 : 1,
          transition: 'opacity .15s',
        }}
      >
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
