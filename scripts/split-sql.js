import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function splitSQLFile(sqlFilePath, linesPerFile = 1000) {
  console.log("✂️  Starting SQL file splitting...\n");

  // Read SQL file
  console.log("📖 Reading SQL file...");
  const sqlContent = readFileSync(sqlFilePath, "utf-8");
  const lines = sqlContent.split("\n");
  console.log(`✅ Read ${lines.length.toLocaleString()} lines\n`);

  // Create output directory
  const outputDir = join(dirname(__dirname), "sql-chunks");
  mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Output directory: ${outputDir}\n`);

  // Split into chunks
  const totalChunks = Math.ceil(lines.length / linesPerFile);
  console.log(`📦 Splitting into ${totalChunks} chunks (${linesPerFile} lines each)...\n`);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * linesPerFile;
    const end = Math.min((i + 1) * linesPerFile, lines.length);
    const chunk = lines.slice(start, end).join("\n");

    const chunkFilePath = join(outputDir, `chunk_${String(i + 1).padStart(3, "0")}.sql`);
    writeFileSync(chunkFilePath, chunk, "utf-8");

    console.log(`✅ Created: chunk_${String(i + 1).padStart(3, "0")}.sql (${end - start} lines)`);
  }

  console.log(`\n🎉 Done! Created ${totalChunks} SQL files in ${outputDir}`);
  console.log(`\n💡 You can now import them one by one using:`);
  console.log(`   node scripts/run-sql-batch.js sql-chunks/chunk_001.sql`);
  console.log(`   node scripts/run-sql-batch.js sql-chunks/chunk_002.sql`);
  console.log(`   ...`);
}

// Get SQL file path from command line argument or use default
const sqlFilePath =
  process.argv[2] || join(dirname(__dirname), "dbElearningLocal_full.sql");

const linesPerFile = process.argv[3] ? parseInt(process.argv[3]) : 1000;

splitSQLFile(sqlFilePath, linesPerFile);
