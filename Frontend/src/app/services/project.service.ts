import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:3000/projects';
  private http = inject(HttpClient);

  getMyProjects(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getProjectById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createProject(project: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, project);
  }

  updateProject(id: string, project: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, project);
  }

  deleteProject(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}