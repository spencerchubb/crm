import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function MarkdownEditor({ description, setDescription }) {
  const [mode, setMode] = useState('write');

  const buttonStyle = {
    padding: '4px 12px',
    fontSize: 14,
    background: 'none',
    border: 'solid 1px #444',
    borderRadius: 4,
    color: '#ddd',
    borderColor: '#666',
    cursor: 'pointer',
  };

  const activeButtonStyle = {
    ...buttonStyle,
    background: 'var(--indigo-900)',
    borderColor: 'var(--indigo-400)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          style={mode === 'write' ? activeButtonStyle : buttonStyle}
          onClick={() => setMode('write')}
        >
          Write
        </button>
        <button 
          style={mode === 'preview' ? activeButtonStyle : buttonStyle}
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