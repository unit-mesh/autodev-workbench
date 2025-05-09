import { NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

interface Position {
  start: { row: number; column: number };
  end: { row: number; column: number };
}

interface InterfaceImplementation {
  interfaceName: string;
  interfaceFile: string;
  methodCount: number;
  package: string;
  position: Position;
  implementations: Array<{
    className: string;
    classFile: string;
    position?: Position;
  }>;
}

interface MultiImplementation {
  className: string;
  classFile: string;
  position?: Position;
  interfaceCount: number;
  interfaces: Array<{
    interfaceName: string;
    interfaceFile: string;
    position?: Position;
  }>;
}

interface ClassExtension {
  parentName: string;
  parentFile: string;
  package: string;
  position: Position;
  children: Array<{
    className: string;
    classFile: string;
    position?: Position;
  }>;
}

interface MultiExtension {
  className: string;
  classFile: string;
  position?: Position;
  parentCount: number;
  parents: Array<{
    parentName: string;
    parentFile: string;
    position?: Position;
  }>;
}

interface InheritanceHierarchy {
  maxDepth: number;
  deepestClasses: Array<{
    className: string;
    classFile: string;
    position?: Position;
  }>;
}

interface CodeBlock {
  filePath: string;
  title: string;
  heading: string;
  language: string;
  internalLanguage: string;
  code: string;
  context: {
    before: string;
    after: string;
  };
}

interface MarkdownAnalysisResult {
  codeBlocks: CodeBlock[];
  totalCount: number;
}

interface CodeAnalysisResult {
  interfaceAnalysis: {
    interfaces: InterfaceImplementation[];
    multiImplementers: MultiImplementation[];
    stats: {
      totalInterfaces: number;
      implementedInterfaces: number;
      unimplementedInterfaces: number;
      multiImplementerCount: number;
    };
  };
  extensionAnalysis: {
    extensions: ClassExtension[];
    multiExtensions: MultiExtension[];
    hierarchy: InheritanceHierarchy;
    stats: {
      extendedClassCount: number;
      totalExtensionRelations: number;
      multiExtendedClassCount: number;
    };
  };
  markdownAnalysis?: MarkdownAnalysisResult;
}

export async function POST(request: Request) {
  const client = createClient();
  await client.connect();

  try {
    const data = await request.json() as CodeAnalysisResult;

    // Store the data in the database using SQL
    const result = await client.sql`
      INSERT INTO "CodeAnalysis" (
        id, 
        "createdAt", 
        "updatedAt", 
        "interfaceAnalysis", 
        "extensionAnalysis", 
        "markdownAnalysis"
      ) VALUES (
        gen_random_uuid(), 
        NOW(), 
        NOW(), 
        ${JSON.stringify(data.interfaceAnalysis)}, 
        ${JSON.stringify(data.extensionAnalysis)}, 
        ${data.markdownAnalysis ? JSON.stringify(data.markdownAnalysis) : null}
      ) RETURNING id
    `;

    return NextResponse.json({
      success: true,
      message: 'Code analysis result stored successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error processing code analysis result:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process code analysis result',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
