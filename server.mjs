import http from 'node:http';
import {readFile, realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const argument = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const host = argument('--host', '127.0.0.1');
const port = Number(argument('--port', process.env.PORT || '4173'));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.md':'text/plain; charset=utf-8'};
const server = http.createServer(async (req,res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const candidate = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const target = await realpath(candidate);
    if (!target.startsWith(root + path.sep) || path.relative(root,target).split(path.sep).some(part => part.startsWith('.'))) {res.writeHead(403);res.end('Forbidden');return;}
    const content = await readFile(target);
    res.writeHead(200, {'Content-Type':types[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.on('error', err => {console.error(`Could not start Cloudroom: ${err.message}`);process.exit(1);});
server.listen(port,host,()=>{console.log(`Cloudroom is ready at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}\nPress Ctrl+C to stop.`);});
