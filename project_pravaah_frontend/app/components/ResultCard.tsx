// app/components/ResultCard.tsx
"use client";
import React from 'react';
import { 
  Paper, Typography, Box, Grid, Chip, 
  Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, Divider, Alert,
  ListItemIcon // --- FIX: Import ListItemIcon ---
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

// Define the type for the props
interface ResultCardProps {
  result: {
    filename: string;
    doc_type: string;
    confidence: number;
    status: string;
    // --- FIX: Allow string arrays for Damages Observed ---
    extracted_data: Record<string, string | number | null | string[]>;
    validation_results: Record<string, string>;
    risk_analysis: string;
    ocr_text: string;
  };
}

// Helper for the Risk Analysis styling
const RiskAnalysis = ({ analysis }: { analysis: string }) => {
  let severity: "success" | "warning" | "error" | "info" = "info";
  let icon: React.ReactElement = <InfoIcon />;

  if (analysis?.startsWith("✅")) {
    severity = "success";
    icon = <CheckCircleIcon />;
  } else if (analysis?.startsWith("⚠️")) {
    severity = "warning";
    icon = <WarningIcon />;
  } else if (analysis?.startsWith("❓") || analysis?.startsWith("N/A")) {
    severity = "error";
    icon = <ErrorIcon />;
  }

  return (
    <Alert severity={severity} icon={icon} variant="filled">
      <Typography variant="body1">{analysis}</Typography>
    </Alert>
  );
};

// --- A helper for a single data point ---
const DataField = ({ title, value }: { title: string, value: any }) => (
  <Box>
    <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase' }}>
      {title}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      {value || 'N/A'}
    </Typography>
  </Box>
);

// --- A helper for validation checks ---
const ValidationItem = ({ check, result }: { check: string, result: string }) => {
  const isOk = result.includes("OK");
  return (
    <ListItem>
      {/* --- FIX: ListItemIcon is now correctly used --- */}
      <ListItemIcon sx={{ minWidth: 40, color: isOk ? 'success.main' : 'error.main' }}>
        {isOk ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
      </ListItemIcon>
      <ListItemText primary={check} secondary={result.replace("✅ OK", "").replace("❌ ", "")} />
    </ListItem>
  );
};

export default function ResultCard({ result }: ResultCardProps) {
  
  const renderExtractedData = () => {
    const data = result.extracted_data;

    if (result.doc_type === "Invoice") {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DataField title="Vendor Name" value={data["Vendor Name"]} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DataField title="Invoice Number" value={data["Invoice Number"]} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DataField title="Invoice Date" value={data["Invoice Date"]} />
          </Grid>
          <Grid item xs={12} md={6}>
            <DataField title="Total Amount" value={data["Total Amount"] ? `₹ ${Number(data["Total Amount"]).toLocaleString('en-IN')}` : 'N/A'} />
          </Grid>
          <Grid item xs={12}>
            <DataField title="GSTIN" value={data["GSTIN"]} />
          </Grid>
        </Grid>
      );
    }
    
    if (result.doc_type === "Inspection Report") {
      // --- FIX: Type-safe check for the array ---
      const damages = data["Damages Observed"];
      const damagesList = Array.isArray(damages) ? damages : [];

      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}><DataField title="Report ID" value={data["Report ID"]} /></Grid>
          <Grid item xs={12} md={6}><DataField title="Policy Number" value={data["Policy Number"]} /></Grid>
          <Grid item xs={12} md={6}><DataField title="Make" value={data["Make"]} /></Grid>
          <Grid item xs={12} md={6}><DataField title="Model" value={data["Model"]} /></Grid>
          <Grid item xs={12} md={6}><DataField title="Registration No" value={data["Registration No"]} /></Grid>
          <Grid item xs={12} md={6}><DataField title="VIN" value={data["VIN"]} /></Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase' }}>Damages Observed</Typography>
            <List dense>
              {damagesList.length > 0 ? (
                damagesList.map((damage: string, i: number) => (
                  <ListItem key={i}><ListItemText primary={`- ${damage}`} /></ListItem>
                ))
              ) : (
                <ListItem><ListItemText primary="N/A" /></ListItem>
              )}
            </List>
          </Grid>
        </Grid>
      );
    }

    // Fallback for other types
    return <Typography>No extraction profile for this document type.</Typography>;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, backgroundColor: 'white', borderRadius: 2 }}>
      
      {/* 1. HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Processing Results
        </Typography>
        <Chip 
          icon={result.doc_type === 'Invoice' ? <ReceiptIcon /> : <DescriptionIcon />}
          label={result.doc_type}
          color="info"
          variant="filled"
        />
      </Box>
      <Divider sx={{ mb: 3 }}/>

      {/* 2. STATUS CHIPS */}
      <Grid container spacing={1} sx={{ mb: 3 }}>
        <Grid item>
          <Chip label={`Confidence: ${(result.confidence * 100).toFixed(0)}%`} color="success" variant="outlined" />
        </Grid>
        <Grid item>
          <Chip label={`Status: ${result.status}`} color={result.status === "Sent to Review Queue" ? "warning" : "primary"} />
        </Grid>
      </Grid>

      {/* 3. MAIN CONTENT */}
      
      {/* UI for LOW CONFIDENCE (Sent to Review) */}
      {result.status === "Sent to Review Queue" && (
        <Alert severity="warning" icon={<WarningIcon />}>
          <Typography variant="h6">Action Required</Typography>
          This document's confidence score was too low. It has been automatically sent to the **"Review Queue"** page.
          Please navigate to the queue from the sidebar to complete processing.
        </Alert>
      )}

      {/* UI for HIGH CONFIDENCE (Full Results) */}
      {result.status !== "Sent to Review Queue" && (
        <Grid container spacing={3}>
          <Grid item xs={12}> 
            <Typography variant="h6" gutterBottom>AI Risk Analysis</Typography>
            <RiskAnalysis analysis={result.risk_analysis} />
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Typography variant="h6" gutterBottom>Extracted Data</Typography>
            <Paper variant="outlined" sx={{ p: 3, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
              {renderExtractedData()}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={5}> 
            <Typography variant="h6" gutterBottom>Rule-Based Validation</Typography>
            <Paper variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
              <List dense>
                {Object.entries(result.validation_results).map(([key, value]) => (
                  <ValidationItem key={key} check={key} result={value} />
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* 4. OCR TEXT (Hidden) */}
      <Accordion sx={{ mt: 3, border: '1px solid #eee', elevation: 0, '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color="textSecondary">Show Raw Extracted Text (OCR)</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <Box component="pre" sx={{ 
            backgroundColor: '#f5f5f5', padding: 2, maxHeight: '300px', 
            overflow: 'auto', whiteSpace: 'pre-wrap', color: '#333'
          }}>
            {result.ocr_text}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}