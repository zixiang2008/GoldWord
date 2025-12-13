const VisitBackup = (function(){
  const KEY = 'goldword_visit_backup_v1';
  const MAX = 200;
  function load(){
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch(_) { return []; }
  }
  function save(list){
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX))); } catch(_) {}
  }
  function record(page, url){
    const list = load();
    list.push({ page: String(page||'unknown'), url: String(url||location.href||''), ts: Date.now() });
    save(list);
  }
  function getAll(){ return load(); }
  function exportJson(){
    try {
      const a = document.createElement('a');
      const blob = new Blob([JSON.stringify(load(), null, 2)], {type:'application/json'});
      a.href = URL.createObjectURL(blob);
      a.download = 'visit-backup.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ try{ URL.revokeObjectURL(a.href); document.body.removeChild(a);}catch(_){} }, 0);
    } catch(_) {}
  }
  return { record, getAll, exportJson };
})();
window.VisitBackup = VisitBackup;
