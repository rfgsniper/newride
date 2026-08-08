import { runIngestion } from "./ingest-marketcheck-lib.ts";

runIngestion()
  .then((result) => {
    console.log(result.log.join("\n"));
    console.log(`Done. ${result.seen} listings seen this run.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Ingestion failed:", err);
    process.exit(1);
  });
