import { spawn } from 'child_process';
import path from 'path';

import fs from 'fs';

const logFile = path.join(process.cwd(), 'python_test_log.txt');
fs.writeFileSync(logFile, 'Starting Python Test...\n');

function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
}

log('Testing Python environment from Node.js...');

function testCommand(cmd) {
    log(`Scanning command: ${cmd}`);
    const p = spawn(cmd, ['-c', 'import sys; print("Exec: " + sys.executable); import pdfplumber; print("SUCCESS: pdfplumber imported")']);

    p.stdout.on('data', d => log(`[${cmd}] STDOUT: ${d.toString().trim()}`));
    p.stderr.on('data', d => log(`[${cmd}] STDERR: ${d.toString().trim()}`));
    p.on('error', e => log(`[${cmd}] SPAWN ERROR: ${e.message}`));
    p.on('close', code => log(`[${cmd}] Exited with code: ${code}`));
}

// Test default 'python'
testCommand('python');

// Test 'py' launcher
testCommand('py');

// Test specific path from user logs
testCommand('c:\\python\\python312\\python.exe');
