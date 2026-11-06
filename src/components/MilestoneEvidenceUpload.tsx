// Milestone Evidence Upload Component
// Allows suppliers to upload evidence files for milestone completion

import { useState, useRef } from "react";
import { uploadMilestoneEvidenceApi, submitMilestoneApi } from "../api/tickets";

interface SelectedFile {
  id: string;
  file: File;
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
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    setError(null);
    setSuccess(null);

    for (const file of selectedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`File "${file.name}" is not a supported type. Allowed: JPEG, PNG, WebP, PDF`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 10MB size limit`);
        continue;
      }
      validFiles.push(file);
    }

    setFiles((prev) => [
      ...prev,
      ...validFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file
      }))
    ]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== fileId));
  };

  async function uploadFiles(list: SelectedFile[]) {
    for (const item of list) {
      await uploadMilestoneEvidenceApi(ticketId, milestoneId, item.file);
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one evidence file before uploading");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await uploadFiles(files);
      setFiles([]);
      setUploaded(true);
      setSuccess("Evidence uploaded successfully. Submit the milestone for buyer review when ready.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload evidence files. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitMilestone = async () => {
    if (files.length === 0 && !uploaded) {
      setError("Please upload at least one evidence file before submitting");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (files.length > 0) {
        await uploadFiles(files);
        setFiles([]);
      }
      await submitMilestoneApi(ticketId, milestoneId);
      setSuccess("Milestone submitted for buyer review.");
      onUploadComplete?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit milestone. Please try again."
      );
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
          {success}
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
            {files.map((item) => (
              <li key={item.id} className="file-item">
                <span className="file-name">{item.file.name}</span>
                <span className="file-size">
                  {formatFileSize(item.file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(item.id)}
                  disabled={uploading || submitting}
                  className="remove-file-btn"
                  aria-label={`Remove ${item.file.name}`}
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
          onClick={handleUpload}
          disabled={files.length === 0 || uploading || submitting}
          className="btn btn-secondary"
        >
          {uploading ? "Uploading..." : "Upload Evidence"}
        </button>

        <button
          type="button"
          onClick={handleSubmitMilestone}
          disabled={
            (files.length === 0 && !uploaded) || uploading || submitting
          }
          className="btn btn-primary"
        >
          {submitting ? "Submitting..." : "Submit for Buyer Review"}
        </button>
      </div>
    </div>
  );
}
