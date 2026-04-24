import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateScheduledEvent,
  cancelScheduledEvent,
} from '../lib/api';
import {
  scheduleAgendaReminders,
  cancelAgendaReminders,
  silenceEventReminders,
  unsilenceEvent,
} from '../lib/notifications';

export interface AgendaActionEvent {
  id: string;
  title: string;
  scheduled_for: string;
  all_day: boolean;
  sub?: string;
}

function invalidateAgendaKeys(qc: ReturnType<typeof useQueryClient>, petId: string) {
  qc.invalidateQueries({ queryKey: ['pets', petId, 'lens', 'agenda'] });
}

export function useAgendaActions(petId: string, petName: string) {
  const qc = useQueryClient();

  const confirm = useMutation({
    mutationFn: (event: AgendaActionEvent) =>
      updateScheduledEvent(event.id, { status: 'confirmed' }),
    onSuccess: (_, event) => {
      scheduleAgendaReminders(event, petName).catch(() => {});
      invalidateAgendaKeys(qc, petId);
    },
  });

  const markDone = useMutation({
    mutationFn: (event: AgendaActionEvent) =>
      updateScheduledEvent(event.id, { status: 'done' }),
    onSuccess: (_, event) => {
      cancelAgendaReminders(event.id).catch(() => {});
      invalidateAgendaKeys(qc, petId);
    },
  });

  const cancel = useMutation({
    mutationFn: (event: AgendaActionEvent) => cancelScheduledEvent(event.id),
    onSuccess: (_, event) => {
      cancelAgendaReminders(event.id).catch(() => {});
      invalidateAgendaKeys(qc, petId);
    },
  });

  const reschedule = useMutation({
    mutationFn: ({
      event,
      newScheduledFor,
    }: {
      event: AgendaActionEvent;
      newScheduledFor: string;
      allDay: boolean;
    }) =>
      updateScheduledEvent(event.id, {
        scheduled_for: newScheduledFor,
        status: 'scheduled',
      }),
    onSuccess: (_, { event, newScheduledFor, allDay }) => {
      const refreshed: AgendaActionEvent = {
        ...event,
        scheduled_for: newScheduledFor,
        all_day: allDay,
      };
      // Rescheduling clears any previous silence choice
      unsilenceEvent(event.id)
        .then(() => scheduleAgendaReminders(refreshed, petName))
        .catch(() => {});
      invalidateAgendaKeys(qc, petId);
    },
  });

  const silenceReminders = useMutation({
    mutationFn: (event: AgendaActionEvent) =>
      silenceEventReminders(event.id),
  });

  return { confirm, markDone, cancel, reschedule, silenceReminders };
}
