import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SEED_TASKS = [
  {id:'t1',text:'Queue comeback session · Push A (~70% intensity)',meta:'fitness · prescribed',source:'fitness',done:false},
  {id:'t2',text:'Cap Lat Pulldown at ≤6 working sets/session',meta:'fitness · programming audit',source:'fitness',done:false},
  {id:'t3',text:'Review 8 dormant liked artists for a revival playlist',meta:'spotify · recommendation',source:'spotify',done:false},
  {id:'t4',text:'Clear ingest backlog — 97 raw/ items waiting',meta:'vault · capture cadence',source:'vault',done:false},
  {id:'t5',text:'Wire history.jsonl writes into task completion flow',meta:'memory · only 1 entry logged so far',source:'memory',done:true},
  {id:'t6',text:'Give KARMA-LLM proxy a live model route',meta:'agents · scaffold only',source:'agents',done:false}
];

const useStore = create(
  persist(
    (set, get) => ({
      view: 'today',
      theme: 'dark',
      tasks: SEED_TASKS,
      synclog: [],
      splitFilter: 'all',
      taskFilter: 'all',
      feedFilter: 'all',
      selCluster: null,
      setView: (view) => set({ view }),
      setTheme: (theme) => set({ theme }),
      setSplitFilter: (f) => set({ splitFilter: f }),
      setTaskFilter: (f) => set({ taskFilter: f }),
      setFeedFilter: (f) => set({ feedFilter: f }),
      setSelCluster: (c) => set({ selCluster: c }),
      toggleTask: (id) => {
        const tasks = get().tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
        const task = tasks.find(t => t.id === id);
        const synclog = [{ stamp: new Date().toISOString().slice(0,16).replace('T',' '), text: (task.done ? 'completed: ' : 'reopened: ') + task.text, meta: task.source }, ...get().synclog];
        set({ tasks, synclog });
      },
      addTask: (text, source) => {
        const id = 't' + Date.now();
        const tasks = [{ id, text, meta: (source||'manual') + ' · queued from insight', source: source||'manual', done: false }, ...get().tasks];
        const synclog = [{ stamp: new Date().toISOString().slice(0,16).replace('T',' '), text: 'queued: ' + text, meta: source||'manual' }, ...get().synclog];
        set({ tasks, synclog });
      },
    }),
    { name: 'karmaos-store' }
  )
);

export default useStore;
