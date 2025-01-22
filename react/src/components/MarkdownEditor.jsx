import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function MarkdownEditor({ description, setDescription }) {
  const [mode, setMode] = useState('write');

  const buttonStyle = {
    padding: '4px 12px',
    fontSize: 14,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className={mode === 'write' ? 'btnPrimary' : 'btnSecondary'}
          style={buttonStyle}
          onClick={() => setMode('write')}
        >
          Write
        </button>
        <button
          className={mode === 'preview' ? 'btnPrimary' : 'btnSecondary'}
          style={buttonStyle}
          onClick={() => setMode('preview')}
        >
          Preview
        </button>
      </div>

      {mode === 'write' ? (
        <textarea
          placeholder="Write description in Markdown"
          style={{ height: 200 }}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      ) : (
        <div style={{ 
          minHeight: 200,
          padding: 8,
          border: 'solid 1px #444',
          borderRadius: 4,
          color: '#ddd'
        }}>
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      )}
    </div>
  );
} 