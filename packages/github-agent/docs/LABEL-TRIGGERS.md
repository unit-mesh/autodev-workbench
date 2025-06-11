# 🏷️ Label-Triggered AI Agent Analysis

The AI Agent now supports intelligent analysis triggered by GitHub issue labels. When specific labels are added to issues, the agent automatically provides specialized analysis tailored to that label's context.

## 🚀 How It Works

1. **Label Detection**: When a label is added to an issue, GitHub Actions triggers the AI Agent
2. **Smart Analysis**: The agent generates label-specific analysis commands based on the label type
3. **Contextual Response**: The agent provides specialized insights and recommendations for that label category

## 📋 Supported Labels

### 🔧 Technical Analysis Labels

| Label | Analysis Focus | Key Features |
|-------|----------------|--------------|
| `bug` | Bug Analysis | Root cause identification, debugging guidance, fix suggestions |
| `enhancement` | Feature Analysis | Feasibility assessment, implementation approach, complexity estimation |
| `performance` | Performance Analysis | Bottleneck identification, optimization strategies, benchmarking |
| `security` | Security Audit | Vulnerability assessment, security best practices, remediation steps |
| `refactor` | Refactoring Analysis | Code smell identification, refactoring strategies, impact assessment |

### 🎯 Priority & Workflow Labels

| Label | Analysis Focus | Key Features |
|-------|----------------|--------------|
| `critical` | Urgent Analysis | Impact assessment, emergency fixes, mitigation strategies |
| `needs-analysis` | Deep Analysis | Comprehensive technical analysis, multiple solution approaches |
| `help-wanted` | Community Analysis | Newcomer-friendly explanations, contribution guidance |
| `good-first-issue` | Beginner Analysis | Step-by-step guidance, learning resources, mentoring points |

### 🏗️ Domain-Specific Labels

| Label | Analysis Focus | Key Features |
|-------|----------------|--------------|
| `frontend` | Frontend Analysis | UI/UX implications, frontend best practices, accessibility |
| `backend` | Backend Analysis | Server architecture, API design, scalability considerations |
| `api` | API Analysis | RESTful design, documentation, versioning strategies |
| `database` | Database Analysis | Schema design, query optimization, migration strategies |

## 🔄 Workflow Integration

### Automatic Triggers

The AI Agent automatically triggers when these events occur:

```yaml
on:
  issues:
    types: [labeled]
```

### Smart Command Generation

The agent generates specialized commands based on the label:

```javascript
// Example for 'bug' label
"Issue #123 has been labeled as a bug. Perform comprehensive bug analysis: 
1) Examine related code to identify the root cause, 
2) Trace the bug's impact across the system, 
3) Provide step-by-step debugging guidance, 
4) Suggest specific code fixes with examples, 
5) Recommend testing strategies to prevent regression."
```

## 🛠️ Setup Instructions

### 1. Enable Label Triggers

Add the label trigger workflow to your repository:

```yaml
# .github/workflows/ai-agent-label-trigger.yml
name: AI Agent - Label Triggered Analysis
on:
  issues:
    types: [labeled]
jobs:
  label-triggered-analysis:
    runs-on: ubuntu-latest
    # ... (see full workflow file)
```

### 2. Configure Environment Variables

Ensure these environment variables are set:

```bash
GITHUB_TOKEN=your_github_token
DEEPSEEK_TOKEN=your_deepseek_token  # or other LLM provider
```

### 3. Test the Setup

Use the provided test script:

```bash
cd packages/github-agent
node test-label-trigger.js
```

## 📊 Usage Examples

### Example 1: Bug Analysis
1. Create an issue describing a bug
2. Add the `bug` label
3. AI Agent automatically analyzes the issue and provides:
   - Root cause analysis
   - Debugging steps
   - Code fix suggestions
   - Testing recommendations

### Example 2: Feature Request
1. Create an issue for a new feature
2. Add the `enhancement` label
3. AI Agent provides:
   - Feasibility assessment
   - Implementation approach
   - Complexity estimation
   - Risk analysis

### Example 3: Security Issue
1. Report a security concern
2. Add the `security` label
3. AI Agent performs:
   - Security audit
   - Vulnerability assessment
   - Remediation guidance
   - Best practices recommendations

## 🎯 Advanced Features

### Multi-Label Analysis

When multiple important labels are present, the agent provides comprehensive analysis:

```javascript
// Example: Issue with both 'critical' and 'security' labels
"Issue #123 has multiple high-priority labels: [critical, security]. 
Provide comprehensive analysis considering all these aspects..."
```

### Special Workflows

#### Critical Issues
Issues labeled with `critical`, `security`, or `breaking-change` trigger:
- Extended analysis time (15 minutes vs 10 minutes)
- Deep analysis mode
- Automatic team notifications
- Priority handling

#### Newcomer-Friendly Issues
Issues labeled with `good-first-issue` or `help-wanted` trigger:
- Beginner-friendly explanations
- Step-by-step guidance
- Learning resource suggestions
- Welcome messages for contributors

## 🔧 Customization

### Adding New Labels

To add support for new labels, modify the `labelStrategies` object in `agent.js`:

```javascript
const labelStrategies = {
  'your-custom-label': `Custom analysis prompt for your label...`,
  // ... existing labels
};
```

### Adjusting Analysis Depth

Configure analysis depth based on labels:

```javascript
function getAnalysisDepthByLabel(labelName) {
  const depthMapping = {
    'critical': 'deep',
    'your-label': 'medium',
    // ... other mappings
  };
  return depthMapping[labelName] || 'medium';
}
```

## 🧪 Testing

### Manual Testing
1. Create test issues in your repository
2. Add different labels to trigger analysis
3. Observe the AI Agent responses

### Automated Testing
```bash
# Run the test suite
cd packages/github-agent
node test-label-trigger.js --verbose
```

### Test Scenarios
The test script includes scenarios for:
- Bug analysis
- Enhancement evaluation
- Critical issue handling
- Security audits
- Newcomer guidance

## 📈 Benefits

### For Maintainers
- **Automated Triage**: Instant analysis when issues are labeled
- **Consistent Quality**: Standardized analysis approach for each label type
- **Time Savings**: Reduced manual analysis effort
- **Better Context**: Label-specific insights and recommendations

### For Contributors
- **Clear Guidance**: Detailed analysis and next steps
- **Learning Opportunities**: Educational insights for newcomers
- **Faster Resolution**: Immediate context and suggestions
- **Better Understanding**: Comprehensive issue breakdown

## 🔍 Monitoring

### GitHub Actions Logs
Monitor the workflow execution in GitHub Actions:
- Check for successful triggers
- Review analysis completion times
- Monitor error rates

### Agent Performance
Track agent performance metrics:
- Response quality
- Analysis accuracy
- User satisfaction
- Issue resolution time

## 🚨 Troubleshooting

### Common Issues

1. **Agent Not Triggering**
   - Check GitHub Actions workflow is enabled
   - Verify environment variables are set
   - Ensure label names match exactly

2. **Analysis Quality Issues**
   - Review LLM provider configuration
   - Check workspace path settings
   - Verify repository access permissions

3. **Timeout Issues**
   - Increase timeout values for complex analysis
   - Check system resource availability
   - Monitor LLM API rate limits

### Debug Mode

Enable verbose logging:
```bash
VERBOSE_LLM_LOGS=true node bin/agent.js --verbose
```

## 🔮 Future Enhancements

- **Label Combinations**: Smart handling of multiple related labels
- **Custom Workflows**: User-defined label-to-workflow mappings
- **Analytics Dashboard**: Label trigger performance metrics
- **Integration APIs**: Webhook endpoints for external integrations
- **Machine Learning**: Automatic label suggestion based on issue content
