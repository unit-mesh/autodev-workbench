export class Range {
  constructor(
    public readonly start: number,
    public readonly end: number
  ) {}

  static fromBounds(start: number, end: number): Range {
    return new Range(start, end);
  }

  containsRange(other: Range): boolean {
    return this.start <= other.start && this.end >= other.end;
  }
  
  getText(text: string): string {
    return text.substring(this.start, this.end);
  }
}
