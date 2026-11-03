import { readFile } from "node:fs/promises";
import path from "node:path";

import { Document, Image, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/actor";

import { overviewSections, repoTree } from "../content";

export const dynamic = "force-dynamic";

const styles = {
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.5 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666666", marginBottom: 16 },
  heading: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6 },
  paragraph: { marginBottom: 8 },
  diagram: { marginTop: 8, borderRadius: 4 },
  tree: {
    fontFamily: "Courier",
    fontSize: 8.5,
    backgroundColor: "#f5f5f4",
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
} as const;

// Courier in PDF lacks box-drawing glyphs, so map the tree to ASCII.
const asciiRepoTree = repoTree
  .replaceAll("├──", "|--")
  .replaceAll("└──", "`--")
  .replaceAll("│", "|");

function ArchitecturePdf({ diagram }: { diagram: Buffer }) {
  return (
    <Document title="Architecture overview">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Architecture</Text>
        <Text style={styles.subtitle}>
          A high-level view of the platform and the services it runs on.
        </Text>
        {overviewSections.map((section) => (
          <View key={section.title}>
            <Text style={styles.heading}>{section.title}</Text>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph.slice(0, 40)} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
        <View>
          <Text style={styles.heading}>Architecture diagram</Text>
          <Image src={{ data: diagram, format: "png" }} style={styles.diagram} />
        </View>
        <View wrap={false}>
          <Text style={styles.heading}>Repository structure</Text>
          <Text style={styles.tree}>{asciiRepoTree}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) notFound();

  const diagramPath = path.join(
    process.cwd(),
    "..",
    "..",
    "docs",
    "architecture",
    "platform-overview.png",
  );
  let diagram: Buffer;
  try {
    diagram = await readFile(diagramPath);
  } catch {
    notFound();
  }

  const pdf = await renderToBuffer(<ArchitecturePdf diagram={diagram} />);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="architecture-overview.pdf"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
