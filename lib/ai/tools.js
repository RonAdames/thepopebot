import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { createAgentJob } from '../tools/create-agent-job.js';
import { getAgentJobStatus } from '../tools/github.js';
import { getConfig } from '../config.js';

const createAgentJobTool = tool(
  async ({ prompt }) => {
    const result = await createAgentJob(prompt);
    return JSON.stringify({
      success: true,
      agent_job_id: result.agent_job_id,
      branch: result.branch,
      title: result.title,
    });
  },
  {
    name: 'create_agent_job',
    description:
      'Use when asked to create an agent job. Create an autonomous agent job that runs a Docker agent in a container. The Docker agent has full filesystem access, web search, browser automation, and other abilities. The agent job description you provide becomes the Docker agent\'s task prompt. Returns the agent job ID and branch name.',
    schema: z.object({
      prompt: z
        .string()
        .describe(
          'Detailed agent job description including context and requirements. Be specific about what needs to be done.'
        ),
    }),
  }
);

const getAgentJobStatusTool = tool(
  async ({ agent_job_id }) => {
    const result = await getAgentJobStatus(agent_job_id);
    return JSON.stringify(result);
  },
  {
    name: 'get_agent_job_status',
    description:
      'Use when you want to get the status of an agent job created with create_agent_job that returned an agent job ID. IMPORTANT: only use this to get status on an agent job you recently ran with create_agent_job.',
    schema: z.object({
      agent_job_id: z
        .string()
        .optional()
        .describe(
          'Optional: specific agent job ID to check. If omitted, returns all running agent jobs.'
        ),
    }),
  }
);

/**
 * Tool for planning/coding on the thepopebot repo itself (agent mode).
 * Reads workspaceId and codeModeType from runtime.config.configurable.
 */
const popebotCodingTool = tool(
  async ({ prompt }, runtime) => {
    try {
      const { randomUUID } = await import('crypto');
      const { workspaceId, codeModeType } = runtime.config.configurable;

      const ghOwner = getConfig('GH_OWNER');
      const ghRepo = getConfig('GH_REPO');
      if (!ghOwner || !ghRepo) {
        return JSON.stringify({ success: false, error: 'GH_OWNER or GH_REPO not configured' });
      }
      const repo = `${ghOwner}/${ghRepo}`;

      const { getCodeWorkspaceById } = await import('../db/code-workspaces.js');
      const workspace = getCodeWorkspaceById(workspaceId);
      const featureBranch = workspace?.featureBranch || `thepopebot/new-chat-${workspaceId.replace(/-/g, '').slice(0, 8)}`;
      const mode = codeModeType === 'code' ? 'dangerous' : 'plan';

      const codingAgent = workspace?.codingAgent || getConfig('CODING_AGENT') || 'claude-code';
      const containerName = `${codingAgent}-headless-${randomUUID().slice(0, 8)}`;

      const { runHeadlessContainer } = await import('../tools/docker.js');
      const { backendApi } = await runHeadlessContainer({
        containerName,
        repo,
        branch: 'main',
        featureBranch,
        workspaceId,
        taskPrompt: prompt,
        mode,
        codingAgent,
      });

      return JSON.stringify({
        success: true,
        status: 'started',
        containerName,
        featureBranch,
        codingAgent,
        backendApi,
      });
    } catch (err) {
      console.error('[plan_popebot_updates] Failed:', err);
      return JSON.stringify({
        success: false,
        error: err.message || 'Failed to launch investigation container',
      });
    }
  },
  {
    name: 'plan_popebot_updates',
    description:
      'Use when developing a plan to a prompt, cron, trigger, skill or ANY code update to an installed ThePopeBot repository instance. Or when PopeBot debugging issues.',
    schema: z.object({
      prompt: z.string().describe(
        'A direct copy of the coding task including all relevant context from the conversation.'
      ),
    }),
    returnDirect: true,
  }
);

/**
 * Static tool for headless coding on any repo (code mode).
 * Reads repo, branch, workspaceId, codeModeType from runtime.config.configurable.
 */
const headlessCodingTool = tool(
  async ({ prompt }, runtime) => {
    try {
      const { randomUUID } = await import('crypto');
      const { repo, branch, workspaceId, codeModeType } = runtime.config.configurable;

      const { getCodeWorkspaceById } = await import('../db/code-workspaces.js');
      const workspace = getCodeWorkspaceById(workspaceId);
      const featureBranch = workspace?.featureBranch || `thepopebot/new-chat-${workspaceId.replace(/-/g, '').slice(0, 8)}`;
      const mode = codeModeType === 'code' ? 'dangerous' : 'plan';

      const { runHeadlessContainer } = await import('../tools/docker.js');
      const codingAgent = workspace?.codingAgent || getConfig('CODING_AGENT') || 'claude-code';
      const containerName = `${codingAgent}-headless-${randomUUID().slice(0, 8)}`;

      const { backendApi } = await runHeadlessContainer({
        containerName, repo, branch, featureBranch, workspaceId,
        taskPrompt: prompt,
        mode,
        codingAgent,
      });

      return JSON.stringify({
        success: true,
        status: 'started',
        containerName,
        featureBranch,
        codingAgent,
        backendApi,
      });
    } catch (err) {
      console.error('[start_headless_coding_agent] Failed:', err);
      return JSON.stringify({
        success: false,
        error: err.message || 'Failed to launch headless coding task',
      });
    }
  },
  {
    name: 'start_headless_coding_agent',
    description:
      'Use when you need to plan or execute a coding task.',
    schema: z.object({
      prompt: z.string().describe(
        'A direct copy of the coding task including all relevant context from the conversation.'
      ),
    }),
    returnDirect: true,
  }
);

export { createAgentJobTool, getAgentJobStatusTool, popebotCodingTool, headlessCodingTool };
