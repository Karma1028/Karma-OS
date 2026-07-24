import { useState, useEffect } from 'react';

const FILES = ['hevy','spotify','vault','stats','feed','monthly','activity','agents','memory','repo_activity'];

export default function useData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(FILES.map(f => fetch(`/data/${f}.json`).then(r => r.json())))
      .then(results => {
        const obj = {};
        FILES.forEach((f, i) => obj[f] = results[i]);
        setData(obj);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}
