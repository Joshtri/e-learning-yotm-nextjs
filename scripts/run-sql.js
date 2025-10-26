import { readFileSync } from "fs";
import { Client } from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually from .env file
function loadEnv() {
  try {
    const envPath = join(dirname(__dirname), ".env");
    const envContent = readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");

    lines.forEach((line) => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove quotes if present
          value = value.replace(/^["'](.*)["']$/, "$1");
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.error("❌ Failed to load .env file");
    console.error(error.message);
  }
}

loadEnv();

async function runSqlFile(sqlFilePath) {
  console.log("🚀 Starting SQL file execution...\n");

  // Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not found in .env file");
    process.exit(1);
  }

  console.log(`📁 SQL File: ${sqlFilePath}`);
  console.log(`🔗 Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}\n`);

  // Create PostgreSQL client
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    // Connect to database
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Connected to database\n");

    // Read SQL file
    console.log("📖 Reading SQL file...");
    const sqlContent = readFileSync(sqlFilePath, "utf-8");
    console.log(`✅ SQL file read successfully (${sqlContent.length} characters)\n`);

    // Execute SQL
    console.log("⚙️  Executing SQL commands...\n");
    console.log("⏳ This may take a while depending on the file size...\n");

    const startTime = Date.now();

    // Execute the entire SQL content
    await client.query(sqlContent);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ SQL file executed successfully!`);
    console.log(`⏱️  Duration: ${duration} seconds\n`);

    console.log("🎉 Done!");
  } catch (error) {
    console.error("\n❌ Error executing SQL file:");
    console.error(error.message);

    if (error.position) {
      console.error(`\n📍 Error at position: ${error.position}`);
    }

    if (error.detail) {
      console.error(`\n📝 Detail: ${error.detail}`);
    }

    process.exit(1);
  } finally {
    // Close connection
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

// Get SQL file path from command line argument or use default
const sqlFilePath =
  process.argv[2] || join(dirname(__dirname), "dbElearningLocal_full.sql");

runSqlFile(sqlFilePath);
