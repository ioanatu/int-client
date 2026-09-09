import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import.meta.env.VITE_API_URL;

const distFolder = path.join(process.cwd(), 'dist');
const indexPath = path.join(distFolder, 'index.html');

const sha256 = (content) => crypto.createHash('sha256').update(content).digest('base64');
const generateFileHash = (filePath) => sha256(fs.readFileSync(filePath));

const updateCSPAndAddIntegrity = (htmlFilePath) => {
  let htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
  const scriptRegex = /<script(.*)src="(.*)"><\/script>/g;

  let match = scriptRegex.exec(htmlContent);
  const hashes = [];

  while (match !== null) {
    const scriptPath = path.join(distFolder, match[2]);
    const hash = generateFileHash(scriptPath);
    hashes.push(`'sha256-${hash}'`);

    const integrityAttr = ` integrity="sha256-${hash}"`;
    htmlContent = htmlContent.replace(
      match[0],
      `<script${match[1]}src="${match[2]}"${integrityAttr}></script>`,
    );
    match = scriptRegex.exec(htmlContent);
  }

  const inlineScriptRegex = /<script>([\s\S]*?)<\/script>/g;
  match = inlineScriptRegex.exec(htmlContent);

  while (match !== null) {
    const scriptContent = match[1];
    const hash = sha256(scriptContent);
    hashes.push(`'sha256-${hash}'`);

    const integrityAttr = ` integrity="sha256-${hash}"`;
    htmlContent = htmlContent.replace(
      match[0],
      `<script${integrityAttr}>${scriptContent}</script>`,
    );
    match = inlineScriptRegex.exec(htmlContent);
  }

  if (!hashes.length) {
    throw new Error('No script tags found in index.html.');
  }
  console.log(`${hashes.length} integrity attributes added to script tags.`);

  const connectSrcEndpoints = [process.env.VITE_API_URL].filter(Boolean).join(' ');

  console.log('_________ ', import.meta.env.VITE_API_URL);

  const meta = `<meta http-equiv="Content-Security-Policy" content="script-src 'strict-dynamic' ${hashes.join(' ')};  connect-src ${connectSrcEndpoints}; object-src 'none'; base-uri 'none';" />`;

  const updatedHtmlContent = htmlContent.replace(
    /<meta[^>]*http-equiv="Content-Security-Policy"[^>]*>/,
    meta,
  );

  fs.writeFileSync(htmlFilePath, updatedHtmlContent, 'utf-8');
  console.log(
    'index.html updated with new Content-Security-Policy meta tag and integrity attributes.',
  );
  process.exit(0);
};

updateCSPAndAddIntegrity(indexPath);
