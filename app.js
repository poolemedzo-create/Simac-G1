```javascript
(function () {

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


  // =========================================================
  // UTILITAIRES
  // =========================================================

  function escapeHtml(value) {

    return String(value ?? '').replace(
      /[&<>"']/g,
      function (c) {

        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        }[c];

      }
    );
  }


  function typeClass(type) {

    return ['subject', 'group', 'free'].includes(type)
      ? type
      : 'free';

  }


  // =========================================================
  // JSONP
  // =========================================================

  function loadJsonp(url) {

    return new Promise(function (resolve, reject) {

      const callbackName =
        'simac_callback_' +
        Date.now() +
        '_' +
        Math.floor(Math.random() * 10000);

      const script = document.createElement('script');

      const separator =
        url.includes('?') ? '&' : '?';

      let finished = false;


      const timeout = setTimeout(function () {

        if (finished) return;

        finished = true;

        cleanup();

        reject(new Error('API timeout'));

      }, 10000);


      function cleanup() {

        clearTimeout(timeout);

        try {
          delete window[callbackName];
        } catch (e) {
          window[callbackName] = undefined;
        }

        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }

      }


      window[callbackName] = function (data) {

        if (finished) return;

        finished = true;

        cleanup();

        resolve(data);

      };


      script.onerror = function () {

        if (finished) return;

        finished = true;

        cleanup();

        reject(new Error('Impossible de contacter Google Apps Script'));

      };


      /*
       * t=Date.now() empêche le navigateur
       * d'utiliser une ancienne réponse en cache.
       */

      script.src =
        url +
        separator +
        'callback=' +
        encodeURIComponent(callbackName) +
        '&t=' +
        Date.now();


      document.head.appendChild(script);

    });

  }


  // =========================================================
  // CONVERSION DES DONNÉES
  // =========================================================

  function normalizeSchedule(response) {

    console.log('🔎 Données reçues :', response);


    /*
     * CAS 1
     *
     * L'API renvoie :
     *
     * {
     *   success: true,
     *   data: {...}
     * }
     */

    let data = response;

    if (
      response &&
      response.success === true &&
      response.data
    ) {

      data = response.data;

    }


    /*
     * CAS 2
     *
     * Les données sont déjà :
     *
     * {
     *   rows: [...]
     * }
     */

    if (
      data &&
      Array.isArray(data.rows)
    ) {

      console.log(
        '✅ Format rows détecté'
      );

      return data;

    }


    /*
     * CAS 3
     *
     * Google Apps Script renvoie :
     *
     * {
     *
     *   "08h-10h": {
     *      "Lundi": {
     *         type: "subject",
     *         title: "Électricité Appliquée"
     *      }
     *   },
     *
     *   "09h-11h": {
     *      ...
     *   }
     *
     * }
     */

    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data)
    ) {

      const rows = Object.entries(data).map(
        function ([time, dayData]) {

          return {

            time: time,

            days: days.map(
              function (day) {

                let cell = null;


                if (
                  dayData &&
                  typeof dayData === 'object' &&
                  dayData[day]
                ) {

                  cell = dayData[day];

                }


                /*
                 * Créneau vide
                 */

                if (
                  !cell ||
                  typeof cell !== 'object'
                ) {

                  return {
                    type: 'free',
                    title: 'Libre'
                  };

                }


                return {

                  type:
                    cell.type ||
                    'free',

                  title:
                    cell.title ||
                    'Libre'

                };

              }
            )

          };

        }
      );


      console.log(
        '✅ Format Google Apps Script converti :',
        rows
      );


      return {
        rows: rows
      };

    }


    throw new Error(
      'Format de planning inconnu'
    );

  }


  // =========================================================
  // CHARGEMENT DU PLANNING
  // =========================================================

  async function getSchedule() {


    /*
     * 1️⃣ ESSAYER GOOGLE APPS SCRIPT
     */

    if (
      typeof API_URL !== 'undefined' &&
      API_URL &&
      !API_URL.includes('COLLE_ICI')
    ) {

      try {

        console.log(
          '📡 Connexion à Google Apps Script...'
        );


        const response =
          await loadJsonp(API_URL);


        console.log(
          '📦 Réponse Google Apps Script :',
          response
        );


        return normalizeSchedule(response);

      } catch (error) {

        console.error(
          '❌ Google Apps Script :',
          error
        );

        console.log(
          '⚠️ Passage au fichier local...'
        );

      }

    }


    /*
     * 2️⃣ FALLBACK :
     * emploi_du_temps.json
     */

    console.log(
      '📁 Chargement de emploi_du_temps.json...'
    );


    const response = await fetch(
      FALLBACK +
      '?t=' +
      Date.now()
    );


    if (!response.ok) {

      throw new Error(
        'Impossible de charger ' +
        FALLBACK
      );

    }


    const data =
      await response.json();


    console.log(
      '📦 Données du fichier local :',
      data
    );


    return normalizeSchedule(data);

  }


  // =========================================================
  // AFFICHAGE DESKTOP
  // =========================================================

  function renderDesktop(rows) {


    if (!root) {

      console.error(
        '❌ #scheduleBody introuvable'
      );

      return;

    }


    root.innerHTML =
      rows.map(function (row) {

        return `
          <tr>

            <td class="time">
              ${escapeHtml(row.time)}
            </td>

            ${row.days.map(function (cell) {

              return `
                <td class="${typeClass(cell.type)}">
                  ${escapeHtml(cell.title)}
                </td>
              `;

            }).join('')}

          </tr>
        `;

      }).join('');

  }


  // =========================================================
  // AFFICHAGE MOBILE
  // =========================================================

  function renderMobile(rows) {


    if (!mobileRoot) {

      console.warn(
        '⚠️ #mobileSchedule introuvable'
      );

      return;

    }


    mobileRoot.innerHTML =
      days.map(function (day, dayIndex) {


        const items =
          rows
            .map(function (row) {

              return {

                time: row.time,

                cell:
                  row.days &&
                  row.days[dayIndex]
                    ? row.days[dayIndex]
                    : {
                        type: 'free',
                        title: 'Libre'
                      }

              };

            })
            .filter(function (item) {

              return (
                item.cell &&
                item.cell.type !== 'free'
              );

            });


        let content = '';


        /*
         * Aucun cours
         */

        if (items.length === 0) {

          content = `
            <div class="mobile-item">

              <div class="mobile-time">
                —
              </div>

              <div class="mobile-content free">
                Libre
              </div>

            </div>
          `;

        }


        /*
         * Cours
         */

        else {

          content =
            items.map(function (item) {

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

            }).join('');

        }


        return `
          <div class="day">

            <div class="day-title">

              <h3>
                ${escapeHtml(day)}
              </h3>

              <span class="day-number">
                ${String(dayIndex + 1).padStart(2, '0')}
              </span>

            </div>

            ${content}

          </div>
        `;


      }).join('');

  }


  // =========================================================
  // RENDU GLOBAL
  // =========================================================

  function render(data) {


    if (
      !data ||
      !Array.isArray(data.rows)
    ) {

      throw new Error(
        'Aucune ligne de planning'
      );

    }


    console.log(
      '📅 Planning à afficher :',
      data
    );


    renderDesktop(data.rows);

    renderMobile(data.rows);

  }


  // =========================================================
  // MESSAGE D'ERREUR
  // =========================================================

  function showError(error) {


    console.error(
      '❌ Erreur finale :',
      error
    );


    if (root) {

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

    }


    if (mobileRoot) {

      mobileRoot.innerHTML = `
        <div class="schedule-loading">
          Impossible de charger le planning.
        </div>
      `;

    }

  }


  // =========================================================
  // DÉMARRAGE
  // =========================================================

  console.log(
    '🚀 SIMAC Planning démarré'
  );


  getSchedule()
    .then(function (data) {

      render(data);

      console.log(
        '✅ Planning affiché avec succès'
      );

    })
    .catch(function (error) {

      showError(error);

    });


})();
```
