import React, { useCallback, useState } from 'react';
import './FileUpload.css';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({ 
  onFileSelect, 
  accept = '.csv', 
  maxSize = 50 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    setError(null);

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return false;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    return true;
  }, [maxSize]);

  const handleFileSelect = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="file-upload-content">
          <div className="file-upload-icon">📁</div>
          <h3>Upload Drone Telemetry Data</h3>
          <p>Drag and drop a CSV file here, or click to browse</p>
          <input
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="file-input"
            id="file-input"
          />
          <label htmlFor="file-input" className="file-upload-button">
            Choose CSV File
          </label>
          <div className="file-requirements">
            <small>
              • CSV format with drone telemetry columns
              • Maximum file size: {maxSize}MB
              • Required columns: elapsed_time, drone_x, drone_y, drone_z, drone_roll, drone_pitch, drone_yaw
            </small>
          </div>
        </div>
      </div>
      {error && (
        <div className="file-upload-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
}