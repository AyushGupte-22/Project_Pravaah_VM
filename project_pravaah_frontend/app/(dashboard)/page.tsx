// app/(dashboard)/page.tsx
"use client";
import { useState } from 'react';
import axios, { isAxiosError } from 'axios';
import Image from 'next/image';
import { 
  Typography, Box, CircularProgress, 
  Alert, Paper, Grid, Button
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import ResultCard from '../components/ResultCard';

interface ProcessResult {
  filename: string;
  ocr_text: string;
  doc_type: string;
  confidence: number;
  status: string;
  extracted_data: Record<string, string | number | null>;
  validation_results: Record<string, string>;
  risk_analysis: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'application/pdf': [] },
    multiple: false,
  });

  const handleProcess = async () => {
    if (!file) { setError("Please select a file first."); return; }
    setIsLoading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post<ProcessResult>(
        'http://localhost:8000/process-document/', formData
      );
      setResult(response.data);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.detail || "An API error occurred.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>Upload Document</Typography>
      <Paper 
        {...getRootProps()} 
        elevation={0}
        sx={{
          border: `2px dashed ${isDragActive ? '#1976d2' : '#aaaaaa'}`,
          borderRadius: 2, p: 6, textAlign: 'center', cursor: 'pointer',
          backgroundColor: isDragActive ? '#e3f2fd' : 'white',
        }}
      >
        <input {...getInputProps()} />
        <Image 
          src="https://img.icons8.com/ios/100/1976d2/upload-to-cloud--v1.png" 
          alt="upload icon" width={100} height={100}
        />
        <Typography variant="h6" color="textSecondary">
          {isDragActive ? "Drop the file here ..." : "Drag & drop a document here, or click to select"}
        </Typography>
        <Typography variant="body2" color="textSecondary">Supports: PDF, PNG, JPG</Typography>
      </Paper>

      {(file || isLoading) && (
        <Paper elevation={0} sx={{ p: 2, mt: 3, backgroundColor: 'white' }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm> 
              <Typography variant="body1" sx={{ overflowWrap: 'break-word' }}>
                Selected: <strong>{file?.name}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm="auto">
              <Button
                variant="contained"
                color="primary"
                onClick={handleProcess}
                disabled={isLoading}
                sx={{ minWidth: 150, width: '100%' }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Process Document"}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3, width: '100%' }}>{error}</Alert>
      )}
      
      {result && (
        <Box sx={{ mt: 4 }}>
          <ResultCard result={result} />
        </Box>
      )}
    </Box>
  );
}