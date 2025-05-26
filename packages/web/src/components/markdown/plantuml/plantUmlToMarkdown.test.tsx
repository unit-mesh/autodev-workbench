import { describe, it, expect } from 'vitest';
import { plantUmlToMarkdown } from './PlantUMLRenderer';

describe('plantUmlToMarkdown', () => {
  it('should convert simple PlantUML mindmap to Markdown headers', () => {
    const plantUml = `
      @startmindmap
      + Root
      ++ Child 1
      +++ Grandchild 1.1
      ++ Child 2
      @endmindmap
    `;

    const expectedMarkdown = `# Root
## Child 1
### Grandchild 1.1
## Child 2`;

    expect(plantUmlToMarkdown(plantUml)).toBe(expectedMarkdown);
  });

  it('should ignore @startmindmap and @endmindmap tags', () => {
    const plantUml = `
      @startmindmap
      + Level 1
      @endmindmap
    `;

    const expectedMarkdown = '# Level 1';
    expect(plantUmlToMarkdown(plantUml)).toBe(expectedMarkdown);
  });

  it('should handle empty input', () => {
    expect(plantUmlToMarkdown('')).toBe('');
  });

  it('should handle input with only whitespace', () => {
    expect(plantUmlToMarkdown('   \n  \t  \n ')).toBe('');
  });

  it('should handle lines without plus signs', () => {
    const plantUml = `
      @startmindmap
      This is not a header
      + This is a header
      @endmindmap
    `;

    const expectedMarkdown = '# This is a header';
    expect(plantUmlToMarkdown(plantUml)).toBe(expectedMarkdown);
  });

  it('should preserve text after plus signs', () => {
    const plantUml = `
      @startmindmap
      + Main Topic
      ++   Sub Topic with extra spaces
      +++Detailed Topic
      @endmindmap
    `;

    const expectedMarkdown = `# Main Topic
## Sub Topic with extra spaces
### Detailed Topic`;
    expect(plantUmlToMarkdown(plantUml)).toBe(expectedMarkdown);
  });

  it('should handle multiple levels of nesting', () => {
    const plantUml = `
      @startmindmap
      + Level 1
      ++ Level 2
      +++ Level 3
      ++++ Level 4
      +++++ Level 5
      ++++++ Level 6
      @endmindmap
    `;

    const expectedMarkdown = `# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5
###### Level 6`;
    expect(plantUmlToMarkdown(plantUml)).toBe(expectedMarkdown);
  });
});
