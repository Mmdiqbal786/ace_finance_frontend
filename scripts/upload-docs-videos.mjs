/**
 * Upload voiced walkthrough MP4s to Azure Blob (private container + read SAS).
 * Account may disallow anonymous public access — SAS is the supported path.
 *
 *   npm run docs:upload-videos
 *
 * Reads AZURE_STORAGE_CONNECTION_STRING from env or ../ace_finance_backend/.env
 * Optional: DOCS_VIDEOS_CONTAINER=ace-finance-docs-videos
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, '..');
const BACKEND_ROOT = path.resolve(FRONTEND_ROOT, '..', 'ace_finance_backend');
const LOCAL_DIR = path.join(
  FRONTEND_ROOT,
  'docs',
  'videos',
  'role-walkthroughs',
  'with-voice',
);
const CONTAINER =
  process.env.DOCS_VIDEOS_CONTAINER?.trim() || 'ace-finance-docs-videos';
/** Read SAS validity (years) — Demo Guide embeds these training clips. */
const SAS_YEARS = Number(process.env.DOCS_VIDEOS_SAS_YEARS || 5);

const FILES = [
  '01-requester-demo.mp4',
  '02-approver-demo.mp4',
  '03-processor-demo.mp4',
  '04-admin-demo.mp4',
];

function loadConnFromBackendEnv() {
  const envPath = path.join(BACKEND_ROOT, '.env');
  if (!fs.existsSync(envPath)) return '';
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*AZURE_STORAGE_CONNECTION_STRING\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    return v.trim();
  }
  return '';
}

function parseConn(conn) {
  const parts = Object.fromEntries(
    conn.split(';').filter(Boolean).map((p) => {
      const i = p.indexOf('=');
      return i === -1 ? [p, ''] : [p.slice(0, i), p.slice(i + 1)];
    }),
  );
  const accountName = parts.AccountName || '';
  const accountKey = parts.AccountKey || '';
  if (!accountName || !accountKey) {
    throw new Error('Connection string missing AccountName or AccountKey');
  }
  return { accountName, accountKey };
}

function loadBlobSdk() {
  const requireFromBackend = createRequire(path.join(BACKEND_ROOT, 'package.json'));
  try {
    return requireFromBackend('@azure/storage-blob');
  } catch {
    throw new Error(
      'Cannot load @azure/storage-blob — run npm install in ace_finance_backend first.',
    );
  }
}

async function main() {
  const conn =
    process.env.AZURE_STORAGE_CONNECTION_STRING?.trim() || loadConnFromBackendEnv();
  if (!conn) {
    throw new Error(
      'AZURE_STORAGE_CONNECTION_STRING missing (env or ace_finance_backend/.env)',
    );
  }

  for (const name of FILES) {
    const full = path.join(LOCAL_DIR, name);
    if (!fs.existsSync(full)) {
      throw new Error(
        `Missing local file: ${full}\nMux videos first (see docs/videos/README.md).`,
      );
    }
  }

  const {
    BlobServiceClient,
    BlobSASPermissions,
    generateBlobSASQueryParameters,
    StorageSharedKeyCredential,
    SASProtocol,
  } = loadBlobSdk();

  const { accountName, accountKey } = parseConn(conn);
  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const service = BlobServiceClient.fromConnectionString(conn);
  const container = service.getContainerClient(CONTAINER);

  // Private container (public access often disabled on the account)
  const create = await container.createIfNotExists();
  if (create.succeeded) {
    console.log(`Created private container "${CONTAINER}"`);
  } else {
    console.log(`Using existing container "${CONTAINER}"`);
  }

  const baseUrl = `https://${accountName}.blob.core.windows.net/${CONTAINER}`;

  for (const name of FILES) {
    const full = path.join(LOCAL_DIR, name);
    const blobPath = `role-walkthroughs/${name}`;
    const block = container.getBlockBlobClient(blobPath);
    const data = fs.readFileSync(full);
    await block.uploadData(data, {
      blobHTTPHeaders: {
        blobContentType: 'video/mp4',
        blobCacheControl: 'public, max-age=86400',
      },
      overwrite: true,
    });
    const mb = (data.length / (1024 * 1024)).toFixed(1);
    console.log(`Uploaded ${blobPath} (${mb} MB)`);
  }

  const startsOn = new Date(Date.now() - 5 * 60 * 1000);
  const expiresOn = new Date();
  expiresOn.setFullYear(expiresOn.getFullYear() + SAS_YEARS);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: CONTAINER,
      permissions: BlobSASPermissions.parse('r'),
      startsOn,
      expiresOn,
      protocol: SASProtocol.Https,
    },
    credential,
  ).toString();

  console.log('\n--- SWA / .env.deploy ---');
  console.log(`NEXT_PUBLIC_DOCS_VIDEOS_BASE_URL=${baseUrl}`);
  console.log(`NEXT_PUBLIC_DOCS_VIDEOS_SAS=${sas}`);
  console.log(`\nSAS expires: ${expiresOn.toISOString()} (${SAS_YEARS}y read)`);
  console.log('Redeploy frontend: npm run deploy:azure');

  // Write local hint file (gitignored via with-voice / or use .env.deploy merge)
  const hintPath = path.join(LOCAL_DIR, 'azure-urls.env');
  fs.writeFileSync(
    hintPath,
    `NEXT_PUBLIC_DOCS_VIDEOS_BASE_URL=${baseUrl}\nNEXT_PUBLIC_DOCS_VIDEOS_SAS=${sas}\n`,
    'utf8',
  );
  console.log(`\nAlso wrote ${hintPath} (do not commit SAS).`);
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
