'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './members.module.css';

interface MemberItem {
  name: string;
  email: string;
  role: string;
  committee: string;
  lineDisplayName: string;
  position: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editMember, setEditMember] = useState<MemberItem | null>(null);
  const [editForm, setEditForm] = useState({ committee: '', lineDisplayName: '', role: '', position: '' });

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.success) setMembers(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleEdit = (member: MemberItem) => {
    setEditMember(member);
    setEditForm({ committee: member.committee, lineDisplayName: member.lineDisplayName, role: member.role, position: member.position });
  };

  const handleSave = async () => {
    if (!editMember) return;
    try {
      await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editMember.email, ...editForm }),
      });
      setEditMember(null);
      fetchMembers();
    } catch (err) { console.error(err); }
  };

  const filtered = members.filter((m) =>
    m.name.includes(search) || m.email.includes(search) || m.committee.includes(search)
  );

  const committees = [...new Set(members.map((m) => m.committee).filter(Boolean))];
  const adminCount = members.filter((m) => m.role === 'admin').length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>メンバー管理</h1>
          <p className={styles.pageSubtitle}>{members.length}名のメンバー · 管理者{adminCount}名</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        {committees.map((c) => (
          <div key={c} className={`glass-card ${styles.committeeStat}`}>
            <span className={styles.committeeLabel}>{c}</span>
            <span className={styles.committeeCount}>{members.filter((m) => m.committee === c).length}名</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input className={styles.searchInput} placeholder="名前・メール・委員会で検索..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className={`surface-card ${styles.tableCard}`}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 8 }} />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>氏名</th>
                <th>メールアドレス</th>
                <th>役職</th>
                <th>委員会</th>
                <th>LINE表示名</th>
                <th>権限</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.email}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className="avatar avatar-sm">{member.name.charAt(0)}</div>
                      <span className={styles.memberName}>{member.name}</span>
                    </div>
                  </td>
                  <td><span className={styles.emailText}>{member.email}</span></td>
                  <td>
                    <span className={`badge ${
                      member.position === '正副' ? 'badge-primary' :
                      member.position === '理事会' ? 'badge-info' : ''
                    }`}>
                      {member.position || '一般'}
                    </span>
                  </td>
                  <td><span className="chip">{member.committee || '未所属'}</span></td>
                  <td><span className={styles.lineText}>{member.lineDisplayName || '−'}</span></td>
                  <td>
                    <span className={`badge ${member.role === 'admin' ? 'badge-primary' : 'badge-info'}`}>
                      {member.role === 'admin' ? '管理者' : 'メンバー'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(member)}>
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <p>該当するメンバーが見つかりません</p>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editMember && (
        <div className="modal-overlay" onClick={() => setEditMember(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMember.name} の編集</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditMember(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className={styles.formGroup}>
                <label className="label">委員会</label>
                <input className="input" value={editForm.committee} onChange={(e) => setEditForm({...editForm, committee: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label className="label">LINE表示名</label>
                <input className="input" value={editForm.lineDisplayName} onChange={(e) => setEditForm({...editForm, lineDisplayName: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label className="label">役職</label>
                <select className="input select" value={editForm.position} onChange={(e) => setEditForm({...editForm, position: e.target.value})}>
                  <option value="一般">一般</option>
                  <option value="正副">正副</option>
                  <option value="理事会">理事会</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className="label">権限</label>
                <select className="input select" value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})}>
                  <option value="member">メンバー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditMember(null)}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
