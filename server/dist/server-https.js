"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_https_1 = __importDefault(require("node:https"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const server_1 = __importDefault(require("./server")); // a meglévő Express app (default export)
const PORT = Number(process.env.PORT || 5174);
// cert fájlok
const certDir = node_path_1.default.resolve(process.cwd(), "certs"); // <-- NINCS '..'
const pfxPath = node_path_1.default.join(certDir, "pressair-local.pfx");
const passphrase = "pressair-pass"; // ugyanaz, mint az exportálásnál
console.log("CWD =", process.cwd());
console.log("PFX path =", pfxPath, "exists?", node_fs_1.default.existsSync(pfxPath));
const pfx = node_fs_1.default.readFileSync(pfxPath);
node_https_1.default.createServer({ pfx, passphrase }, server_1.default).listen(PORT, () => {
    console.log(`HTTPS server running at https://localhost:${PORT}`);
    console.log(`If SAN contains your LAN IP, also: https://<LAN_IP>:${PORT}`);
});
