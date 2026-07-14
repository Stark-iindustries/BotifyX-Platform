'use strict';

const axios = require('axios');

const GQL_URL    = 'https://backboard.railway.app/graphql/v2';
const BOTIFYX_REPO = process.env.BOTIFYX_REPO || 'Stark-iindustries/BotifyX';

function gql(token, query, variables = {}) {
  return axios.post(GQL_URL, { query, variables }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }).then(r => {
    if (r.data.errors) throw new Error(r.data.errors[0].message);
    return r.data.data;
  });
}

const TOKEN = () => {
  const t = process.env.RAILWAY_API_TOKEN;
  if (!t) throw new Error('RAILWAY_API_TOKEN not set on platform.');
  return t;
};

// ── Create project + service + set env vars ───────────────────────────────────
async function deploy(deploymentId, user, sessionId) {
  const token     = TOKEN();
  const shortId   = deploymentId.toString().padStart(6, '0');
  const projName  = `BotifyX-User-${user.id}-${shortId}`;

  // 1. Create project
  const { projectCreate } = await gql(token,
    `mutation($input: ProjectCreateInput!) {
       projectCreate(input: $input) { id name }
     }`,
    { input: { name: projName } }
  );
  const projectId = projectCreate.id;

  // 2. Get the production environment ID
  const { project } = await gql(token,
    `query($id: String!) {
       project(id: $id) {
         environments { edges { node { id name } } }
       }
     }`,
    { id: projectId }
  );
  const environments = project.environments.edges.map(e => e.node);
  const env = environments.find(e => e.name === 'production') || environments[0];
  if (!env) throw new Error('No environment found in Railway project.');
  const environmentId = env.id;

  // 3. Create service from GitHub repo
  const { serviceCreate } = await gql(token,
    `mutation($input: ServiceCreateInput!) {
       serviceCreate(input: $input) { id name }
     }`,
    { input: { projectId, name: 'botifyx', source: { repo: BOTIFYX_REPO } } }
  );
  const serviceId = serviceCreate.id;

  // 4. Set environment variables
  await gql(token,
    `mutation($input: VariableCollectionUpsertInput!) {
       variableCollectionUpsert(input: $input)
     }`,
    {
      input: {
        projectId,
        serviceId,
        environmentId,
        variables: {
          SESSION_ID:   sessionId,
          NODE_ENV:     'production',
          PLATFORM:     'railway',
        },
      },
    }
  );

  return {
    status: 'deploying',
    railway_project_id:     projectId,
    railway_service_id:     serviceId,
    railway_environment_id: environmentId,
  };
}

// ── Get latest deployment status ──────────────────────────────────────────────
async function getStatus(bot) {
  const token = TOKEN();
  const data = await gql(token,
    `query($input: DeploymentListInput!) {
       deployments(input: $input) {
         edges { node { id status url createdAt } }
       }
     }`,
    {
      input: {
        serviceId:     bot.railway_service_id,
        environmentId: bot.railway_environment_id,
      },
    }
  );
  const deployments = data.deployments.edges.map(e => e.node);
  if (!deployments.length) return { status: 'deploying', deploymentId: null, url: null };
  const latest = deployments[0];
  return {
    status:       normalizeStatus(latest.status),
    deploymentId: latest.id,
    url:          latest.url || null,
  };
}

// ── Get logs ──────────────────────────────────────────────────────────────────
async function getLogs(bot) {
  const token = TOKEN();
  if (!bot.railway_deployment_id) {
    // fetch latest deployment ID first
    const s = await getStatus(bot);
    if (!s.deploymentId) return [];
    bot = { ...bot, railway_deployment_id: s.deploymentId };
  }
  const data = await gql(token,
    `query($deploymentId: String!) {
       deploymentLogs(deploymentId: $deploymentId) {
         message timestamp severity
       }
     }`,
    { deploymentId: bot.railway_deployment_id }
  );
  return data.deploymentLogs || [];
}

// ── Restart ───────────────────────────────────────────────────────────────────
async function restart(bot) {
  const token = TOKEN();
  if (!bot.railway_deployment_id) throw new Error('No active deployment to restart.');
  await gql(token,
    `mutation($id: String!) { deploymentRestart(id: $id) }`,
    { id: bot.railway_deployment_id }
  );
}

// ── Delete project (removes everything) ──────────────────────────────────────
async function remove(bot) {
  const token = TOKEN();
  if (!bot.railway_project_id) return;
  await gql(token,
    `mutation($id: String!) { projectDelete(id: $id) }`,
    { id: bot.railway_project_id }
  );
}

function normalizeStatus(railwayStatus) {
  const map = {
    SUCCESS:   'running',
    DEPLOYING: 'deploying',
    BUILDING:  'deploying',
    FAILED:    'failed',
    CRASHED:   'crashed',
    REMOVED:   'stopped',
    REMOVING:  'stopped',
    SLEEPING:  'stopped',
  };
  return map[railwayStatus] || railwayStatus?.toLowerCase() || 'unknown';
}

module.exports = { deploy, getStatus, getLogs, restart, remove };
