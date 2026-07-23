import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(
  'mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway'
);

const fixes = [
  { id: 'IKIA1031', dbId: 9777, checkOutPkt: '2026-07-23 22:32:49' },
  { id: 'IKIA1032', dbId: 9779, checkOutPkt: '2026-07-23 22:36:40' },
  { id: 'IKIA1035', dbId: 9778, checkOutPkt: '2026-07-23 22:36:55' },
  { id: 'IKIA1036', dbId: 9809, checkOutPkt: '2026-07-23 22:37:41' },
  { id: 'IKIA1037', dbId: 9776, checkOutPkt: '2026-07-23 22:28:22' },
];

const ids = fixes.map(f => f.dbId);
const [recs] = await conn.query(
  'SELECT id, DATE_FORMAT(checkIn,'%Y-%m-%d %H:%i:%s') as ci, DATE_FORMAT(checkOut,'%Y-%m-%d %H:%i:%s') as co, status FROM HRMAttendance WHERE id IN (' + ids.map(() => '?').join(',') + ')',
  ids
);
const recMap = new Map(recs.map(r => [r.id, r]));

function pktToMins(s) { const [h,m]=s.slice(11,16).split(':').map(Number); return h*60+m; }

function calcStatus(ciPkt, coPkt) {
  const ci=pktToMins(ciPkt), co=pktToMins(coPkt);
  const late=13*60+30, half=17*60, early=21*60+30;
  let status, lateMinutes=null;
  if(ci>=half){ status='HALF_DAY'; lateMinutes=ci-late; }
  else if(ci>late){ status='LATE'; lateMinutes=ci-late; }
  else { status='PRESENT'; if(co<early) status='EARLY_LEAVE'; }
  return {status,lateMinutes};
}

for(const fix of fixes){
  const rec=recMap.get(fix.dbId);
  if(!rec){ console.log(fix.id+': not found'); continue; }
  const ci=fix.dbId===9809?rec.ci:rec.ci; // use existing checkIn (PKT from DB)
  const coMins=pktToMins(fix.checkOutPkt), ciMins=pktToMins(rec.ci);
  const wh=Math.round((coMins-ciMins)/60*100)/100;
  const ot=wh>8?Math.round((wh-8)*100)/100:null;
  const {status,lateMinutes}=calcStatus(rec.ci,fix.checkOutPkt);
  await conn.query('UPDATE HRMAttendance SET checkOut=?,workingHours=?,overtimeHours=?,status=?,lateMinutes=? WHERE id=?',
    [fix.checkOutPkt,wh,ot,status,lateMinutes,fix.dbId]);
  console.log(fix.id+': in:'+rec.ci.slice(11,16)+' out:'+rec.co.slice(11,16)+'->'+fix.checkOutPkt.slice(11,16)+' '+rec.status+'->'+status+'('+( lateMinutes??0)+'min) '+wh+'h');
}
console.log('Done.');
await conn.end();
