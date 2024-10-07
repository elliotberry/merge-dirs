import { spawn } from 'child_process';
import fs from 'fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'path';

const tempDir = path.join(process.cwd(), 'temp');

async function setupFolders() {
  const folderA = path.join(tempDir, 'folderA');
  const folderB = path.join(tempDir, 'folderB');

  await fs.mkdir(tempDir, { recursive: true });
  await fs.mkdir(folderA, { recursive: true });
  await fs.mkdir(folderB, { recursive: true });

  await fs.writeFile(path.join(folderA, 'file1.txt'), 'Hello from file1');
  await fs.writeFile(path.join(folderB, 'file1.txt'), 'Hello from file1');
  await fs.writeFile(path.join(folderB, 'file2.txt'), 'Hello from file2');

  return { folderA, folderB };
}

async function deleteFolders() {
  await fs.rm(tempDir, { force: true, recursive: true });
}

async function runMergeScript(folderA, folderB) {
  return new Promise((resolve, reject) => {
    const script = spawn('node', ['../index.js', folderA, folderB]);

    script.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
  });
}

test('should merge two folders correctly', async (t) => {
  const { folderA, folderB } = await setupFolders();

  await runMergeScript(folderA, folderB);

  // Verify files after merging
  const filesInFolderA = await fs.readdir(folderA);
  assert.deepEqual(filesInFolderA.sort(), ['file1.txt', 'file2.txt']);

  await deleteFolders();
});