(function(){
  const FALLBACK = 'emploi_du_temps.json';
  const days = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  const root = document.getElementById('scheduleBody');
  const mobileRoot = document.getElementById('mobileSchedule');

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }
  function typeClass(type){ return ['subject','group','free'].includes(type) ? type : 'free'; }
  function loadJsonp(url){
    return new Promise((resolve,reject)=>{
      const cb='simac_cb_'+Date.now()+'_'+Math.floor(Math.random()*10000);
      const script=document.createElement('script');
      const sep=url.includes('?')?'&':'?';
      const timer=setTimeout(()=>{ cleanup(); reject(new Error('timeout')); },8000);
      function cleanup(){ clearTimeout(timer); delete window[cb]; script.remove(); }
      window[cb]=(data)=>{ cleanup(); resolve(data); };
      script.onerror=()=>{ cleanup(); reject(new Error('api')); };
      script.src=url+sep+'callback='+cb+'&t='+Date.now();
      document.head.appendChild(script);
    });
  }
  async function getSchedule(){
    try{
      if(typeof API_URL!=='undefined' && API_URL && !API_URL.includes('COLLE_ICI')) return await loadJsonp(API_URL);
    }catch(e){}
    const r=await fetch(FALLBACK+'?t='+Date.now());
    return await r.json();
  }
  function render(data){
    const rows=data.rows||[];
    root.innerHTML=rows.map(row=>`<tr><td class="time">${escapeHtml(row.time)}</td>${row.days.map(c=>`<td class="${typeClass(c.type)}">${escapeHtml(c.title)}</td>`).join('')}</tr>`).join('');
    mobileRoot.innerHTML=days.map((day,di)=>{
      const items=rows.map(r=>({time:r.time,cell:r.days[di]})).filter(x=>x.cell && x.cell.type!=='free');
      return `<div class="day"><div class="day-title"><h3>${day}</h3><span class="day-number">${String(di+1).padStart(2,'0')}</span></div>${items.length?items.map(x=>`<div class="mobile-item"><div class="mobile-time">${escapeHtml(x.time)}</div><div class="mobile-content ${typeClass(x.cell.type)}">${escapeHtml(x.cell.title)}</div></div>`).join(''):'<div class="mobile-item"><div class="mobile-time">—</div><div class="mobile-content free">Libre</div></div>'}</div>`;
    }).join('');
  }
  getSchedule().then(render).catch(()=>{
    root.innerHTML='<tr><td colspan="8" class="schedule-loading">Impossible de charger le planning.</td></tr>';
  });
})();
