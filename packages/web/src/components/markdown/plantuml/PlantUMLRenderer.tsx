"use client";

import React, { useCallback, useEffect, useState } from "react";
import plantumlEncoder from "plantuml-encoder";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { MindMap } from "../mindmap/MindMap";

interface PlantUMLRendererProps {
  value: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function plantUmlToMarkdown(plantUml: string): string {
  const lines = plantUml.split("\n");
  const markdownLines: string[] = [];

  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith("@startmindmap") || line.startsWith("@endmindmap")) {
      // Ignore start and end tags
      return;
    }

    // Count the number of '+' characters to determine the level
    const level = line.match(/^\++/)?.[0].length || 0;
    if (level > 0) {
      const headerText = line.replace(/^\++\s*/, ""); // Remove leading '+' symbols and extra spaces
      markdownLines.push(`${"#".repeat(level)} ${headerText}`); // Add corresponding Markdown header
    }
  });

  return markdownLines.join("\n");
}

export default function PlantUMLRenderer({ value }: PlantUMLRendererProps) {
  const [graphUrl, setGraphUrl] = useState("");

  useEffect(() => {
    const encodedMarkup = plantumlEncoder.encode(value);
    const url = `http://www.plantuml.com/plantuml/svg/${encodedMarkup}`;
    setGraphUrl(url);
  }, [value]);

  const handleDownload = useCallback(() => {
    try {
      const xmlContent = MindMap.fromMarkdownHeader(value).toXML();
      const blob = new Blob([xmlContent], { type: "application/x-freemind" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mindmap.mm";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating XML:", error);
      alert("An error occurred while generating the XML file. Please try again.");
    }
  }, [value]);

  return (
    <div className="w-full mx-auto">
      <Button
        onClick={() => handleDownload()}
        disabled={!value.startsWith("@startmindmap")}
        className="m-4"
      >
        <Download className="mr-2 h-4 w-4" />
        Download Mindmap
      </Button>

      <div className="border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
        <img src={graphUrl} alt="PlantUML Graph" className="max-w-full h-auto" />
      </div>
    </div>
  );
}

