"use client";

import "client-only";
import React, { useCallback, useEffect, useRef, useState } from "react";
import svgPanZoom from "svg-pan-zoom";
import { RotateCcw, Download } from "lucide-react"; // Added lucide-react
import mermaid from "mermaid";
import { v4 as uuidv4 } from "uuid";

const uuid = () => `mermaid-${uuidv4().toString()}`;

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}

export default function MermaidRender({ graphDefinition }: { graphDefinition: string }) {
  const [instance, setInstance] = useState<SvgPanZoom.Instance | null>(null);

  const lastGraphDefinition = useRef<string | null>(null);

  const enableZoom = useCallback(() => {
    instance?.enablePan();
    instance?.enableZoom();
  }, [instance]);

  const disableZoom = useCallback(() => {
    instance?.disablePan();
    instance?.disableZoom();
  }, [instance]);

  const resetZoom = useCallback(() => {
    instance?.fit();
    instance?.center();
  }, [instance]);

  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = React.useState(false);
  const currentId = uuid();

  const downloadSVG = useCallback(() => {
    const svg = ref.current!.innerHTML;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    downloadBlob(blob, `myimage.svg`);
  }, []);

  useEffect(() => {
    if (!ref.current || !graphDefinition) return;
    mermaid.initialize({
      startOnLoad: true,
      mindmap: {
        useWidth: 800,
      },
    });

    if (lastGraphDefinition.current === graphDefinition) return;
    mermaid.render(currentId, graphDefinition, ref.current)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
      .then(({ svg, bindFunctions }: any) => {
        ref.current!.innerHTML = svg;
        bindFunctions?.(ref.current!);

        // set height for svg
        const svgElement = ref.current!.querySelector("svg");
        svgElement?.setAttribute("height", "100%");
        svgElement?.setAttribute("width", "100%");

        setInstance(() => {
          const instance = svgPanZoom(ref.current!.querySelector("svg")!);
          instance.fit();
          instance.zoom(1);
          instance.center();
          instance.disablePan();
          instance.disableZoom();
          return instance;
        });
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((e: any) => {
        console.info(e);
        // NOTE(CGQAQ): there's a bug in mermaid will always throw an error:
        //  Error: Diagram error not found.
        // we need to check if the svg is rendered.
        // if rendered, we can ignore the error.
        // ref: https://github.com/mermaid-js/mermaid/issues/4140
        if (ref.current?.querySelector("svg") == null) {
          setHasError(true);
        }
      });

    lastGraphDefinition.current = graphDefinition;
  }, [graphDefinition]);

  useEffect(() => {
    const handleSpaceDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        enableZoom();
      }
    };

    const handleSpaceUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        disableZoom();
      }
    };
    document.addEventListener("keydown", handleSpaceDown);
    document.addEventListener("keyup", handleSpaceUp);

    return () => {
      document.removeEventListener("keydown", handleSpaceDown);
      document.removeEventListener("keyup", handleSpaceUp);
    };
  }, [enableZoom, disableZoom]);

  if (hasError || !graphDefinition) return <code className={"mermaid"}>{graphDefinition}</code>;
  return (
    <>
      <div className="flex justify-end text-gray-400 font-bold mb-2">
        <span>* hold space to pan & zoom</span>
      </div>
      <div
        ref={ref}
        style={{ width: "100%", height: "600px" }}
        onPointerDown={(event) => {
          ref.current?.querySelector("svg")?.setPointerCapture(event.pointerId);
        }}
      ></div>
      <div className="mt-4 flex space-x-2">
        <button
          onClick={resetZoom}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <RotateCcw size={18} className="mr-2" />
          Reset Pan & Zoom
        </button>
        <button
          onClick={downloadSVG}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          <Download size={18} className="mr-2" />
          Download SVG
        </button>
      </div>
    </>
  );
}
