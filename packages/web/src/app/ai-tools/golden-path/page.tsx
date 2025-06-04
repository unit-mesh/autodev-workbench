"use client"

import React from 'react';
import {Panel, PanelGroup, PanelResizeHandle} from "react-resizable-panels";
import {ProjectGenerationHeader} from './components/ProjectGenerationHeader';
import {ConfigurationPanel} from './components/ConfigurationPanel';
import {ResultPanel} from './components/ResultPanel';
import {DownloadDialog} from './components/DownloadDialog';
import {useProjectGeneration} from './hooks/useProjectGeneration';
import {useProjectConfig} from './hooks/useProjectConfig';

export default function GoldenPathPage() {
    const {metadata, updateMetadata} = useProjectConfig();
    const {
        isLoading,
        generatedResult,
        isSaving,
        savedConfigId,
        dialogOpen,
        setDialogOpen,
        handleGenerate,
        handleSaveConfig,
        copyToClipboard,
        handleDownloadJson,
        getCliCommand,
        getCurlCommand,
        copyCliCommand,
        copyCurlCommand
    } = useProjectGeneration(metadata);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <ProjectGenerationHeader
                isLoading={isLoading}
                isSaving={isSaving}
                generatedResult={generatedResult}
                onSave={handleSaveConfig}
                onCopy={copyToClipboard}
                onDownload={() => setDialogOpen(true)}
            />

            <DownloadDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                generatedResult={generatedResult}
                savedConfigId={savedConfigId}
                onDownloadJson={handleDownloadJson}
                onCopyCliCommand={copyCliCommand}
                onCopyCurlCommand={copyCurlCommand}
                getCliCommand={getCliCommand}
                getCurlCommand={getCurlCommand}
            />

            <div className="flex-1 overflow-hidden">
                <PanelGroup direction="horizontal" className="h-full">
                    <Panel id="config-panel" defaultSize={50} minSize={30}>
                        <ConfigurationPanel
                            metadata={metadata}
                            onMetadataChange={updateMetadata}
                            onGenerate={handleGenerate}
                            isLoading={isLoading}
                        />
                    </Panel>

                    <PanelResizeHandle
                        className="w-1 hover:w-2 bg-gray-200 hover:bg-blue-400 transition-all duration-150 relative group"
                    >
                        <div
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-400 rounded group-hover:bg-blue-600"></div>
                    </PanelResizeHandle>

                    <Panel id="result-panel" defaultSize={50} minSize={30}>
                        <ResultPanel
                            metadata={metadata}
                            generatedResult={generatedResult}
                            isLoading={isLoading}
                        />
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}