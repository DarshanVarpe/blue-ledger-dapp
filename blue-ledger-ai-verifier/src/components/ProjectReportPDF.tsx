import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Define the types for the data we'll pass to the PDF
interface Project {
  id: bigint;
  name: string;
  location: string;
  owner: `0x${string}`;
  status: number;
  creditsMinted: bigint;
  registrationTimestamp: bigint;
}

interface MRVData {
  id: bigint;
  dataHash: string;
  timestamp: bigint;
}

interface Metadata {
  description: string;
  image: string | null; // Can be a base64 data URL or null
}

// A complete map of all status numbers to human-readable labels
const statusLabels: { [key: number]: string } = {
  0: "Pending",
  1: "Awaiting Verification",
  2: "Verified",
  3: "Rejected",
};

// Create styles for the PDF document
const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 11, paddingTop: 30, paddingLeft: 40, paddingRight: 40, paddingBottom: 30, lineHeight: 1.5, flexDirection: 'column', backgroundColor: '#FFFFFF', color: '#222222' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontFamily: 'Helvetica-Bold', color: '#0D47A1' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 10, color: '#1565C0' },
  section: { marginBottom: 20, padding: 10, border: '1px solid #E0E0E0', borderRadius: 5 },
  subHeader: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#1E88E5', borderBottom: '1px solid #EEEEEE', paddingBottom: 4 },
  text: { marginBottom: 4 },
  label: { fontFamily: 'Helvetica-Bold', marginRight: 5 },
  row: { flexDirection: 'row', marginBottom: 5 },
  mrvItem: { marginBottom: 8, paddingLeft: 10, borderLeft: '2px solid #BDBDBD' },
  projectImage: { width: '100%', height: 200, objectFit: 'cover', marginBottom: 15, borderRadius: 5 },
  footer: { position: 'absolute', bottom: 15, left: 40, right: 40, textAlign: 'center', color: 'grey', fontSize: 9 },
});

// The main PDF Document Component
export const ProjectReportPDF = ({ project, mrvHistory, metadata }: { project: Project, mrvHistory: MRVData[], metadata: Metadata }) => {
  const projectStatusLabel = statusLabels[project.status] || "Unknown Status";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Blue Ledger Project Report</Text>

        {/* This now correctly checks for a non-null image string (base64) */}
        {metadata.image && (
          <Image style={styles.projectImage} src={metadata.image} />
        )}

        <View style={styles.section}>
          <Text style={styles.title}>{project.name}</Text>
          <View style={styles.row}><Text style={styles.label}>Project ID:</Text><Text>{project.id.toString()}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Location:</Text><Text>{project.location}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Owner:</Text><Text>{project.owner}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Registration Date:</Text><Text>{new Date(Number(project.registrationTimestamp) * 1000).toLocaleDateString()}</Text></View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.subHeader}>Project Summary</Text>
          <Text style={styles.text}>{metadata.description || 'No description provided.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subHeader}>Verification & Credit Issuance</Text>
          <View style={styles.row}><Text style={styles.label}>Status:</Text><Text>{projectStatusLabel}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Total Credits Minted:</Text><Text>{project.creditsMinted.toString()} BLC</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subHeader}>MRV Data History ({mrvHistory.length} submissions)</Text>
          {mrvHistory.map((mrv, index) => (
            <View key={index} style={styles.mrvItem}>
              <Text style={styles.label}>Submission #{mrv.id.toString()}</Text>
              <Text>Date: {new Date(Number(mrv.timestamp) * 1000).toLocaleString()}</Text>
              <Text>IPFS Hash: {mrv.dataHash}</Text>
            </View>
          ))}
          {mrvHistory.length === 0 && <Text>No MRV data has been submitted for this project.</Text>}
        </View>

        <Text style={styles.footer} fixed>
          Generated on {new Date().toLocaleDateString()} by Blue Ledger
        </Text>
      </Page>
    </Document>
  );
};

