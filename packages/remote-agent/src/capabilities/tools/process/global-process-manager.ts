import { ChildProcess, spawn } from "child_process";

export class GlobalProcessManager {
	private static instance: GlobalProcessManager;
	private processes: Map<number, ManagedProcess> = new Map();
	private nextId = 1;

	static getInstance(): GlobalProcessManager {
		if (!GlobalProcessManager.instance) {
			GlobalProcessManager.instance = new GlobalProcessManager();
		}
		return GlobalProcessManager.instance;
	}

	launchProcess(command: string, options: LaunchOptions): number {
		const id = this.nextId++;
		const process = new ManagedProcess(id, command, options);
		this.processes.set(id, process);
		return id;
	}

	getProcess(id: number): ManagedProcess | undefined {
		return this.processes.get(id);
	}

	getAllProcesses(): ProcessSummary[] {
		return Array.from(this.processes.values()).map(p => p.getSummary());
	}

	killProcess(id: number): boolean {
		const process = this.processes.get(id);
		if (process) {
			process.kill();
			return true;
		}
		return false;
	}

	cleanup(): void {
		this.processes.forEach(process => process.kill());
		this.processes.clear();
	}
}

export interface LaunchOptions {
	cwd?: string;
	env?: Record<string, string>;
	wait: boolean;
	maxWaitSeconds: number;
}

export interface ProcessSummary {
	terminal_id: number;
	command: string;
	status: 'running' | 'completed' | 'failed' | 'killed';
	start_time: string;
	end_time?: string;
	exit_code?: number;
	execution_time_ms?: number;
	output_lines: number;
	error_lines: number;
}

class ManagedProcess {
	private childProcess?: ChildProcess;
	private outputBuffer: string[] = [];
	private errorBuffer: string[] = [];
	private startTime: number;
	private endTime?: number;
	private status: 'running' | 'completed' | 'failed' | 'killed' = 'running';
	private exitCode?: number;

	constructor(
		public readonly id: number,
		public readonly command: string,
		private options: LaunchOptions
	) {
		this.startTime = Date.now();
		this.launch();
	}

	private launch(): void {
		const [cmd, ...args] = this.command.split(' ');

		this.childProcess = spawn(cmd, args, {
			cwd: this.options.cwd,
			env: { ...process.env, ...this.options.env },
			stdio: 'pipe'
		});

		this.childProcess.stdout?.on('data', (data) => {
			this.outputBuffer.push(data.toString());
		});

		this.childProcess.stderr?.on('data', (data) => {
			this.errorBuffer.push(data.toString());
		});

		this.childProcess.on('exit', (code) => {
			this.endTime = Date.now();
			this.exitCode = code || 0;
			this.status = code === 0 ? 'completed' : 'failed';
		});

		this.childProcess.on('error', () => {
			this.endTime = Date.now();
			this.status = 'failed';
		});
	}

	getOutput(): string {
		return this.outputBuffer.join('');
	}

	getErrors(): string {
		return this.errorBuffer.join('');
	}

	writeInput(input: string): boolean {
		if (this.childProcess && this.status === 'running') {
			this.childProcess.stdin?.write(input);
			return true;
		}
		return false;
	}

	kill(): void {
		if (this.childProcess && this.status === 'running') {
			this.childProcess.kill('SIGTERM');
			this.status = 'killed';
			this.endTime = Date.now();
		}
	}

	getSummary(): ProcessSummary {
		return {
			terminal_id: this.id,
			command: this.command,
			status: this.status,
			start_time: new Date(this.startTime).toISOString(),
			end_time: this.endTime ? new Date(this.endTime).toISOString() : undefined,
			exit_code: this.exitCode,
			execution_time_ms: this.endTime ? this.endTime - this.startTime : Date.now() - this.startTime,
			output_lines: this.outputBuffer.length,
			error_lines: this.errorBuffer.length
		};
	}
}
