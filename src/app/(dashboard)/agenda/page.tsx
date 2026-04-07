'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './agenda.module.css';

interface EventOption {
  eventId: string;
  title: string;
  dateTime: string;
}

export default function AgendaPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [templateText, setTemplateText] = useState(DEFAULT_TEMPLATE);
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) setEvents(data.data || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const selectedEvent = events.find((e) => e.eventId === selectedEventId);

  const handleGenerate = async () => {
    if (!selectedEvent) return;
    setLoading(true);
    try {
      const res = await fetch('/api/agenda/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.eventId,
          title: selectedEvent.title,
          date: selectedEvent.dateTime,
          totalMembers: 40,
          templateText,
        }),
      });
      const data = await res.json();
      if (data.success) setGeneratedContent(data.data.content);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>📋 アジェンダ自動生成</h1>
          <p className={styles.pageSubtitle}>テンプレートに最新の出欠数・議案名を自動挿入</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Input panel */}
        <div className={`surface-card ${styles.panel}`}>
          <h2 className={styles.panelTitle}>設定</h2>

          <div className={styles.formGroup}>
            <label className="label">対象イベント</label>
            <select
              className="input select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">イベントを選択...</option>
              {events.map((e) => (
                <option key={e.eventId} value={e.eventId}>
                  {e.title} ({new Date(e.dateTime).toLocaleDateString('ja-JP')})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className="label">アジェンダテンプレート</label>
            <textarea
              className={`input textarea ${styles.templateArea}`}
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleGenerate}
            disabled={!selectedEventId || loading}
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                生成中...
              </>
            ) : (
              '🤖 アジェンダを生成'
            )}
          </button>
        </div>

        {/* Output panel */}
        <div className={`surface-card ${styles.panel}`}>
          <div className={styles.outputHeader}>
            <h2 className={styles.panelTitle}>生成結果</h2>
            {generatedContent && (
              <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copied ? '✓ コピー済み' : 'コピー'}
              </button>
            )}
          </div>
          {generatedContent ? (
            <pre className={styles.outputContent}>{generatedContent}</pre>
          ) : (
            <div className={styles.emptyOutput}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              </svg>
              <p>イベントを選択して「生成」をクリックしてください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_TEMPLATE = `===========================================
  委員会アジェンダ
===========================================

■ 会議名: {{会議タイトル}}
■ 開催日: {{開催日}}
■ 出席者: {{出席人数}} / {{総人数}}

-------------------------------------------
  1. 開会宣言
-------------------------------------------

-------------------------------------------
  2. 出席報告
    - 出席: {{出席人数}}名
    - 欠席: {{欠席人数}}名
-------------------------------------------

-------------------------------------------
  3. 上程議案
{{議案一覧}}
-------------------------------------------

-------------------------------------------
  4. 報告事項
-------------------------------------------

-------------------------------------------
  5. その他
-------------------------------------------

-------------------------------------------
  6. 閉会宣言
-------------------------------------------
`;
