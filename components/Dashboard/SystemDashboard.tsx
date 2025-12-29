
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { useStore } from '../../store/useStore';
import { Activity, Zap, Server, Database } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string; sub: string; icon: any; color: string }> = ({ title, value, sub, icon: Icon, color }) => (
  <div className="bg-nexus-800/40 border border-nexus-700 p-4 rounded-xl backdrop-blur-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-100 mt-1">{value}</h3>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </div>
      <div className={`p-2 rounded-lg bg-opacity-10 ${color}`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </div>
);

const SystemDashboard: React.FC = () => {
  const { agents, metrics, executionPlan: plan } = useStore();

  const resourceData = agents.map(a => ({
    name: a.name.split(' ')[0], 
    cpu: a.status === 'executing' ? Math.floor(Math.random() * 40) + 50 : a.status === 'thinking' ? Math.floor(Math.random() * 30) + 20 : 5,
    mem: a.status === 'executing' ? Math.floor(Math.random() * 30) + 60 : 20
  }));

  const activeAgentsCount = agents.filter(a => a.status !== 'dormant' && a.status !== 'idle').length;
  const activePlanSteps = plan.filter(p => p.status === 'active' || p.status === 'pending').length;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-slate-950">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">System Overview</h1>
        <p className="text-slate-400 text-sm">Real-time metrics of the Agentic Workspace</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Cognitive Load" value={`${metrics.history.length > 0 ? metrics.history[metrics.history.length-1].load : 0}%`} sub="Real-time Compute" icon={Activity} color="bg-rose-500 text-rose-500" />
        <StatCard title="Token Usage" value={(metrics.totalTokens / 1000).toFixed(1) + 'k'} sub={`Total Requests: ${metrics.totalRequests}`} icon={Zap} color="bg-amber-500 text-amber-500" />
        <StatCard title="Active Agents" value={`${activeAgentsCount}/4`} sub="Swarm Status" icon={Server} color="bg-emerald-500 text-emerald-500" />
        <StatCard title="Pipeline Depth" value={activePlanSteps.toString()} sub="Pending Steps" icon={Database} color="bg-blue-500 text-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-nexus-900/50 border border-nexus-800 p-6 rounded-xl">
          <h3 className="text-sm font-semibold text-slate-300 mb-6">Traffic & Load (Last 20 ticks)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.history}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 10}} />
                <YAxis stroke="#64748b" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} itemStyle={{ color: '#818cf8' }} />
                <Area type="monotone" dataKey="load" stroke="#6366f1" fillOpacity={1} fill="url(#colorLoad)" />
                <Line type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-nexus-900/50 border border-nexus-800 p-6 rounded-xl">
          <h3 className="text-sm font-semibold text-slate-300 mb-6">Agent Resource Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{fontSize: 12}} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{fontSize: 11}} width={70} />
                <Tooltip cursor={{fill: '#334155', opacity: 0.2}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                <Bar dataKey="cpu" name="Compute %" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="mem" name="Context %" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-nexus-800">
          <h3 className="text-sm font-semibold text-slate-300">Execution Queue</h3>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {plan.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No active execution plan.</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-nexus-900/80 text-xs uppercase font-semibold text-slate-500 sticky top-0">
                <tr>
                  <th className="px-6 py-3">Task ID</th>
                  <th className="px-6 py-3">Agent</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexus-800">
                {plan.map((step) => {
                   const agent = agents.find(a => a.id === step.agentId);
                   return (
                    <tr key={step.id} className="hover:bg-nexus-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{step.id.substring(0,8)}</td>
                      <td className="px-6 py-4 flex items-center">
                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: agent?.color }}></div>
                        {agent?.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs border ${
                          step.status === 'completed' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10' :
                          step.status === 'active' ? 'border-amber-500/20 text-amber-500 bg-amber-500/10' :
                          step.status === 'failed' ? 'border-red-500/20 text-red-500 bg-red-500/10' :
                          'border-slate-700 text-slate-500'
                        }`}>
                          {step.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 truncate max-w-xs">{step.description}</td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemDashboard;
