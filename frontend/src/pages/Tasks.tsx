import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import type { Task, Priority, RepeatType, Visibility } from '@/types';

export default function Tasks() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get<{ tasks: Task[] }>('/tasks'),
  });

  const complete = useMutation({
    mutationFn: (id: string) => api.post(`/tasks/${id}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const tasks = data?.tasks ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500">The things on your plate.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="New task" />
          <NewTaskForm onDone={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['tasks'] }); }} />
        </Card>
      )}

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : tasks.length === 0 ? (
        <Card><div className="py-12 text-center text-slate-500">No tasks yet — add your first one above.</div></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tasks.map((t) => {
            const done = !!(t.logs && t.logs.length);
            const priorityColor: Record<Priority, string> = {
              LOW: 'badge', MEDIUM: 'badge-brand', HIGH: 'badge-warn', URGENT: 'badge-danger',
            };
            return (
              <Card key={t.id} className={done ? 'opacity-60' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</h3>
                      <span className={priorityColor[t.priority]}>{t.priority}</span>
                    </div>
                    {t.description && <p className="mt-1 text-sm text-slate-600">{t.description}</p>}
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span className="badge">{t.repeat}</span>
                      <span className="badge">{t.visibility.toLowerCase()}</span>
                      <span>+{t.points} XP</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!done && (
                      <Button size="sm" onClick={() => complete.mutate(t.id)} disabled={complete.isPending}>
                        <CheckCircle2 className="h-4 w-4" /> Done
                      </Button>
                    )}
                    <button
                      onClick={() => remove.mutate(t.id)}
                      className="text-slate-400 hover:text-rose-500"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewTaskForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(10);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [repeat, setRepeat] = useState<RepeatType>('DAILY');
  const [visibility, setVisibility] = useState<Visibility>('PRIVATE');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/tasks', { title, description, points, priority, repeat, visibility });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="md:col-span-2">
        <Label>Description (optional)</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <Label>Points</Label>
        <Input type="number" min={0} max={1000} value={points} onChange={(e) => setPoints(Number(e.target.value))} />
      </div>
      <div>
        <Label>Priority</Label>
        <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option><option value="URGENT">Urgent</option>
        </Select>
      </div>
      <div>
        <Label>Repeat</Label>
        <Select value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatType)}>
          <option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option><option value="ONCE">One-time</option>
        </Select>
      </div>
      <div>
        <Label>Visibility</Label>
        <Select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
          <option value="PRIVATE">Private</option><option value="FRIENDS">Friends only</option>
          <option value="PUBLIC">Public</option>
        </Select>
      </div>
      {error && <div className="md:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Create'}</Button>
      </div>
    </form>
  );
}
