import path from 'path';

/**
 * Central path resolver for thepopebot.
 * All paths resolve from process.cwd() (the user's project root).
 */

const PROJECT_ROOT = process.cwd();

export {
  PROJECT_ROOT,
};

// config/ files
export const configDir = path.join(PROJECT_ROOT, 'config');
export const cronsFile = path.join(PROJECT_ROOT, 'config', 'CRONS.json');
export const triggersFile = path.join(PROJECT_ROOT, 'config', 'TRIGGERS.json');
export const agentJobPlanningMd = path.join(PROJECT_ROOT, 'config', 'agent-chat', 'SYSTEM.md');
export const codePlanningMd = path.join(PROJECT_ROOT, 'config', 'code-chat', 'SYSTEM.md');
export const agentJobSummaryMd = path.join(PROJECT_ROOT, 'config', 'agent-job', 'SUMMARY.md');
export const claudeMd = path.join(PROJECT_ROOT, 'CLAUDE.md');

// Skills directory
export const skillsDir = path.join(PROJECT_ROOT, 'skills');

// Working directories for command-type actions
export const cronDir = path.join(PROJECT_ROOT, 'cron');
export const triggersDir = path.join(PROJECT_ROOT, 'triggers');

// Logs
export const logsDir = path.join(PROJECT_ROOT, 'logs');

// Database
export const thepopebotDb = process.env.DATABASE_PATH || path.join(PROJECT_ROOT, 'data', 'db', 'thepopebot.sqlite');

// Cluster data (bind-mount root for cluster containers)
export const clusterDataDir = process.env.CLUSTER_DATA_PATH || path.join(PROJECT_ROOT, 'data', 'clusters');

// Code workspace data (bind-mount root for workspace containers)
export const workspacesDir = path.join(PROJECT_ROOT, 'data', 'workspaces');

// .env
export const envFile = path.join(PROJECT_ROOT, '.env');
