// Finvia – zero-dependency Node server (static app + JSON API)
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||3000,DATA=process.env.DATA_DIR||path.join(__dirname,'data'),FILE=path.join(DATA,'db.json');
const PUB=path.join(__dirname,'public'),BUFFER=15000,OPEN=48200;
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml'};
const day=n=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)};
function seed(){let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647,tx=[];
 for(let i=59;i>=0;i--){tx.push({id:'s'+i+'a',date:day(i),type:'in',amount:Math.round((4000+r()*9000)/10)*10,note:'Customer payment'});
  tx.push({id:'s'+i+'b',date:day(i),type:'out',amount:Math.round((2500+r()*8500)/10)*10,note:i%7?'Supplier / operating cost':'Payroll & rent'})}
 return tx}
let tx;try{tx=JSON.parse(fs.readFileSync(FILE,'utf8'))}catch{tx=seed();save()}
function save(){fs.mkdirSync(DATA,{recursive:true});fs.writeFileSync(FILE,JSON.stringify(tx))}
const sum=(a,t)=>a.filter(x=>x.type===t).reduce((s,x)=>s+x.amount,0);
function dashboard(range){const days=range==='week'?7:30,from=day(days-1),prevFrom=day(days*2-1);
 const cur=tx.filter(x=>x.date>=from),prev=tx.filter(x=>x.date>=prevFrom&&x.date<from);
 const i=sum(cur,'in'),o=sum(cur,'out'),n=i-o,pn=sum(prev,'in')-sum(prev,'out');
 const pct=(a,b)=>b?Math.round((a-b)/Math.abs(b)*1000)/10:null;
 const series=[];for(let k=days-1;k>=0;k--){const d=day(k),t=tx.filter(x=>x.date===d);series.push({date:d,in:sum(t,'in'),out:sum(t,'out')})}
 const balance=OPEN+sum(tx,'in')-sum(tx,'out'),last=tx.filter(x=>x.date>=day(13)),avg=(sum(last,'in')-sum(last,'out'))/14;
 const forecast=[];let b=balance,d12=null,d0=null;
 for(let k=0;k<=30;k++){forecast.push(Math.round(b));if(d12===null&&b<BUFFER)d12=k;if(d0===null&&b<=0)d0=k;b+=avg-(k%10===9?Math.abs(avg)+9000:0)}
 return{range,balance,cashIn:i,cashOut:o,net:n,changes:{in:pct(i,sum(prev,'in')),out:pct(o,sum(prev,'out')),net:pct(n,pn)},series,
  forecast:{values:forecast,buffer:BUFFER,belowBufferDay:d12,zeroDay:d0},
  insight:d12!==null?`Projected cash drops below your RM ${BUFFER.toLocaleString('en-MY')} buffer on day ${d12}${d0!==null?' and reaches zero around day '+d0:''}. Act early.`:n>=0?'Your net cash flow is positive this period. Keep up the good work!':'Cash out is higher than cash in this period. Review upcoming payments.'}}
const send=(res,c,o)=>{res.writeHead(c,{'Content-Type':'application/json'});res.end(JSON.stringify(o))};
http.createServer((req,res)=>{const u=new URL(req.url,'http://x');
 if(u.pathname==='/health')return send(res,200,{ok:true});
 if(u.pathname==='/api/dashboard')return send(res,200,dashboard(u.searchParams.get('range')));
 if(u.pathname==='/api/transactions'&&req.method==='GET')return send(res,200,[...tx].reverse().slice(0,50));
 if(u.pathname==='/api/transactions'&&req.method==='POST'){let b='';req.on('data',c=>{b+=c;if(b.length>1e4)req.destroy()});
  return req.on('end',()=>{try{const j=JSON.parse(b),a=Number(j.amount);
   if(!['in','out'].includes(j.type)||!(a>0)||a>1e9)return send(res,400,{error:'Enter a valid type and amount.'});
   const t={id:Date.now().toString(36),date:day(0),type:j.type,amount:Math.round(a*100)/100,note:String(j.note||'').slice(0,80)||(j.type==='in'?'Cash in':'Cash out')};
   tx.push(t);save();send(res,201,t)}catch{send(res,400,{error:'Bad request'})}})}
 let p=path.normalize(path.join(PUB,u.pathname==='/'?'index.html':u.pathname));
 if(!p.startsWith(PUB)||!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(PUB,'index.html');
 res.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream','Cache-Control':p.includes('assets')?'public,max-age=86400':'no-cache'});fs.createReadStream(p).pipe(res)
}).listen(PORT,()=>console.log('Finvia running on :'+PORT));
