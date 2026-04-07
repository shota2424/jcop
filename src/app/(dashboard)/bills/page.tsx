'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './bills.module.css';

interface BillItem {
  billId: string;
  title: string;
  assigneeEmail: string;
  deadline: string;
  status: string;
  relatedEventId: string;
}

const COLUMNS = [
  { key: 'not_created', label: '未作成', color: 'danger' },
  { key: 'in_progress', label: '作成中', color: 'warning' },
  { key: 'submitted', label: '提出済', color: 'success' },
];

export default function BillsPage() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', assigneeEmail: '', deadline: '', relatedEventId: '' });
  const [dragBill, setDragBill] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    try {
      const res = await fetch('/api/bills');
      const data = await res.json();
      if (data.success) setBills(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setForm({ title: '', assigneeEmail: '', deadline: '', relatedEventId: '' });
        fetchBills();
      }
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (billId: string, newStatus: string) => {
    try {
      await fetch('/api/bills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, status: newStatus }),
      });
      setBills((prev) => prev.map((b) => b.billId === billId ? { ...b, status: newStatus } : b));
    } catch (err) { console.error(err); }
  };

  const handleDrop = (status: string) => {
    if (dragBill) {
      handleStatusChange(dragBill, status);
      setDragBill(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>議案管理</h1>
          <p className={styles.pageSubtitle}>かんばんボードでステータスを管理</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          議案登録
        </button>
      </div>

      {loading ? (
        <div className="kanban-board">
          {[1,2,3].map((i) => (
            <div key={i} className="kanban-column">
              <div className="skeleton" style={{ height: 40, marginBottom: 16, borderRadius: 8 }} />
              <div className="skeleton" style={{ height: 100, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="kanban-board">
          {COLUMNS.map((col) => {
            const columnBills = bills.filter((b) => b.status === col.key);
            return (
              <div
                key={col.key}
                className="kanban-column"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.key)}
              >
                <div className="kanban-column-header">
                  <div className={styles.columnTitle}>
                    <span className={`badge badge-${col.color}`}>{col.label}</span>
                    <span className={styles.columnCount}>{columnBills.length}</span>
                  </div>
                </div>
                {columnBills.length === 0 ? (
                  <div className={styles.columnEmpty}>
                    <p>カードをドロップ</p>
                  </div>
                ) : (
                  columnBills.map((bill) => (
                    <div
                      key={bill.billId}
                      className="kanban-card"
                      draggable
                      onDragStart={() => setDragBill(bill.billId)}
                    >
                      <div className={styles.cardTitle}>{bill.title}</div>
                      {bill.deadline && (
                        <div className={styles.cardDeadline}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                          {bill.deadline}
                        </div>
                      )}
                      {bill.assigneeEmail && (
                        <div className={styles.cardAssignee}>
                          <div className="avatar avatar-sm" style={{ width: 20, height: 20, fontSize: '0.625rem' }}>
                            {bill.assigneeEmail.charAt(0).toUpperCase()}
                          </div>
                          <span>{bill.assigneeEmail}</span>
                        </div>
                      )}
                      <div className={styles.cardActions}>
                        {COLUMNS.filter((c) => c.key !== bill.status).map((c) => (
                          <button
                            key={c.key}
                            className={`btn btn-ghost ${styles.cardBtn}`}
                            onClick={() => handleStatusChange(bill.billId, c.key)}
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新規議案登録</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className={styles.createNote}>
                💡 登録時にGoogle Driveフォルダ（20_正副 / 30_理事会）が自動作成されます
              </p>
              <div className={styles.formGroup}>
                <label className="label">議案タイトル *</label>
                <input className="input" placeholder="例: 1月例会事業計画書" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label className="label">担当者メール</label>
                <input className="input" type="email" placeholder="担当者のメールアドレス" value={form.assigneeEmail} onChange={(e) => setForm({...form, assigneeEmail: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label className="label">期限</label>
                <input className="input" type="date" value={form.deadline} onChange={(e) => setForm({...form, deadline: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!form.title}>登録</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
