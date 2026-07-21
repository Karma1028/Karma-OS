import React, { useState } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import useStore from '../store/useStore';
import { CHART_COLORS } from '../utils/helpers';
import { showToast } from '../components/Toast';

export default function Tasks() {
  const { tasks, taskFilter, setTaskFilter, toggleTask, addTask, synclog } = useStore();
  const [newTask, setNewTask] = useState('');

  const handleAdd = (e) => {
    if (e.key === 'Enter' && newTask.trim()) {
      addTask({ id: Date.now(), title: newTask.trim(), done: false, source: 'manual' });
      showToast('Task added');
      setNewTask('');
    }
  };

  const openTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);
  const compPct = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  
  const sources = {};
  tasks.forEach(t => {
    sources[t.source] = (sources[t.source] || 0) + 1;
  });
  const topSource = Object.keys(sources).sort((a,b) => sources[b] - sources[a])[0] || 'N/A';

  const sourceData = Object.entries(sources).map(([name, value]) => ({ name, value }));

  const burndownData = [
    { date: 'Mon', remaining: tasks.length + 5 },
    { date: 'Tue', remaining: tasks.length + 3 },
    { date: 'Wed', remaining: tasks.length + 1 },
    { date: 'Thu', remaining: tasks.length },
    { date: 'Fri', remaining: openTasks.length }
  ];

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'open') return !t.done;
    if (taskFilter === 'done') return t.done;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card g4">
        <div className="statCard">
          <div className="statLbl">OPEN TASKS</div>
          <div className="statVal">{openTasks.length}</div>
        </div>
        <div className="statCard">
          <div className="statLbl">COMPLETED</div>
          <div className="statVal">{doneTasks.length}</div>
        </div>
        <div className="statCard">
          <div className="statLbl">COMPLETION</div>
          <div className="statVal">{compPct}%</div>
        </div>
        <div className="statCard">
          <div className="statLbl">TOP SOURCE</div>
          <div className="statVal">{topSource}</div>
        </div>
      </div>

      <div className="g3">
        <div className="card">
          <div className="h2">AI SUGGESTS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <div className="insightCard" onClick={() => { addTask({id:Date.now(), title:'Deload central nervous system', done:false, source:'agents'}); showToast('Added Deload task'); }} style={{ cursor: 'pointer' }}>Deload CNS</div>
            <div className="insightCard" onClick={() => { addTask({id:Date.now()+1, title:'Ingest recent vault notes', done:false, source:'vault'}); showToast('Added Ingest task'); }} style={{ cursor: 'pointer' }}>Ingest Notes</div>
            <div className="insightCard" onClick={() => { addTask({id:Date.now()+2, title:'Wire memory clusters', done:false, source:'memory'}); showToast('Added Wire Memory task'); }} style={{ cursor: 'pointer' }}>Wire Memory</div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="h2">TASK BURNDOWN</div>
          <div style={{ height: '200px', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border2)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--mut)" tick={{fill:'var(--mut)', fontFamily:'IBM Plex Mono', fontSize:10}} />
                <YAxis stroke="var(--mut)" tick={{fill:'var(--mut)', fontFamily:'IBM Plex Mono', fontSize:10}} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} itemStyle={{ color: 'var(--text)' }} />
                <Line type="monotone" dataKey="remaining" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ fill: CHART_COLORS[0], r: 4 }} animationDuration={800} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="g3">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div className="h2">TASKS</div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {['all', 'open', 'done'].map(f => (
                <div key={f} className={`chip ${taskFilter === f ? 'active' : ''}`} style={taskFilter === f ? { background: 'var(--accent)', color: '#000' } : {}} onClick={() => setTaskFilter(f)}>
                  {f.toUpperCase()}
                </div>
              ))}
            </div>
          </div>
          
          <input 
            type="text" 
            value={newTask} 
            onChange={(e) => setNewTask(e.target.value)} 
            onKeyDown={handleAdd}
            placeholder="> Enter new task..." 
            style={{ width: '100%', padding: '10px', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'IBM Plex Mono', marginBottom: '15px', outline: 'none' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {filteredTasks.map(t => (
              <div key={t.id} className="taskRow" onClick={() => toggleTask(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--card2)', cursor: 'pointer', transition: 'all 0.2s ease', opacity: t.done ? 0.6 : 1 }}>
                <div className={`chk ${t.done ? 'checked' : ''}`} style={{ width: '16px', height: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.done ? 'var(--good)' : 'transparent', transition: 'background 0.2s ease' }}>
                  {t.done && <div style={{ width: '8px', height: '8px', background: '#000' }} />}
                </div>
                <div style={{ textDecoration: t.done ? 'line-through' : 'none', flex: 1, fontFamily: 'IBM Plex Mono', fontSize: '14px' }}>{t.title}</div>
                <div className="chip" style={{ fontSize: '10px' }}>{t.source}</div>
              </div>
            ))}
            {filteredTasks.length === 0 && <div className="mut">No tasks found.</div>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="h2">TASKS BY SOURCE</div>
            <div style={{ height: '200px', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none" animationDuration={800} animationEasing="ease-out">
                    {sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 10 }} itemStyle={{ color: 'var(--text)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="h2">COMPLETION RATE</div>
            <div style={{ height: '200px', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={[{ name: 'Comp', value: compPct, fill: 'var(--good)' }]} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: 'var(--card2)' }} dataKey="value" cornerRadius={10} animationDuration={800} animationEasing="ease-out" />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="var(--text)" fontSize="24" fontFamily="IBM Plex Mono">
                    {compPct}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="h2">PRIORITY MATRIX</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '10px', marginTop: '15px', height: '300px' }}>
            <div style={{ border: '1px dashed var(--warn)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
              <div className="mut" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Urgent / Important</div>
              {tasks.filter(t => !t.done && (t.source === 'fitness' || t.source === 'agents')).map(t => <div key={t.id} className="chip">{t.title}</div>)}
            </div>
            <div style={{ border: '1px dashed var(--good)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
              <div className="mut" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Not Urgent / Important</div>
              {tasks.filter(t => !t.done && (t.source === 'memory' || t.source === 'vault')).map(t => <div key={t.id} className="chip">{t.title}</div>)}
            </div>
            <div style={{ border: '1px dashed var(--bad)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
              <div className="mut" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Urgent / Not Important</div>
              {tasks.filter(t => !t.done && (t.source === 'feed' || t.source === 'spotify')).map(t => <div key={t.id} className="chip">{t.title}</div>)}
            </div>
            <div style={{ border: '1px dashed var(--mut)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
              <div className="mut" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Not Urgent / Not Important</div>
              {tasks.filter(t => !t.done && !['fitness','agents','memory','vault','feed','spotify'].includes(t.source)).map(t => <div key={t.id} className="chip">{t.title}</div>)}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="h2">SYNC LOG & TIMELINE</div>
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
            {synclog && synclog.map((log, i) => (
              <div key={i} className="timeline-item" style={{ display: 'flex', gap: '10px' }}>
                <div className="timeline-time" style={{ width: '60px', fontSize: '10px', color: 'var(--mut)', paddingTop: '2px' }}>{log.time}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="timeline-dot" style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }} />
                  {i < synclog.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border)', margin: '2px 0' }} />}
                </div>
                <div className="timeline-content" style={{ paddingBottom: '15px' }}>
                  <div className="timeline-title" style={{ fontSize: '12px' }}>{log.msg}</div>
                  {log.meta && <div className="timeline-detail mut" style={{ fontSize: '10px' }}>{log.meta}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
