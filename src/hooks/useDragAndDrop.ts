/**
 * Custom hook for drag and drop event functionality
 * 
 * This hook manages the drag state and provides handlers for:
 * - Starting a drag operation
 * - Tracking drag position
 * - Completing a drop and updating the event time
 */

import { useState, useCallback } from 'react';
import { CalendarEvent, DragInfo } from '../types';
import { parseISO, differenceInMinutes, addMinutes } from '../utils/dateUtils';

interface UseDragAndDropProps {
  events: CalendarEvent[];
  onUpdateEvent: (event: CalendarEvent) => void;
}

interface DragState {
  isDragging: boolean;
  dragInfo: DragInfo | null;
  dragPreview: { top: number; left: number } | null;
}

export const useDragAndDrop = ({ events, onUpdateEvent }: UseDragAndDropProps) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragInfo: null,
    dragPreview: null,
  });

  /**
   * Start dragging an event
   * Stores original position for potential cancel/revert
   */
  const startDrag = useCallback((event: CalendarEvent) => {
    setDragState({
      isDragging: true,
      dragInfo: {
        eventId: event.id,
        originalStart: event.start,
        originalEnd: event.end,
      },
      dragPreview: null,
    });
  }, []);

  /**
   * Update drag preview position
   */
  const updateDragPreview = useCallback((position: { top: number; left: number }) => {
    setDragState(prev => ({
      ...prev,
      dragPreview: position,
    }));
  }, []);

  /**
   * Complete the drop operation
   * Calculates new time based on drop position and updates the event
   */
  const completeDrop = useCallback((newStartDate: Date) => {
    if (!dragState.dragInfo) return;

    const event = events.find(e => e.id === dragState.dragInfo!.eventId);
    if (!event) return;

    // Calculate duration from original event
    const originalStart = parseISO(dragState.dragInfo.originalStart);
    const originalEnd = parseISO(dragState.dragInfo.originalEnd);
    const durationMinutes = differenceInMinutes(originalEnd, originalStart);

    // Calculate new end time based on duration
    const newEndDate = addMinutes(newStartDate, durationMinutes);

    // Update the event with new times
    const updatedEvent: CalendarEvent = {
      ...event,
      start: newStartDate.toISOString(),
      end: newEndDate.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpdateEvent(updatedEvent);
    cancelDrag();
  }, [dragState.dragInfo, events, onUpdateEvent]);

  /**
   * Cancel drag operation and reset state
   */
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      dragInfo: null,
      dragPreview: null,
    });
  }, []);

  /**
   * Calculate drop time from mouse position in time grid
   * @param clientY - Mouse Y position
   * @param gridTop - Top position of the time grid
   * @param hourHeight - Height of each hour slot in pixels
   * @param baseDate - Base date for the drop (the day column)
   */
  const calculateDropTime = useCallback((
    clientY: number,
    gridTop: number,
    hourHeight: number,
    baseDate: Date
  ): Date => {
    const offsetY = clientY - gridTop;
    const hours = Math.floor(offsetY / hourHeight);
    const minutes = Math.round((offsetY % hourHeight) / hourHeight * 60 / 15) * 15; // Round to 15-min intervals

    const dropDate = new Date(baseDate);
    dropDate.setHours(Math.max(0, Math.min(23, hours)));
    dropDate.setMinutes(Math.max(0, Math.min(45, minutes)));
    dropDate.setSeconds(0);
    dropDate.setMilliseconds(0);

    return dropDate;
  }, []);

  return {
    isDragging: dragState.isDragging,
    dragInfo: dragState.dragInfo,
    dragPreview: dragState.dragPreview,
    startDrag,
    updateDragPreview,
    completeDrop,
    cancelDrag,
    calculateDropTime,
  };
};

export default useDragAndDrop;
