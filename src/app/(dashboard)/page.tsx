'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './home.module.css';

interface DashboardEvent {
  eventId: string;
  title: string;
  dateTime: string;
  location: string;
  category: string;
}

interface DashboardMember {
  name: string;
  email: string;
  role: string;
  committee: string;
}

interface DashboardBill {
  billId: string;
  title: string;
  status: string;
  deadline: string;
}

export default function DashboardHome() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [members, setMembers] = useState<DashboardMember[]>([]);
  const [bills, setBills] = useState<DashboardBill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [evRes, memRes, billRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/members'),
        fetch('/api/bills'),
      ]);
      const [evData, memData, billData] = await Promise.all([
        evRes.json(),
        memRes.json(),
        billRes.json(),
      ]);
      if (evData.success) setEvents(evData.data || []);
      if (memData.success) setMembers(memData.data || []);
      if (billData.success) setBills(billData.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.dateTime) >= now);
  const pendingBills = bills.filter((b) => b.status !== 'submitted');

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div className={`${styles.skeletonTitle} skeleton`} />
        </div>
        <div className={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${styles.skeletonCard} skeleton`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>ダッシュボード</h1>
        <p className={styles.pageSubtitle}>昭島青年会議所 運用プラットフォーム</p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`glass-card stat-card ${styles.statBlue}`}>
          <div className={`stat-icon ${styles.iconBlue}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="stat-value">{members.length}</div>
          <div className="stat-label">現役メンバー</div>
        </div>

        <div className={`glass-card stat-card ${styles.statGreen}`}>
          <div className={`stat-icon ${styles.iconGreen}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
          </div>
          <div className="stat-value">{upcomingEvents.length}</div>
          <div className="stat-label">今後のイベント</div>
        </div>

        <div className={`glass-card stat-card ${styles.statAmber}`}>
          <div className={`stat-icon ${styles.iconAmber}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
          </div>
          <div className="stat-value">{pendingBills.length}</div>
          <div className="stat-label">未提出議案</div>
        </div>

        <div className={`glass-card stat-card ${styles.statPurple}`}>
          <div className={`stat-icon ${styles.iconPurple}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
          </div>
          <div className="stat-value">AI</div>
          <div className="stat-label">Gemini 連携中</div>
        </div>
      </div>

      {/* Two column layout */}
      <div className={styles.twoCol}>
        {/* Upcoming Events */}
        <div className={`surface-card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📅 直近のイベント</h2>
            <a href="/events" className="btn btn-ghost btn-sm">すべて見る →</a>
          </div>
          <div className={styles.eventList}>
            {upcomingEvents.length === 0 ? (
              <p className={styles.emptyText}>予定されているイベントはありません</p>
            ) : (
              upcomingEvents.slice(0, 5).map((event) => {
                const date = new Date(event.dateTime);
                const month = date.getMonth() + 1;
                const day = date.getDate();
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return (
                  <a href={`/events?id=${event.eventId}`} key={event.eventId} className={styles.eventItem}>
                    <div className={styles.eventDate}>
                      <span className={styles.eventMonth}>{month}月</span>
                      <span className={styles.eventDay}>{day}</span>
                    </div>
                    <div className={styles.eventInfo}>
                      <span className={styles.eventTitle}>{event.title}</span>
                      <span className={styles.eventMeta}>
                        {hours}:{minutes} · {event.location || '場所未定'}
                      </span>
                    </div>
                    <span className={`badge badge-${getCategoryBadge(event.category)}`}>
                      {event.category || 'その他'}
                    </span>
                  </a>
                );
              })
            )}
          </div>
        </div>

        {/* Pending Bills */}
        <div className={`surface-card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📋 議案ステータス</h2>
            <a href="/bills" className="btn btn-ghost btn-sm">すべて見る →</a>
          </div>
          <div className={styles.billList}>
            {pendingBills.length === 0 ? (
              <p className={styles.emptyText}>未提出の議案はありません</p>
            ) : (
              pendingBills.slice(0, 5).map((bill) => (
                <div key={bill.billId} className={styles.billItem}>
                  <div className={styles.billInfo}>
                    <span className={styles.billTitle}>{bill.title}</span>
                    <span className={styles.billDeadline}>期限: {bill.deadline || '未設定'}</span>
                  </div>
                  <span className={`badge ${getStatusBadge(bill.status)}`}>
                    {getStatusLabel(bill.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`surface-card ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>⚡ クイックアクション</h2>
        </div>
        <div className={styles.quickActions}>
          <a href="/events" className={styles.actionCard}>
            <div className={`${styles.actionIcon} ${styles.iconBlue}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>
            </div>
            <span className={styles.actionLabel}>イベント作成</span>
          </a>
          <a href="/ai" className={styles.actionCard}>
            <div className={`${styles.actionIcon} ${styles.iconPurple}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
            </div>
            <span className={styles.actionLabel}>AI資料解析</span>
          </a>
          <a href="/bills" className={styles.actionCard}>
            <div className={`${styles.actionIcon} ${styles.iconAmber}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
            </div>
            <span className={styles.actionLabel}>議案登録</span>
          </a>
          <a href="/agenda" className={styles.actionCard}>
            <div className={`${styles.actionIcon} ${styles.iconGreen}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
            </div>
            <span className={styles.actionLabel}>アジェンダ生成</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function getCategoryBadge(category: string): string {
  switch (category) {
    case '例会': return 'primary';
    case '理事会': return 'warning';
    case '委員会': return 'info';
    case '研修': return 'success';
    default: return 'primary';
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'not_created': return 'badge-danger';
    case 'in_progress': return 'badge-warning';
    case 'submitted': return 'badge-success';
    default: return 'badge-primary';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'not_created': return '未作成';
    case 'in_progress': return '作成中';
    case 'submitted': return '提出済';
    default: return status;
  }
}
