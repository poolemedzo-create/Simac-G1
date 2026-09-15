const ADMIN_KEY = 'CHANGE-MOI-AVANT-DE-DEPLOYER';
const DATA_KEY = 'SIMAC_SCHEDULE';
const INITIAL_DATA = {"version": 1, "updatedAt": "", "days": ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"], "rows": [{"time": "08h - 10h", "days": [{"type": "subject", "title": "Électricité Appliquée"}, {"type": "free", "title": "Libre"}, {"type": "subject", "title": "Analyse 1"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}]}, {"time": "09h - 11h", "days": [{"type": "free", "title": "Libre"}, {"type": "subject", "title": "Architecture des Ordinateurs 1"}, {"type": "free", "title": "Libre"}, {"type": "subject", "title": "Introduction à la Cybersécurité"}, {"type": "subject", "title": "Système d'Exploitation 1"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}]}, {"time": "10h - 12h", "days": [{"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "subject", "title": "Introduction à la Cybersécurité"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}]}, {"time": "15h - 17h", "days": [{"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}]}, {"time": "17h - 19h", "days": [{"type": "subject", "title": "Algorithme 1"}, {"type": "subject", "title": "Algorithme 1"}, {"type": "subject", "title": "Algorithme 1"}, {"type": "subject", "title": "Algèbre 1"}, {"type": "subject", "title": "Introduction aux Réseaux"}, {"type": "group", "title": "Travail de groupe via Meet"}, {"type": "group", "title": "Travail de groupe via Meet"}]}, {"time": "19h - 21h", "days": [{"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "subject", "title": "Algorithme 1"}, {"type": "subject", "title": "Algorithme 1"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}]}, {"time": "21h - 23h", "days": [{"type": "free", "title": "Libre"}, {"type": "group", "title": "Travail de groupe via Meet"}, {"type": "free", "title": "Libre"}, {"type": "group", "title": "Travail de groupe via Meet"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}, {"type": "free", "title": "Libre"}]}]};

function json_(obj, callback) {
  const text = JSON.stringify(obj);
  if (callback && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + text + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const p=e && e.parameter ? e.parameter : {};
  if(p.action==='get' && p.key!==ADMIN_KEY) return json_({ok:false,error:'unauthorized'},p.callback);
  const saved=PropertiesService.getScriptProperties().getProperty(DATA_KEY);
  const data=saved ? JSON.parse(saved) : INITIAL_DATA;
  return json_(data,p.callback);
}

function doPost(e) {
  try {
    const p=e.parameter||{};
    if(p.key!==ADMIN_KEY) return json_({ok:false,error:'unauthorized'});
    if(p.action!=='save') return json_({ok:false,error:'invalid_action'});
    const data=JSON.parse(p.data);
    data.updatedAt=new Date().toISOString();
    PropertiesService.getScriptProperties().setProperty(DATA_KEY,JSON.stringify(data));
    return json_({ok:true,updatedAt:data.updatedAt});
  } catch(err) { return json_({ok:false,error:String(err)}); }
}
