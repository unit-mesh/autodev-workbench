import { AgentConfig, AgentResponse, AIAgent } from "../agent";
import { FeatureRequestPlaybook } from "../playbooks/feature-request-playbook";

export interface FeatureAnalysisAgentConfig extends AgentConfig {
  analysisStrategy?: 'requirements-first' | 'technical-first';
  generateTechnicalDocs?: boolean;
  analyzeCompatibility?: boolean;
}

export class FeatureAnalysisAgent extends AIAgent {
  protected featureAnalysisConfig: FeatureAnalysisAgentConfig;
  protected featureRequestPlaybook: FeatureRequestPlaybook;

  constructor(config: FeatureAnalysisAgentConfig = {}) {
    super(config);
    this.featureAnalysisConfig = {
      analysisStrategy: 'requirements-first',
      generateTechnicalDocs: true,
      analyzeCompatibility: true,
      ...config
    };

    this.featureRequestPlaybook = new FeatureRequestPlaybook();
    this.log('FeatureAnalysisAgent 已初始化，使用策略:', this.featureAnalysisConfig.analysisStrategy);
  }

  /**
   * 重写 start 方法以使用特定的 Playbook
   */
  async start(input: string): Promise<AgentResponse> {
    this.playbook = this.featureRequestPlaybook;
    return super.start(input);
  }
}
