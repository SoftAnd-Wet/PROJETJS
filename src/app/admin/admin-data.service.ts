import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  User, StudySession, Report, ReportStatus,
  MOCK_USERS, MOCK_REPORTS, AdminAction,
} from './models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminDataService {

  private apiUrl = 'http://localhost:8081/api/admin/sessions';

  private _users    = signal<User[]>([...MOCK_USERS]);
  private _sessions = signal<StudySession[]>([]);       // 👈 start empty
  private _reports  = signal<Report[]>([...MOCK_REPORTS]);

  readonly users    = this._users.asReadonly();
  readonly sessions = this._sessions.asReadonly();
  readonly reports  = this._reports.asReadonly();

  readonly liveCount   = computed(() => this._sessions().filter(s => s.status === 'live').length);
  readonly openReports = computed(() => this._reports().filter(r => r.status !== 'resolved').length);
  readonly activeUsers = computed(() => this._users().filter(u => u.status === 'active').length);
  private readonly reportsUrl = `http://localhost:8081/api/admin/reports`;
  constructor(private http: HttpClient) {
    this.loadSessions();
    this.loadUsers();
  }

  loadSessions(): void {
    this.http.get<any[]>(this.apiUrl , { withCredentials: true }).subscribe({
      next: (data) => this._sessions.set(data.map(s => this.mapSession(s))),
      error: (err) => console.error('Failed to load sessions', err)
    });
  }
  loadUsers(): void {
    this.http.get<any[]>('http://localhost:8081/api/admin/utilisateurs',
      { withCredentials: true }).subscribe({
      next: (data) => this._users.set(data),
      error: (err) => console.error('Failed to load users', err)
    });
  }

  private mapSession(s: any): StudySession {
    return {
      id:           s.id,
      subject:      s.matiereNom ?? 'Session libre',
      subjectColor: '#7c6ef5',
      host:         s.utilisateurNom ?? 'Unknown',
      hostId:       s.utilisateurId ?? 0,
      topic:        s.matiereNom ?? '—',
      duration:     s.dureeReelleMin > 0 ? s.dureeReelleMin + ' min' : '—',
      createdAt:    s.debut ? new Date(s.debut).toLocaleDateString('fr-FR') : '—',
      status:       s.statut === 'EN_COURS' ? 'live' : s.statut === 'PLANIFIEE' ? 'open' : 'closed',
      members:      1,
      maxMembers:   1,
    };
  }

  getUserById(id: number): User | undefined {
    return this._users().find(u => u.id === id);
  }

  toggleSuspend(userId: number): void {
    this.http.post(`http://localhost:8081/api/admin/utilisateurs/${userId}/suspension`, {},
      { withCredentials: true }).subscribe({
      next: () => this.loadUsers(), // reload after toggle
      error: (err) => console.error('Failed to toggle suspension', err)
    });
  }

  deleteSession(sessionId: number): void {
    this._sessions.update(s => s.filter(s => s.id !== sessionId));
  }

  getTableauDeBord() {
    return this.http.get<any>(
      'http://localhost:8081/api/admin/analytiques/tableau-de-bord',
      { withCredentials: true }
    );
  }
  getStatsGenerales() {
    return this.http.get<any>(
      'http://localhost:8081/api/admin/analytiques/stats-generales',
      { withCredentials: true }
    );
  }
  getHeatmap() {
    return this.http.get<any>(
      'http://localhost:8081/api/admin/analytiques/heatmap',
      { withCredentials: true }
    );
  }
  getCompleteDashboard() {
    return this.http.get<any>(
      'http://localhost:8081/api/admin/analytiques/tableau-de-bord-complet',
      { withCredentials: true }
    );
  }
  loadReports(): void {
    this.http.get<any[]>('http://localhost:8081/api/admin/reports',
      { withCredentials: true }).subscribe({
      next: (data) => this._reports.set(data.map(r => ({
        id:              r.id,
        type:            r.type === 'TITRE_GROUPE' ? 'group_title'
          : r.type === 'TITRE_SESSION' ? 'session_title'
            : r.type === 'MESSAGE_CHAT' ? 'chat_message' : 'user_name',
        title:           r.type?.replace('_', ' ').toLowerCase() ?? '—',
        reportedBy:      '—',
        reportedTarget:  r.reportedTarget ?? '—',
        reportedUserId:  r.reportedUserId,
        reason:          r.contenuSignale ?? '—',
        matchedKeyword:  r.motCleDetecte ?? '—',
        contentSnapshot: r.contenuSignale ?? '—',
        date:            r.dateSignalement ? new Date(r.dateSignalement).toLocaleDateString('fr-FR') : '—',
        status:          r.statut === 'SIGNALE' ? 'flagged'
          : r.statut === 'EN_COURS' ? 'reviewing'
            : r.statut === 'RESOLU' ? 'resolved' : 'flagged',
        offenseCount:    r.offenseCount ?? 0,  // 👈 add this
      }))),
      error: (err) => console.error('Failed to load reports', err)
    });
  }

  updateReportStatus(id: number, status: ReportStatus, action?: string): void {
    const statutMap: any = {
      'flagged': 'SIGNALE',
      'reviewing': 'EN_COURS',
      'resolved': 'RESOLU'
    };
    this.http.patch(`http://localhost:8081/api/admin/reports/${id}`,
      { statut: statutMap[status], actionAdmin: action ?? null, adminNote: null },
      { withCredentials: true }
    ).subscribe({
      next: () => this._reports.update(reports =>
        reports.map(r => r.id === id ? { ...r, status } : r)
      ),
      error: (err) => console.error('Failed to update report', err)
    });
  }

}
