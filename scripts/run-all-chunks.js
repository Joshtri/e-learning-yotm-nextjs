import { readdirSync } from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runChunk(chunkPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["scripts/run-sql-batch.js", chunkPath], {
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Chunk failed with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

async function runAllChunks() {
  console.log("🚀 Running all SQL chunks...\n");

  const chunksDir = join(dirname(__dirname), "sql-chunks");

  try {
    const files = readdirSync(chunksDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log(`📦 Found ${files.length} SQL chunks\n`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Processing chunk ${i + 1}/${files.length}: ${file}`);
      console.log("=".repeat(60) + "\n");

      const chunkPath = join(chunksDir, file);
      await runChunk(chunkPath);

      console.log(`\n✅ Chunk ${i + 1}/${files.length} completed!\n`);

      // Small delay between chunks
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 ALL CHUNKS COMPLETED!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error running chunks:");
    console.error(error.message);
    process.exit(1);
  }
}

runAllChunks();
