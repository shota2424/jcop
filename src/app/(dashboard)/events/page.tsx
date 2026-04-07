'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './events.module.css';

interface EventItem {
  eventId: string;
  title: string;
  dateTime: string;
  location: string;
  category: string;
  detail: string;
  documentUrl: string;
}

interface AttendanceItem {
  eventId: string;
  email: string;
  status: number;
  comment: string;
}

interface MemberItem {
  name: string;
  email: string;
  lineDisplayName: string;
}

interface MentionData {
  unrespondedCount: number;
  members: MemberItem[];
  mentionText: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [mentionData, setMentionData] = useState<MentionData | null>(null);
  const [mentionCopied, setMentionCopied] = useState(false);
  const [form, setForm] = useState({ title: '', dateTime: '', location: '', category: 'その他', detail: '' });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) setEvents(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const fetchEventDetail = async (event: EventItem) => {
    setSelectedEvent(event);
    setMentionData(null);
    try {
      const [attRes, memRes] = await Promise.all([
        fetch(`/api/attendances?eventId=${event.eventId}`),
        fetch('/api/members'),
      ]);
      const [attData, memData] = await Promise.all([attRes.json(), memRes.json()]);
      if (attData.success) setAttendances(attData.data || []);
      if (memData.success) setMembers(memData.data || []);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setForm({ title: '', dateTime: '', location: '', category: 'その他', detail: '' });
        fetchEvents();
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('このイベントを削除しますか？')) return;
    try {
      await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) { console.error(err); }
  };

  const handleMention = async () => {
    if (!selectedEvent) return;
    try {
      const res = await fetch('/api/mention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEvent.eventId, eventTitle: selectedEvent.title }),
      });
      const data = await res.json();
      if (data.success) setMentionData(data.data);
    } catch (err) { console.error(err); }
  };

  const copyMention = () => {
    if (mentionData?.mentionText) {
      navigator.clipboard.writeText(mentionData.mentionText);
      setMentionCopied(true);
      setTimeout(() => setMentionCopied(false), 2000);
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: return '○';
      case 2: return '△';
      case 3: return '×';
      case 4: return '遅';
      default: return '−';
    }
  };

  const getStatusClass = (status: number) => {
    switch (status) {
      case 1: return styles.statusYes;
      case 2: return styles.statusMaybe;
      case 3: return styles.statusNo;
      case 4: return styles.statusLate;
      default: return styles.statusNone;
    }
  };

  const respondedEmails = new Set(attendances.map((a) => a.email));
  const totalMembers = members.length;
  const yesCount = attendances.filter((a) => a.status === 1).length;
  const maybeCount = attendances.filter((a) => a.status === 2).length;
  const noCount = attendances.filter((a) => a.status === 3).length;
  const unrespondedCount = totalMembers - respondedEmails.size;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>イベント管理</h1>
          <p className={styles.pageSubtitle}>スケジュール管理と出欠確認</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          新規作成
        </button>
      </div>

      <div className={styles.layout}>
        {/* Event list */}
        <div className={`surface-card ${styles.listPanel}`}>
          <div className={styles.listHeader}>
            <h2 className={styles.listTitle}>イベント一覧</h2>
            <span className="badge badge-primary">{events.length}件</span>
          </div>
          {loading ? (
            <div className={styles.listBody}>
              {[1,2,3].map((i) => <div key={i} className={`skeleton ${styles.skeletonItem}`} />)}
            </div>
          ) : events.length === 0 ? (
            <div className={styles.emptyState}>
              <p>イベントがありません</p>
            </div>
          ) : (
            <div className={styles.listBody}>
              {events.map((event) => {
                const date = new Date(event.dateTime);
                const isSelected = selectedEvent?.eventId === event.eventId;
                return (
                  <button
                    key={event.eventId}
                    className={`${styles.eventRow} ${isSelected ? styles.eventRowActive : ''}`}
                    onClick={() => fetchEventDetail(event)}
                  >
                    <div className={styles.eventRowDate}>
                      <span className={styles.eventRowMonth}>{date.getMonth() + 1}/{date.getDate()}</span>
                      <span className={styles.eventRowTime}>{date.getHours().toString().padStart(2,'0')}:{date.getMinutes().toString().padStart(2,'0')}</span>
                    </div>
                    <div className={styles.eventRowInfo}>
                      <span className={styles.eventRowTitle}>{event.title}</span>
                      <span className={styles.eventRowLocation}>{event.location || '場所未定'}</span>
                    </div>
                    <span className={`badge badge-${getCategoryColor(event.category)}`}>{event.category}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className={styles.detailPanel}>
          {selectedEvent ? (
            <>
              <div className={`surface-card ${styles.detailCard}`}>
                <div className={styles.detailHeader}>
                  <div>
                    <h2 className={styles.detailTitle}>{selectedEvent.title}</h2>
                    <div className={styles.detailMeta}>
                      <span>📅 {new Date(selectedEvent.dateTime).toLocaleString('ja-JP')}</span>
                      <span>📍 {selectedEvent.location || '場所未定'}</span>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedEvent.eventId)}>削除</button>
                </div>
                {selectedEvent.detail && (
                  <p className={styles.detailText}>{selectedEvent.detail}</p>
                )}
              </div>

              {/* Attendance overview */}
              <div className={`surface-card ${styles.attendanceCard}`}>
                <h3 className={styles.attendanceTitle}>出欠状況</h3>
                <div className={styles.attendanceStats}>
                  <div className={`${styles.attStat} ${styles.attYes}`}>
                    <span className={styles.attStatValue}>{yesCount}</span>
                    <span className={styles.attStatLabel}>○ 出席</span>
                  </div>
                  <div className={`${styles.attStat} ${styles.attMaybe}`}>
                    <span className={styles.attStatValue}>{maybeCount}</span>
                    <span className={styles.attStatLabel}>△ 未定</span>
                  </div>
                  <div className={`${styles.attStat} ${styles.attNo}`}>
                    <span className={styles.attStatValue}>{noCount}</span>
                    <span className={styles.attStatLabel}>× 欠席</span>
                  </div>
                  <div className={`${styles.attStat} ${styles.attNone}`}>
                    <span className={styles.attStatValue}>{unrespondedCount}</span>
                    <span className={styles.attStatLabel}>未回答</span>
                  </div>
                </div>

                {/* Progress bar */}
                {totalMembers > 0 && (
                  <div className={styles.progressContainer}>
                    <div className={styles.progressLabel}>
                      <span>回答率</span>
                      <span>{Math.round((respondedEmails.size / totalMembers) * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${(respondedEmails.size / totalMembers) * 100}%` }} />
                    </div>
                  </div>
                )}

                {/* Member list */}
                <div className={styles.memberList}>
                  {members.map((member) => {
                    const att = attendances.find((a) => a.email === member.email);
                    return (
                      <div key={member.email} className={styles.memberRow}>
                        <div className="avatar avatar-sm">{member.name.charAt(0)}</div>
                        <span className={styles.memberName}>{member.name}</span>
                        <span className={`${styles.statusBadge} ${getStatusClass(att?.status ?? 0)}`}>
                          {getStatusIcon(att?.status ?? 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mention launcher */}
              <div className={`surface-card ${styles.mentionCard}`}>
                <div className={styles.mentionHeader}>
                  <h3 className={styles.mentionTitle}>🔔 メンションランチャー</h3>
                  <button className="btn btn-primary btn-sm" onClick={handleMention}>
                    未回答者を抽出
                  </button>
                </div>
                {mentionData && (
                  <div className={styles.mentionResult}>
                    <p className={styles.mentionCount}>未回答: {mentionData.unrespondedCount}名</p>
                    <pre className={styles.mentionText}>{mentionData.mentionText}</pre>
                    <button className="btn btn-secondary btn-sm" onClick={copyMention}>
                      {mentionCopied ? '✓ コピー済み' : 'クリップボードにコピー'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`surface-card ${styles.emptyDetail}`}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
              <p>イベントを選択してください</p>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新規イベント作成</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className={styles.formGroup}>
                <label className="label">件名 *</label>
                <input className="input" placeholder="例: 1月例会" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label className="label">日時 *</label>
                <input className="input" type="datetime-local" value={form.dateTime} onChange={(e) => setForm({...form, dateTime: e.target.value})} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label">場所</label>
                  <input className="input" placeholder="例: 市民交流センター" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className="label">カテゴリ</label>
                  <select className="input select" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                    <option>例会</option><option>理事会</option><option>委員会</option><option>研修</option><option>懇親会</option><option>その他</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className="label">詳細</label>
                <textarea className="input textarea" placeholder="補足情報を入力..." value={form.detail} onChange={(e) => setForm({...form, detail: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!form.title || !form.dateTime}>作成</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryColor(cat: string): string {
  switch (cat) {
    case '例会': return 'primary';
    case '理事会': return 'warning';
    case '委員会': return 'info';
    case '研修': return 'success';
    case '懇親会': return 'danger';
    default: return 'primary';
  }
}
