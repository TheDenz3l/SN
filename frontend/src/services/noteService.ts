import { ispTasksAPI, aiAPI } from './apiService';

export interface ISPTask {
  id: string;
  user_id: string;
  description: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: any; // JSON content
  note_type: 'task' | 'comment' | 'general';
  tokens_used: number | null;
  cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface NoteSection {
  id: string;
  note_id: string;
  isp_task_id: string | null;
  user_prompt: string;
  generated_content: string;
  is_edited: boolean;
  tokens_used: number | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateNoteRequest {
  title: string;
  sections: {
    taskId?: string;
    prompt: string;
    type: 'task' | 'comment' | 'general';
    // Add section-specific settings for Generate Notes alignment
    detailLevel?: string;
    toneLevel?: number;
  }[];
}

export interface GenerateNoteResponse {
  note: Note;
  sections: NoteSection[];
  totalTokens: number;
  totalCost: number;
  creditsUsed: number;
}

class NoteService {
  
  /**
   * Get user's ISP tasks
   */
  async getUserISPTasks(): Promise<ISPTask[]> {
    try {
      const result = await ispTasksAPI.getTasks();
      return result.tasks || [];
    } catch (error) {
      console.error('Error fetching ISP tasks:', error);
      throw new Error('Failed to fetch ISP tasks');
    }
  }
  
  /**
   * Add new ISP task
   */
  async addISPTask(_userId: string, description: string): Promise<ISPTask> {
    try {
      // Use backend API instead of direct Supabase calls
      const result = await ispTasksAPI.createTask({ description: description.trim() });
      return result.task;
    } catch (error) {
      console.error('Error adding ISP task:', error);
      throw new Error('Failed to add ISP task');
    }
  }
  
  /**
   * Update ISP task
   */
  async updateISPTask(taskId: string, description: string): Promise<ISPTask> {
    try {
      // Use backend API instead of direct Supabase calls
      const result = await ispTasksAPI.updateTask(taskId, { description: description.trim() });
      return result.task;
    } catch (error) {
      console.error('Error updating ISP task:', error);
      throw new Error('Failed to update ISP task');
    }
  }
  
  /**
   * Delete ISP task
   */
  async deleteISPTask(taskId: string): Promise<void> {
    try {
      // Use backend API instead of direct Supabase calls
      await ispTasksAPI.deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting ISP task:', error);
      throw new Error('Failed to delete ISP task');
    }
  }
  
  /**
   * Get user's notes
   */
  async getUserNotes(_userId: string, limit = 20): Promise<Note[]> {
    try {
      // Use backend API instead of direct Supabase calls
      const token = localStorage.getItem('auth_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiUrl}/notes?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const result = await response.json();
      return result.notes || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw new Error('Failed to fetch notes');
    }
  }
  
  /**
   * Get note with sections
   */
  async getNoteWithSections(noteId: string): Promise<{ note: Note; sections: NoteSection[] }> {
    try {
      // Use backend API instead of direct Supabase calls
      const token = localStorage.getItem('auth_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiUrl}/notes/${noteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch note');
      }

      const result = await response.json();

      return {
        note: result.note,
        sections: result.sections || []
      };
    } catch (error) {
      console.error('Error fetching note:', error);
      throw new Error('Failed to fetch note');
    }
  }
  
  /**
   * Generate AI-powered note
   */
  async generateNote(
    request: GenerateNoteRequest
  ): Promise<GenerateNoteResponse> {

    try {
      // Use the backend API for note generation
      const result = await aiAPI.generateNote({
        title: request.title,
        sections: request.sections
      });

      return {
        note: result.note,
        sections: result.sections || [],
        totalTokens: result.totalTokens || 0,
        totalCost: result.totalCost || 0,
        creditsUsed: result.creditsUsed || 0
      };
    } catch (error) {
      console.error('Error generating note:', error);
      throw error;
    }
  }
  
  /**
   * Update note section content
   */
  async updateNoteSection(sectionId: string, content: string): Promise<NoteSection> {
    try {
      // Use backend API instead of direct Supabase calls
      const token = localStorage.getItem('auth_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiUrl}/notes/sections/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generated_content: content,
          is_edited: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note section');
      }

      const result = await response.json();
      return result.section;
    } catch (error) {
      console.error('Error updating note section:', error);
      throw new Error('Failed to update note section');
    }
  }
  
  /**
   * Delete note and all sections
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      // Use backend API instead of direct Supabase calls
      const token = localStorage.getItem('auth_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiUrl}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  }
}

// Export singleton instance
export const noteService = new NoteService();
export default noteService;
