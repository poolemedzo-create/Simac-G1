```javascript
(function(){

  const FALLBACK = 'emploi_du_temps.json';

  const days = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche'
  ];

  const root = document.getElementById('scheduleBody');
  const mobileRoot = document.getElementById('mobileSchedule');

  function escapeHtml(value){
    return String(value ?? '').replace(
      /[&<>"']/g,
      c => ({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#039;'
      }[c])
    );
  }

  function typeClass(type){
    return ['subject','group','free'].includes(type)
      ? type
      : 'free';
  }

  /*
   * Chargement JSONP depuis Google Apps Script
   */
  function loadJsonp(url){

    return new Promise((resolve,reject)=>{

      const cb =
        'simac_cb_' +
        Date.now() +
        '_' +
        Math.floor(Math.random()*10000);

      const script = document.createElement('script');

      const sep = url.includes('?') ? '&' : '?';

      const timer = setTimeout(()=>{
        cleanup();
        reject(new Error('timeout'));
      },8000);

      function cleanup(){
        clearTimeout(timer);
        delete window[cb];
        script.remove();
      }

      window[cb] = (data)=>{
        cleanup();
        resolve(data);
      };

      script.onerror = ()=>{
        cleanup();
        reject(new Error('api'));
      };

      /*
       * t=Date.now() évite le cache
       */
      script.src =
        url +
        sep +
        'callback=' +
        cb +
        '&t=' +
        Date.now();

      document.head.appendChild(script);
    });
  }


  /*
   * Convertit les données Google Apps Script
   *
   * API :
   *
   * {
   *   "08h-10h": {
   *      "Lundi": {...},
   *      "Mardi": {...}
   *   }
   * }
   *
   * devient :
   *
   * {
   *   rows: [
   *      {
   *        time: "08h-10h",
   *        days: [...]
   *      }
   *   ]
   * }
   */
  function normalizeSchedule(data){

    /*
     * Si l'API renvoie déjà le format rows,
     * on le garde.
     */
    if(data && Array.isArray(data.rows)){
      return data;
    }

    /*
     * Sinon on convertit le format
     * Google Apps Script.
     */
    if(data && typeof data === 'object'){

      const rows = Object.entries(data).map(
        ([time, dayData]) => {

          return {
            time: time,

            days: days.map(day => {

              const cell =
                dayData &&
                dayData[day]
                  ? dayData[day]
                  : {
                      type: 'free',
                      title: 'Libre'
                    };

              return {
                type: cell.type || 'free',
                title: cell.title || 'Libre'
              };

            })
          };

        }
      );

      return {
        rows: rows
      };
    }

    throw new Error('Format du planning invalide');
  }


  /*
   * Récupération du planning
   */
  async function getSchedule(){

    try{

      /*
       * 1. On essaie Google Apps Script
       */
      if(
        typeof API_URL !== 'undefined' &&
        API_URL &&
        !API_URL.includes('COLLE_ICI')
      ){

        console.log(
          '📡 Chargement du planning depuis Google Apps Script...'
        );

        const data = await loadJsonp(API_URL);

        console.log(
          '✅ Planning reçu depuis Google Apps Script:',
          data
        );

        return normalizeSchedule(data);
      }

    }catch(error){

      console.warn(
        '⚠️ Impossible de récupérer Google Apps Script.',
        error
      );

    }

    /*
     * 2. Fallback vers emploi_du_temps.json
     */
    console.log(
      '📁 Utilisation du planning local.'
    );

    const response = await fetch(
      FALLBACK + '?t=' + Date.now()
    );

    if(!response.ok){
      throw new Error(
        'Impossible de charger ' + FALLBACK
      );
    }

    const data = await response.json();

    return normalizeSchedule(data);
  }


  /*
   * Affichage du planning
   */
  function render(data){

    const rows = data.rows || [];

    /*
     * Desktop
     */
    root.innerHTML = rows.map(row => {

      return `
        <tr>

          <td class="time">
            ${escapeHtml(row.time)}
          </td>

          ${row.days.map(cell => {

            return `
              <td class="${typeClass(cell.type)}">
                ${escapeHtml(cell.title)}
              </td>
            `;

          }).join('')}

        </tr>
      `;

    }).join('');


    /*
     * Mobile
     */
    mobileRoot.innerHTML = days.map((day, di) => {

      const items = rows
        .map(row => ({
          time: row.time,
          cell: row.days[di]
        }))
        .filter(
          item =>
            item.cell &&
            item.cell.type !== 'free'
        );


      return `
        <div class="day">

          <div class="day-title">

            <h3>
              ${day}
            </h3>

            <span class="day-number">
              ${String(di + 1).padStart(2,'0')}
            </span>

          </div>

          ${
            items.length

              ? items.map(item => {

                  return `
                    <div class="mobile-item">

                      <div class="mobile-time">
                        ${escapeHtml(item.time)}
                      </div>

                      <div class="mobile-content ${typeClass(item.cell.type)}">
                        ${escapeHtml(item.cell.title)}
                      </div>

                    </div>
                  `;

                }).join('')

              : `
                <div class="mobile-item">

                  <div class="mobile-time">
                    —
                  </div>

                  <div class="mobile-content free">
                    Libre
                  </div>

                </div>
              `
          }

        </div>
      `;

    }).join('');
  }


  /*
   * Chargement initial
   */
  getSchedule()

    .then(data => {

      console.log(
        '📅 Planning final:',
        data
      );

      render(data);

    })

    .catch(error => {

      console.error(
        '❌ Erreur planning:',
        error
      );

      root.innerHTML = `
        <tr>
          <td
            colspan="8"
            class="schedule-loading"
          >
            Impossible de charger le planning.
          </td>
        </tr>
      `;

      mobileRoot.innerHTML = `
        <div class="schedule-loading">
          Impossible de charger le planning.
        </div>
      `;

    });

})();
```
