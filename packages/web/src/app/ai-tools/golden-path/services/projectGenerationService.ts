import { ProjectMetadata } from '../types';
import { PROJECT_TYPE_MAPPING, FRAMEWORKS } from '../constants';

class ProjectGenerationService {
	private mapProjectType(frontendType: string): string {
		return PROJECT_TYPE_MAPPING[frontendType as keyof typeof PROJECT_TYPE_MAPPING] || 'monolith';
	}

	private buildPrompt(metadata: ProjectMetadata): string {
		const mappedType = this.mapProjectType(metadata.type);
		const allFrameworks = Object.values(FRAMEWORKS).flat();
		const frameworkInfo = allFrameworks.find(f => f.value === metadata.framework);
		const frameworkLabel = frameworkInfo?.label || '';
		const isLegacy = frameworkInfo?.legacy === true;
		const frameworkDescription = isLegacy ?
			`${frameworkLabel} (Legacy version)` : frameworkLabel;

		return `
Generate a JSON configuration for a ${frameworkDescription} ${mappedType} application named "${metadata.name}".
Description: ${metadata.description || "No description provided"}
Programming Language: ${metadata.language}
Required Features: ${metadata.features.join(', ') || "No specific features selected"}
${isLegacy ? "Note: This is using a legacy version of the framework which may have different dependencies and configurations." : ""}

IMPORTANT: You must return a JSON object that exactly matches this schema structure:

{
  "projectConfig": {
    "name": "${metadata.name}",
    "description": "${metadata.description || "No description provided"}",
    "type": "${mappedType}",
    "language": "${metadata.language}",
    "framework": "${metadata.framework}"
  },
  "features": [
    // Array of selected feature IDs as strings
    // Use these exact feature IDs: ${metadata.features.join(', ')}
  ],
  "structure": {
    "directories": [
      // Array of directory paths as strings (e.g., "src/main/java", "src/test/java")
    ],
    "files": [
      // Array of file paths as strings (e.g., "pom.xml", "README.md")
    ]
  },
  "dependencies": {
    // Object with dependency names as keys and versions as string values
    // Example: "spring-boot-starter": "3.2.0"
  },
  "configurations": {
    // Object with configuration file names as keys and arrays of configuration lines as values
    // Example: "application.yml": ["server:", "  port: 8080"]
  }
}

For the selected features (${metadata.features.join(', ') || 'none'}), include appropriate:
1. Project structure directories and files
2. Dependencies with specific versions
3. Configuration files with proper content lines

Examples for common features:
- "database": Add JPA dependencies, database configuration in application.yml
- "auth": Add security dependencies, security configuration
- "docker": Add Dockerfile and docker-compose.yml files
- "api-docs": Add OpenAPI/Swagger dependencies and configuration

Return ONLY the JSON object without any explanation, comments, or markdown formatting.
		`.trim();
	}

	private cleanAndValidateJson(jsonResult: string, metadata: ProjectMetadata): string {
		try {
			// Remove possible markdown formatting
			const jsonMatch = jsonResult.match(/```json\s*([\s\S]*?)\s*```/) ||
				jsonResult.match(/```\s*([\s\S]*?)\s*```/);

			if (jsonMatch) {
				jsonResult = jsonMatch[1].trim();
			}

			// Validate JSON format
			const parsedConfig = JSON.parse(jsonResult);

			// Basic validation to ensure required fields exist
			if (!parsedConfig.projectConfig || !parsedConfig.features ||
			    !parsedConfig.structure || !parsedConfig.dependencies ||
			    !parsedConfig.configurations) {
				throw new Error("Missing required fields in generated configuration");
			}

			// Ensure type field matches backend expectations
			const mappedType = this.mapProjectType(metadata.type);
			if (!['microservice', 'monolith', 'library'].includes(parsedConfig.projectConfig.type)) {
				parsedConfig.projectConfig.type = mappedType;
			}

			return JSON.stringify(parsedConfig, null, 2);
		} catch (e) {
			console.error("Invalid JSON in response", e);
			// If parsing fails, provide a basic configuration template
			const fallbackConfig = {
				projectConfig: {
					name: metadata.name,
					description: metadata.description || "No description provided",
					type: this.mapProjectType(metadata.type),
					language: metadata.language,
					framework: metadata.framework
				},
				features: metadata.features,
				structure: {
					directories: ["src"],
					files: ["README.md", ".gitignore"]
				},
				dependencies: {},
				configurations: {}
			};
			return JSON.stringify(fallbackConfig, null, 2);
		}
	}

	async generateProject(metadata: ProjectMetadata): Promise<string> {
		const prompt = this.buildPrompt(metadata);

		const response = await fetch("/api/chat", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messages: [
					{
						role: "system",
						content: "You are an expert software architect. Generate project configurations that strictly follow the provided JSON schema. Return only valid JSON without any explanation, comments, or markdown formatting. Ensure all field types match the schema exactly."
					},
					{ role: "user", content: prompt }
				],
			}),
		});

		if (!response.ok) {
			throw new Error("Failed to generate response");
		}

		const data = await response.json();
		return this.cleanAndValidateJson(data.text, metadata);
	}

	async saveConfig(metadata: ProjectMetadata, generatedResult: string): Promise<string> {
		const response = await fetch('/api/golden-path', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				name: metadata.name,
				description: metadata.description,
				metadata: metadata,
				config: JSON.parse(generatedResult),
			}),
		});

		if (!response.ok) {
			throw new Error('保存失败');
		}

		const result = await response.json();
		return result.data.id;
	}
}

export const projectGenerationService = new ProjectGenerationService();
