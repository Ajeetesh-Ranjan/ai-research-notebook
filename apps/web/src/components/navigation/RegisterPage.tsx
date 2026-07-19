import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { authApi } from '@/lib/apiClient';
import { Brain, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await authApi.register(email, password, name);
      setToken(res.token);
      setUser({
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        avatarUrl: null,
        role: 'member',
        preferences: {
          theme: 'system',
          fontSize: 14,
          pdfViewerMode: 'continuous',
          defaultCitationStyle: 'apa-7',
          defaultExportFormat: 'pdf',
          aiModel: 'gpt-4o',
          aiTemperature: 0.7,
          sidebarCollapsed: false,
          shortcuts: {},
          notificationPreferences: {},
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as import('@/types').User);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch {
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-sm rounded-xl border border-border-default bg-surface p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-primary-500" />
          <span className="text-lg font-semibold text-fg-primary">CiteMind</span>
        </div>
        <h1 className="mb-1 text-center text-xl font-semibold text-fg-primary">Create account</h1>
        <p className="mb-4 text-center text-sm text-fg-muted">Start your research journey</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name (optional)"
              className="input-field w-full pl-9"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="input-field w-full pl-9"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-field w-full pl-9"
              required
              minLength={6}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Create account
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-fg-muted">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-primary-400 hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
