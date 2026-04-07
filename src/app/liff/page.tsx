'use client';

import { useState, useEffect } from 'react';
import { useLiff } from '@/lib/liff';
import styles from './liff.module.css';

interface EventForLiff {
  eventId: string;
  title: string;
  dateTime: string;
  location: string;
}

export default function LiffPage() {
  const { liff, isReady, error: liffError } = useLiff();
  const [events, setEvents] = useState<EventForLiff[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventForLiff | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Get LINE profile
  useEffect(() => {
    if (liff && isReady) {
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }
      liff.getProfile().then((profile) => {
        setUserName(profile.displayName);
      });
      // Get email from ID token if available
      const idToken = liff.getDecodedIDToken();
      if (idToken?.email) {
        setUserEmail(idToken.email);
      }
    }
  }, [liff, isReady]);

  // Fetch upcoming events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success) {
          const now = new Date();
          const upcoming = (data.data || [])
            .filter((e: EventForLiff) => new Date(e.dateTime) >= now)
            .sort((a: EventForLiff, b: EventForLiff) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
            .slice(0, 10);
          setEvents(upcoming);
          if (upcoming.length > 0) setSelectedEvent(upcoming[0]);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchEvents();
  }, []);

  const handleSubmit = async () => {
    if (!selectedEvent || status === null) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.eventId,
          email: userEmail,
          status,
          comment,
        }),
      });
      const data = await res.json();
      if (data.success) setSubmitted(true);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleReset = () => {
    setSubmitted(false);
    setStatus(null);
    setComment('');
  };

  if (liffError) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <p>LIFF初期化エラー</p>
          <p className={styles.errorDetail}>{liffError}</p>
        </div>
      </div>
    );
  }

  if (!isReady || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner} />
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>回答完了！</h2>
          <p className={styles.successText}>
            {selectedEvent?.title} の出欠を登録しました
          </p>
          <div className={styles.successStatus}>
            {status === 1 && '○ 出席'}
            {status === 2 && '△ 未定'}
            {status === 3 && '× 欠席'}
            {status === 4 && '⏰ 遅刻'}
          </div>
          {comment && <p className={styles.successComment}>💬 {comment}</p>}
          <button className={styles.resetBtn} onClick={handleReset}>
            別のイベントにも回答する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.brandRow}>
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#liff-grad)" />
              <path d="M14 24l6 6 14-14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="liff-grad" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#3b82f6"/><stop offset="1" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.brandText}>JCOP 出欠回答</span>
          </div>
          {userName && <p className={styles.userName}>👤 {userName}</p>}
        </div>

        {/* Event selector */}
        <div className={styles.section}>
          <label className={styles.label}>イベント</label>
          <select
            className={styles.select}
            value={selectedEvent?.eventId || ''}
            onChange={(e) => setSelectedEvent(events.find((ev) => ev.eventId === e.target.value) || null)}
          >
            {events.map((ev) => (
              <option key={ev.eventId} value={ev.eventId}>
                {ev.title} ({new Date(ev.dateTime).toLocaleDateString('ja-JP')})
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <div className={styles.eventInfo}>
            <span className={styles.eventDate}>📅 {new Date(selectedEvent.dateTime).toLocaleString('ja-JP')}</span>
            <span className={styles.eventLocation}>📍 {selectedEvent.location || '場所未定'}</span>
          </div>
        )}

        {/* Email input if not from LINE ID token */}
        {!userEmail && (
          <div className={styles.section}>
            <label className={styles.label}>メールアドレス</label>
            <input
              className={styles.input}
              type="email"
              placeholder="登録済みのGmailアドレス"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
        )}

        {/* Attendance buttons */}
        <div className={styles.section}>
          <label className={styles.label}>出欠</label>
          <div className={styles.statusGrid}>
            <button
              className={`${styles.statusBtn} ${styles.statusYes} ${status === 1 ? styles.statusActive : ''}`}
              onClick={() => setStatus(1)}
            >
              <span className={styles.statusIcon}>○</span>
              <span className={styles.statusText}>出席</span>
            </button>
            <button
              className={`${styles.statusBtn} ${styles.statusMaybe} ${status === 2 ? styles.statusActive : ''}`}
              onClick={() => setStatus(2)}
            >
              <span className={styles.statusIcon}>△</span>
              <span className={styles.statusText}>未定</span>
            </button>
            <button
              className={`${styles.statusBtn} ${styles.statusNo} ${status === 3 ? styles.statusActive : ''}`}
              onClick={() => setStatus(3)}
            >
              <span className={styles.statusIcon}>×</span>
              <span className={styles.statusText}>欠席</span>
            </button>
            <button
              className={`${styles.statusBtn} ${styles.statusLate} ${status === 4 ? styles.statusActive : ''}`}
              onClick={() => setStatus(4)}
            >
              <span className={styles.statusIcon}>⏰</span>
              <span className={styles.statusText}>遅刻</span>
            </button>
          </div>
        </div>

        {/* Comment */}
        <div className={styles.section}>
          <label className={styles.label}>コメント（任意）</label>
          <input
            className={styles.input}
            placeholder="例: 30分遅れます"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={status === null || submitting}
        >
          {submitting ? '送信中...' : '回答を送信'}
        </button>
      </div>

      <p className={styles.footer}>© 2026 昭島JC — JCOP v4.0</p>
    </div>
  );
}
