import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Filter } from 'bad-words';
import { AuthService } from '../../features/auth/auth.service';

export interface FilterResult {
  blocked: boolean;
  matchedWord?: string;
}

@Injectable({ providedIn: 'root' })
export class ContentFilterService {

  private filter = new Filter();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // add custom words (Arabic/French slurs etc.)
    this.filter.addWords('mot1', 'mot2'); // add your own
  }

  check(text: string): FilterResult {
    if (!text?.trim()) return { blocked: false };
    try {
      if (this.filter.isProfane(text)) {
        const matched = text.split(/\s+/).find(w => {
          try { return this.filter.isProfane(w); } catch { return false; }
        });
        return { blocked: true, matchedWord: matched ?? '?' };
      }
      return { blocked: false };
    } catch {
      return { blocked: false };
    }
  }

  report(payload: {
    type: 'group_title' | 'chat_message' | 'session_title' | 'user_name';
    contentSnapshot: string;
    matchedKeyword: string;
    reportedUserId: number;
    reportedTarget: string;
  }): void {
    const currentUser = this.authService.currentUser;
    const reportedUserId = currentUser?.id ?? payload.reportedUserId ?? 0;
    const reportedTarget = currentUser?.nom ?? payload.reportedTarget ?? '';
    // fire and forget — never block the user flow
    this.http.post(`${environment.apiUrl}/reports`, {
      ...payload,
      reportedUserId,
      reportedTarget,
      status: 'flagged',
      date: new Date().toISOString(),
    }).subscribe({ error: () => {} });
  }
}
