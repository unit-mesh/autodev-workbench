import { NextResponse } from 'next/server';
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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
  try {
    const data = await request.json() as CodeAnalysisResult;

    // Store the data in the database
    const result = await prisma.codeAnalysis.create({
      data: {
        interfaceAnalysis: data.interfaceAnalysis,
        extensionAnalysis: data.extensionAnalysis,
        markdownAnalysis: data.markdownAnalysis
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Code analysis result stored successfully',
      id: result.id
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
  }
}
