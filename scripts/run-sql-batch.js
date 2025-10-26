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

// Split SQL content into individual statements
function splitSQLStatements(sqlContent) {
  const statements = [];
  let current = "";
  let inString = false;
  let stringChar = "";
  let escaped = false;

  for (let i = 0; i < sqlContent.length; i++) {
    const char = sqlContent[i];
    const prevChar = i > 0 ? sqlContent[i - 1] : "";

    // Handle escape sequences
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      current += char;
      continue;
    }

    // Handle string literals
    if ((char === "'" || char === '"') && !inString) {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }

    if (char === stringChar && inString) {
      inString = false;
      current += char;
      continue;
    }

    // Handle statement delimiter
    if (char === ";" && !inString) {
      current += char;
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith("--")) {
        statements.push(trimmed);
      }
      current = "";
      continue;
    }

    current += char;
  }

  // Add remaining content if any
  const trimmed = current.trim();
  if (trimmed && !trimmed.startsWith("--")) {
    statements.push(trimmed);
  }

  return statements;
}

async function runSqlFileBatched(sqlFilePath) {
  console.log("🚀 Starting SQL file execution (Batched Mode)...\n");

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
    console.log(`✅ SQL file read successfully (${(sqlContent.length / 1024 / 1024).toFixed(2)} MB)\n`);

    // Split into statements
    console.log("✂️  Splitting SQL into statements...");
    const statements = splitSQLStatements(sqlContent);
    console.log(`✅ Found ${statements.length} SQL statements\n`);

    // Execute statements in batches
    console.log("⚙️  Executing SQL statements...\n");

    const batchSize = 100; // Execute 100 statements at a time
    let executed = 0;
    let errors = 0;

    const startTime = Date.now();

    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(statements.length / batchSize);

      process.stdout.write(`\r📦 Batch ${batchNum}/${totalBatches} (${executed}/${statements.length} statements)...`);

      for (const statement of batch) {
        try {
          await client.query(statement);
          executed++;
        } catch (error) {
          errors++;
          console.error(`\n⚠️  Error executing statement (${executed + 1}):`);
          console.error(`   ${statement.substring(0, 100)}...`);
          console.error(`   Error: ${error.message}\n`);

          // Skip certain errors that are expected
          if (
            !error.message.includes("already exists") &&
            !error.message.includes("does not exist") &&
            errors > 10
          ) {
            throw new Error(`Too many errors (${errors}). Aborting.`);
          }
        }
      }

      // Small delay between batches to avoid overloading
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n\n✅ SQL execution completed!`);
    console.log(`   Total statements: ${statements.length}`);
    console.log(`   Successfully executed: ${executed}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   ⏱️  Duration: ${duration} seconds\n`);

    console.log("🎉 Done!");
  } catch (error) {
    console.error("\n\n❌ Error executing SQL file:");
    console.error(error.message);

    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
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

runSqlFileBatched(sqlFilePath);
