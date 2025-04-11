import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fs from 'node:fs';

export function createTempWorkflowFile(
  workingDir: string,
  workflowBody: string,
): string {
  const fileName = join(workingDir, 'workflow.yml');
  console.log(`Writing workflow body to file ${fileName}`);
  fs.writeFileSync(fileName, workflowBody);
  return fileName;
}

export function cleanupDir(workingDir: string) {
  const files = fs.readdirSync(workingDir);
  files.forEach((file) => fs.rmSync(join(workingDir, file)));
}

export function createTempDir(): string {
  const prefix = join(tmpdir(), 'act-test-runner');
  return fs.mkdtempSync(prefix);
}
