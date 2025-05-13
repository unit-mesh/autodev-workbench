export interface Tool {
	name(): string;

	description(): string;

	icon(): string;

	inputSchema?(): Promise<object>;

	execute(input: object): Promise<object>;
}
