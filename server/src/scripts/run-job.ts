// Run a background job once, from the shell.
//
//   node dist/scripts/run-job.js rollup [lookbackDays]
//   node dist/scripts/run-job.js retention
//   node dist/scripts/run-job.js health
//   node dist/scripts/run-job.js poll
//
// The scheduler runs all three on a timer; this exists for backfills (re-run
// the rollup over 400 days after importing history) and for verifying a fresh
// deploy without waiting for the first tick.
import { pool } from '../db.js';
import { runRollup } from '../jobs/rollup.js';
import { runRetention } from '../jobs/retention.js';
import { runHealthChecks } from '../jobs/health.js';
import { runPoll } from '../jobs/poll.js';

async function main(): Promise<void> {
  const job = process.argv[2];

  switch (job) {
    case 'rollup': {
      const days = Number(process.argv[3] ?? 3);
      const rows = await runRollup(Number.isFinite(days) && days > 0 ? days : 3);
      console.log(`rollup: ${rows} metric rows written`);
      break;
    }
    case 'retention': {
      const result = await runRetention();
      console.log('retention:', result);
      break;
    }
    case 'health': {
      const count = await runHealthChecks();
      console.log(`health: ${count} check(s) run`);
      break;
    }
    case 'poll': {
      const result = await runPoll();
      console.log('poll:', result);
      break;
    }
    default:
      console.error('Usage: run-job <rollup|retention|health|poll> [args]');
      process.exit(1);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
