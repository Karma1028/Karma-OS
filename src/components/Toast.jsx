import { useState, useEffect } from 'react';

let toastListeners = [];
export function showToast(msg) {
  toastListeners.forEach(fn => fn(msg));
}

export default function Toast() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const handler = (msg) => {
      setMessage(msg);
      setTimeout(() => setMessage(null), 2600);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter(h => h !== handler); };
  }, []);

  if (!message) return null;
  return <div className="toast">{message}</div>;
}
