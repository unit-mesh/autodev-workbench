export interface Tool {
	name(): string;

	description(): string;

	usage(): string;

	icon(): string;

	inputSchema?(): Promise<object>;

	execute(input: object): Promise<object>;
}
