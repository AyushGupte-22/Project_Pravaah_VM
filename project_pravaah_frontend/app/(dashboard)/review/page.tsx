// app/(dashboard)/review/page.tsx
"use client";
import { useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import { 
  Paper, Typography, Box, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Alert, SelectChangeEvent
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

// --- Define the data types ---
interface ApiQueueRow { filename: string; ai_guess: string; confidence: string; }
interface GridQueueRow extends ApiQueueRow { id: number; }

export default function ReviewPage() {
  const [rows, setRows] = useState<GridQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for the modal
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<GridQueueRow | null>(null);
  const [correctDocType, setCorrectDocType] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // --- NEW: State for the re-uploaded file ---
  const [fileToReview, setFileToReview] = useState<File | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/review-queue/');
      const dataWithIds = response.data.map((row: ApiQueueRow, index: number) => ({ ...row, id: index }));
      setRows(dataWithIds);
    } catch (err) {
      console.error("Failed to fetch review queue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleOpenReview = (row: GridQueueRow) => {
    setSelectedRow(row);
    setCorrectDocType(row.ai_guess); // Pre-fill with AI guess
    setError('');
    setFileToReview(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRow(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.name !== selectedRow?.filename) {
        setError(`Warning: The file you uploaded (${file.name}) does not match the selected row (${selectedRow?.filename}).`);
        setFileToReview(null);
      } else {
        setError('');
        setFileToReview(file);
      }
    }
  };

  const handleConfirmProcess = async () => {
    if (!selectedRow || !correctDocType || !fileToReview) {
        setError("Please select the correct file and document type.");
        return;
    }
    
    setIsProcessing(true);
    setError('');
    
    const formData = new FormData();
    formData.append("file", fileToReview);
    formData.append("correct_doc_type", correctDocType);
    formData.append("filename_to_remove", selectedRow.filename);
    
    try {
      // Call our new review endpoint
      await axios.post('http://localhost:8000/review-document/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      handleClose();
      await fetchQueue(); // Refresh the data grid
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.detail || "An API error occurred.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'filename', headerName: 'Filename', flex: 1, minWidth: 300 },
    { field: 'ai_guess', headerName: 'AI Guess', width: 200 },
    { field: 'confidence', headerName: 'Confidence', width: 150 },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleOpenReview(params.row as GridQueueRow)}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>Document Review Queue</Typography>
      <Paper sx={{ height: 600, width: '100%', backgroundColor: 'white', borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            getRowId={(row) => row.id}
          />
        )}
      </Paper>

      {/* --- This is the Review Modal Dialog --- */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle variant="h5">Review Document: {selectedRow?.filename}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Typography>Please re-upload the file to confirm and process it.</Typography>
            <Button variant="outlined" component="label">
              Upload File: {selectedRow?.filename}
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            {fileToReview && <Alert severity="success">File {fileToReview.name} ready.</Alert>}

            <FormControl fullWidth>
              <InputLabel>Correct Document Type</InputLabel>
              <Select
                value={correctDocType}
                label="Correct Document Type"
                onChange={(e: SelectChangeEvent) => setCorrectDocType(e.target.value)}
              >
                <MenuItem value="Invoice">Invoice</MenuItem>
                <MenuItem value="Inspection Report">Inspection Report</MenuItem>
                <MenuItem value="Claim Form">Claim Form</MenuItem>
                <MenuItem value="Unknown Document">Unknown Document</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={isProcessing}>Cancel</Button>
          <Button 
            onClick={handleConfirmProcess} 
            variant="contained" 
            disabled={isProcessing || !fileToReview}
          >
            {isProcessing ? <CircularProgress size={24} /> : "Confirm & Process"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}