import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Flame } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import type { Habit } from '@/types';

export default function Habits() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get<{ habits: Habit[] }>('/habits'),
  });

  const checkin = useMutation({
    mutationFn: (id: string) => api.post(`/habits/${id}/checkin`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });

  const habits = data?.habits ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Habits</h1>
          <p className="text-sm text-slate-500">Streaks that compound.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> New habit
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="New habit" />
          <NewHabitForm onDone={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['habits'] }); }} />
        </Card>
      )}

      {habits.length === 0 ? (
        <Card><div className="py-12 text-center text-slate-500">No habits yet. Add one — anything you want to do daily.</div></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {habits.map((h) => {
            const done = !!(h.logs && h.logs.length);
            return (
              <Card key={h.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{h.title}</h3>
                    {h.description && <p className="mt-1 text-sm text-slate-600">{h.description}</p>}
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <span className="inline-flex items-center gap-1 text-orange-600">
                        <Flame className="h-4 w-4" /> {h.currentStreak}
                      </span>
                      <span className="text-slate-500">Best: {h.bestStreak}</span>
                      <span className="text-slate-500">Target: {h.targetPerWeek}/wk</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => checkin.mutate(h.id)} disabled={done || checkin.isPending}>
                    {done ? 'Done today ✓' : 'Check in'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewHabitForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetPerWeek, setTargetPerWeek] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/habits', { title, description, targetPerWeek });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
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
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <Label>Target per week</Label>
        <Input type="number" min={1} max={7} value={targetPerWeek} onChange={(e) => setTargetPerWeek(Number(e.target.value))} />
      </div>
      {error && <div className="md:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Create'}</Button>
      </div>
    </form>
  );
}
