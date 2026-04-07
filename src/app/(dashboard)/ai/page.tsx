'use client';

import { useState } from 'react';
import styles from './ai.module.css';

interface ParsedEvent {
  title: string;
  dateTime: string;
  location: string;
  category?: string;
  detail?: string;
}

export default function AiPage() {
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ParsedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState<Set<number>>(new Set());
  const [dragging, setDragging] = useState(false);

  const handleFileParse = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/ai/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) setResults(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleTextParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) setResults(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const registerEvent = async (event: ParsedEvent, index: number) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const data = await res.json();
      if (data.success) {
        setRegistered((prev) => new Set([...prev, index]));
      }
    } catch (err) { console.error(err); }
  };

  const registerAll = async () => {
    for (let i = 0; i < results.length; i++) {
      if (!registered.has(i)) {
        await registerEvent(results[i], i);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setMode('file');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <span className={styles.aiIcon}>✨</span>
            AI スケジュール解析
          </h1>
          <p className={styles.pageSubtitle}>資料やテキストからAIがイベント情報を自動抽出します</p>
        </div>
      </div>

      {/* Mode selector */}
      <div className={styles.modeSelector}>
        <button className={`${styles.modeBtn} ${mode === 'file' ? styles.modeBtnActive : ''}`} onClick={() => setMode('file')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
          ファイル解析
        </button>
        <button className={`${styles.modeBtn} ${mode === 'text' ? styles.modeBtnActive : ''}`} onClick={() => setMode('text')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          テキスト解析
        </button>
      </div>

      {/* Input area */}
      <div className={`surface-card ${styles.inputCard}`}>
        {mode === 'file' ? (
          <>
            <div
              className={`file-upload-zone ${dragging ? 'dragging' : ''} ${styles.uploadZone}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p className={styles.uploadTitle}>
                {file ? file.name : 'ファイルをドロップまたはクリック'}
              </p>
              <p className={styles.uploadHint}>PDF / Excel / PNG / JPEG 対応</p>
              <input id="file-input" type="file" accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg" style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleFileParse} disabled={!file || loading} style={{ marginTop: 'var(--space-4)', width: '100%' }}>
              {loading ? '解析中...' : '🤖 AIで解析する'}
            </button>
          </>
        ) : (
          <>
            <textarea
              className={`input textarea ${styles.textArea}`}
              placeholder="LINEの案内文や、スケジュール情報をペーストしてください...&#10;&#10;例:&#10;第1回例会のご案内&#10;日時：2026年5月15日（金）19:00〜&#10;場所：昭島市民交流センター 大会議室"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="btn btn-primary btn-lg" onClick={handleTextParse} disabled={!text.trim() || loading} style={{ marginTop: 'var(--space-4)', width: '100%' }}>
              {loading ? '解析中...' : '🤖 AIで解析する'}
            </button>
          </>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>解析結果</h2>
            <div className={styles.resultsActions}>
              <span className="badge badge-success">{results.length}件 検出</span>
              <button className="btn btn-primary btn-sm" onClick={registerAll}>
                すべて一括登録
              </button>
            </div>
          </div>
          <div className={styles.resultsGrid}>
            {results.map((event, i) => (
              <div key={i} className={`surface-card ${styles.resultCard} ${registered.has(i) ? styles.resultRegistered : ''}`}>
                {registered.has(i) && <div className={styles.registeredBadge}>✓ 登録済</div>}
                <h3 className={styles.resultTitle}>{event.title}</h3>
                <div className={styles.resultMeta}>
                  <span>📅 {event.dateTime}</span>
                  <span>📍 {event.location || '場所未定'}</span>
                  {event.category && <span className={`badge badge-primary`}>{event.category}</span>}
                </div>
                {event.detail && <p className={styles.resultDetail}>{event.detail}</p>}
                {!registered.has(i) && (
                  <button className="btn btn-secondary btn-sm" onClick={() => registerEvent(event, i)} style={{ marginTop: 'var(--space-3)' }}>
                    イベントとして登録
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
