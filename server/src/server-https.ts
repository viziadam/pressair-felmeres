import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import app from "./server"; // a meglévő Express app (default export)

const PORT = Number(process.env.PORT || 5174);

// cert fájlok
const certDir = path.resolve(process.cwd(), "certs"); // <-- NINCS '..'
const pfxPath = path.join(certDir, "pressair-local.pfx");
const passphrase = "pressair-pass"; // ugyanaz, mint az exportálásnál

console.log("CWD =", process.cwd());
console.log("PFX path =", pfxPath, "exists?", fs.existsSync(pfxPath));

const pfx = fs.readFileSync(pfxPath);

https.createServer({ pfx, passphrase }, app).listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
  console.log(`If SAN contains your LAN IP, also: https://<LAN_IP>:${PORT}`);
});