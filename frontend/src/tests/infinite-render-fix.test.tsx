/**
 * Test to verify that the infinite re-render issue is fixed
 * in IntuitiveNoteGenerationPage and EnhancedNoteSection components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import IntuitiveNoteGenerationPage from '../pages/IntuitiveNoteGenerationPage';
import EnhancedNoteSection from '../components/EnhancedNoteSection';


// Mock the auth store
const mockUser = {
  id: 'test-user-id',
  credits: 10,
  freeGenerationsUsed: 0,
  preferences: {
    defaultToneLevel: 50,
    defaultDetailLevel: 'brief'
  },
  hasCompletedSetup: true,
  writingStyle: 'professional'
};

vi.mock('../stores/authStore', () => {
  const mockAuthStore = vi.fn(() => ({
    user: mockUser
  }));

  return {
    useAuthStore: mockAuthStore
  };
});

// Mock the services
vi.mock('../services/noteService', () => ({
  noteService: {
    getUserISPTasks: vi.fn().mockResolvedValue([
      { id: 'task-1', description: 'Test task 1' },
      { id: 'task-2', description: 'Test task 2' }
    ])
  }
}));

vi.mock('../services/apiService', () => ({
  aiAPI: {
    generateNote: vi.fn(),
    generatePreview: vi.fn(),
    saveNote: vi.fn()
  }
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe('Infinite Re-render Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not cause infinite re-renders in IntuitiveNoteGenerationPage', async () => {
    const renderSpy = vi.fn();
    
    // Wrap component to track renders
    const TestWrapper = () => {
      renderSpy();
      return (
        <BrowserRouter>
          <IntuitiveNoteGenerationPage />
        </BrowserRouter>
      );
    };

    render(<TestWrapper />);

    // Wait for initial render and any immediate re-renders
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Generate Note/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Allow some time for any potential infinite re-renders
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Should not have excessive renders (allowing for initial renders and state updates)
    expect(renderSpy.mock.calls.length).toBeGreaterThan(0); // Should have been called
    expect(renderSpy.mock.calls.length).toBeLessThan(10); // Reasonable threshold
  });

  it('should not cause infinite re-renders in EnhancedNoteSection', async () => {
    const renderSpy = vi.fn();
    const mockOnPromptChange = vi.fn();
    const mockOnSettingsChange = vi.fn();

    const mockSection = {
      prompt: 'Test prompt',
      type: 'general' as const,
      taskId: undefined,
      generated: undefined,
      isEdited: false,
      sectionId: undefined,
      originalGenerated: undefined
    };

    // Wrap component to track renders
    const TestWrapper = () => {
      renderSpy();
      return (
        <EnhancedNoteSection
          index={0}
          section={mockSection}
          onPromptChange={mockOnPromptChange}
          onSettingsChange={mockOnSettingsChange}
        />
      );
    };

    render(<TestWrapper />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Allow some time for any potential infinite re-renders
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Should not have excessive renders
    expect(renderSpy.mock.calls.length).toBeGreaterThan(0); // Should have been called
    expect(renderSpy.mock.calls.length).toBeLessThan(5); // Reasonable threshold for child component

    // onSettingsChange should be called only once during initialization
    expect(mockOnSettingsChange).toHaveBeenCalledTimes(1);
    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      detailLevel: 'brief',
      toneLevel: 50
    });
  });

  it('should handle user preference changes without infinite loops', async () => {
    const mockOnSettingsChange = vi.fn();

    const mockSection = {
      prompt: 'Test prompt',
      type: 'general' as const
    };

    // Initial render
    render(
      <EnhancedNoteSection
        index={0}
        section={mockSection}
        onPromptChange={vi.fn()}
        onSettingsChange={mockOnSettingsChange}
      />
    );

    await waitFor(() => {
      expect(mockOnSettingsChange).toHaveBeenCalledTimes(1);
    });

    // Verify the initial settings were called correctly
    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      detailLevel: 'brief',
      toneLevel: 50
    });
  });
});
