// Synthetic loopback-only upstream for the production NextAuth credentials route.
import http from 'node:http';
const roles=['CUSTOMER','OWNER','ADMIN'];
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
http.createServer(async (req,res) => {
  res.setHeader('Content-Type','application/json');
  if (req.url==='/_test/health') return res.end('{}');
  if (req.url==='/api/auth/login' && req.method==='POST') {
    let text=''; for await (const chunk of req) text+=chunk;
    let body; try {body=JSON.parse(text);} catch {res.statusCode=400;return res.end('{}');}
    const index=roles.findIndex(role => body.usernameOrEmail===role.toLowerCase()+'@example.invalid');
    if (index<0 || body.password!=='synthetic-browser-password') {res.statusCode=401;return res.end('{}');}
    return res.end(JSON.stringify({token:'synthetic-internal-token-'+roles[index],userId:ids[index],role:roles[index],email:body.usernameOrEmail,fullName:'Synthetic '+roles[index]}));
  }
  if(req.url==='/api/auth/logout' && req.method==='POST') return res.end('{"success":true}');
  res.statusCode=503;res.end('{}');
}).listen(3351,'127.0.0.1');
