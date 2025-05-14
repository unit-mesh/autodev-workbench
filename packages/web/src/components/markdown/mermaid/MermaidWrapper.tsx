import dynamic from "next/dynamic";
import React from "react";

export default function MermaidWrapper({ graphDefinition }: { graphDefinition: string }) {
  if (!graphDefinition) {
    return <div>No content provided</div>;
  }

  const MermaidRender = dynamic(() => import("./MermaidRender"), { ssr: false });
  return <MermaidRender graphDefinition={graphDefinition} />;
}
