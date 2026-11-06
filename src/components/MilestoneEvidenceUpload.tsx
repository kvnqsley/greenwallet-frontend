// Milestone Evidence Upload Component
// Allows suppliers to upload evidence files for milestone completion

import { useState, useRef } from "react";
import { uploadMilestoneEvidenceApi, submitMilestoneApi } from "../api/tickets";

interface EvidenceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface MilestoneEvidenceUploadProps {
  ticketId: string;
  milestoneId: string;
  milestoneTitle: string;
  onUploadComplete?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function MilestoneEvidenceUpload({
  ticketId,
  milestoneId,
  milestoneTitle,
  onUploadComplete
}: MilestoneEvidenceUploadProps) {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`File "${file.name}" is not a supported type. Allowed: JPEG, PNG, WebP, PDF`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 10MB size limit`);
        return false;
      }
      return true;
    });

    const newFiles: EvidenceFile[] = validFiles.map(file => ({
      id: `${milestoneId}-${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setError(null);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one evidence file before uploading");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get the actual file objects from the file input
      const fileInput = fileInputRef.current;
      if (fileInput && fileInput.files) {
        for (const file of Array.from(fileInput.files)) {
          await uploadMilestoneEvidenceApi(ticketId, milestoneId, file);
        }
      }

      setSuccess(true);
      onUploadComplete?.();
    } catch (err) {
      setError("Failed to upload evidence files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitMilestone = async () => {
    if (files.length === 0) {
      setError("Please upload at least one evidence file before submitting");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitMilestoneApi(ticketId, milestoneId);

      setSuccess(true);
      onUploadComplete?.();
    } catch (err) {
      setError("Failed to submit milestone. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="milestone-evidence-upload">
      <h3>Upload Evidence for: {milestoneTitle}</h3>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" role="status">
          Evidence uploaded successfully! Milestone has been submitted for buyer review.
        </div>
      )}

      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileSelect}
          disabled={uploading || submitting}
          className="file-input"
          id={`evidence-upload-${milestoneId}`}
          multiple
        />

        <label
          htmlFor={`evidence-upload-${milestoneId}`}
          className="upload-label"
        >
          <span>Click to select files or drag and drop</span>
          <span className="upload-hint">JPEG, PNG, WebP, PDF up to 10MB</span>
        </label>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h4>Selected Files ({files.length})</h4>
          <ul>
            {files.map(file => (
              <li key={file.id} className="file-item">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  disabled={uploading || submitting}
                  className="remove-file-btn"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="upload-actions">


        <button
          type="button"
          onClick={handleSubmitMilestone}
          disabled={files.length === 0 || uploading || submitting}
          className="btn btn-primary"
        >
          {submitting ? "Submitting..." : "Submit for Buyer Review"}
        </button>
      </div>
    </div>
  );
}