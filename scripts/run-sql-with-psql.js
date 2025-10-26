import { spawn } from "child_process";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { URL } from "url";

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

async function runSqlFileWithPsql(sqlFilePath) {
  console.log("🚀 Starting SQL file execution with psql...\n");

  // Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not found in .env file");
    process.exit(1);
  }

  console.log(`📁 SQL File: ${sqlFilePath}`);
  console.log(`🔗 Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}\n`);

  // Parse connection string
  let dbConfig;
  try {
    const url = new URL(databaseUrl);
    dbConfig = {
      host: url.hostname,
      port: url.port || 5432,
      database: url.pathname.substring(1),
      username: url.username,
      password: url.password,
      sslmode: url.searchParams.get("sslmode") || "prefer",
    };
  } catch (error) {
    console.error("❌ Failed to parse DATABASE_URL");
    console.error(error.message);
    process.exit(1);
  }

  console.log("🔌 Connecting to database with psql...\n");
  console.log("⏳ This may take a while depending on the file size...\n");

  // Build psql command
  const args = [
    "-h",
    dbConfig.host,
    "-p",
    dbConfig.port,
    "-U",
    dbConfig.username,
    "-d",
    dbConfig.database,
    "-f",
    sqlFilePath,
  ];

  const env = {
    ...process.env,
    PGPASSWORD: dbConfig.password,
  };

  const startTime = Date.now();

  // Execute psql
  const psql = spawn("psql", args, {
    env,
    stdio: "inherit",
  });

  psql.on("error", (error) => {
    if (error.code === "ENOENT") {
      console.error("\n❌ psql command not found!");
      console.error(
        "   Please make sure PostgreSQL is installed and psql is in your PATH"
      );
      console.error(
        "\n   Alternative: Use the run-sql.js script instead (uses pg library)"
      );
    } else {
      console.error("\n❌ Error executing psql:");
      console.error(error.message);
    }
    process.exit(1);
  });

  psql.on("close", (code) => {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (code === 0) {
      console.log(`\n✅ SQL file executed successfully!`);
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log("\n🎉 Done!");
    } else {
      console.error(`\n❌ psql exited with code ${code}`);
      process.exit(code);
    }
  });
}

// Get SQL file path from command line argument or use default
const sqlFilePath =
  process.argv[2] || join(dirname(__dirname), "dbElearningLocal_full.sql");

runSqlFileWithPsql(sqlFilePath);
