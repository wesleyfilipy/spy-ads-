'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Globe, Save, Check } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(user?.name ?? 'Demo User');
  const [email, setEmail] = useState(user?.email ?? 'demo@adspy.com');
  const [country, setCountry] = useState('BR');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [newAdsAlert, setNewAdsAlert] = useState(true);
  const [scaledAlert, setScaledAlert] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 mb-4"
    >
      <h2 className="font-bold text-base mb-5 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h2>
      {children}
    </motion.div>
  );

  const Toggle = ({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-secondary border border-border'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie sua conta e preferências</p>
      </div>

      {/* Profile */}
      <Section icon={User} title="Perfil">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        </div>
      </Section>

      {/* Preferences */}
      <Section icon={Globe} title="Preferências">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">País padrão de busca</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
          >
            <option value="BR">🇧🇷 Brasil</option>
            <option value="US">🇺🇸 Estados Unidos</option>
            <option value="ALL">🌍 Todos os países</option>
            <option value="GB">🇬🇧 Reino Unido</option>
            <option value="CA">🇨🇦 Canadá</option>
            <option value="AU">🇦🇺 Austrália</option>
          </select>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notificações">
        <Toggle label="Notificações por email" desc="Receber resumos semanais de novos anúncios" value={emailNotifs} onChange={setEmailNotifs} />
        <Toggle label="Alerta de novos anúncios" desc="Notificar quando novos anúncios forem minerados" value={newAdsAlert} onChange={setNewAdsAlert} />
        <Toggle label="Alerta de Scaled" desc="Notificar quando anúncios estiverem sendo escalados" value={scaledAlert} onChange={setScaledAlert} />
      </Section>

      {/* Security */}
      <Section icon={Shield} title="Segurança">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Nova senha</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Confirmar senha</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        </div>
      </Section>

      {/* Theme */}
      <Section icon={Palette} title="Aparência">
        <div className="flex gap-3">
          {['dark', 'light', 'system'].map((t) => (
            <button
              key={t}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border capitalize transition-all ${
                t === 'dark'
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'dark' ? '🌙 Escuro' : t === 'light' ? '☀️ Claro' : '💻 Sistema'}
            </button>
          ))}
        </div>
      </Section>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
          saved
            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
            : 'bg-primary hover:bg-primary/90 text-white hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]'
        }`}
      >
        {saved ? <><Check className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar alterações</>}
      </button>
    </div>
  );
}
