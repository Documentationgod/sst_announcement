import { validateEnv } from './env';

type DeploymentProfile = 'local' | 'production';

const profiles: Record<DeploymentProfile, { frontendUrl: string; backendUrl: string }> = {
  local: {
    frontendUrl: 'http://localhost:3000',
    backendUrl: 'http://localhost:3000',
  },
  production: {
    frontendUrl: 'https://sst-announcement.vercel.app',
    backendUrl: 'https://sst-announcement.vercel.app',
  },
};

export interface RuntimeConfig {
  deployment: DeploymentProfile;
  frontendUrl: string;
  backendUrl: string;
}

export function getConfig(): RuntimeConfig {
  const env = validateEnv();
  const deployment = (env.DEPLOYMENT === 'production' ? 'production' : 'local') as DeploymentProfile;
  const defaults = profiles[deployment];

  const config = {
    deployment,
    frontendUrl: env.FRONTEND_URL || defaults.frontendUrl,
    backendUrl: env.BACKEND_URL || defaults.backendUrl,
  };

  return config;
}
