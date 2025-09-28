import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, User, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResumeData } from '../../types';
import { ResumeParser, validateEmail, validatePhone, validateName } from '../../utils/resumeParser';

interface ResumeUploadProps {
  onResumeUploaded: (resumeData: ResumeData) => void;
  onFieldUpdate: (field: 'name' | 'email' | 'phone', value: string) => void;
  existingData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  missingFields: string[];
  className?: string;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onResumeUploaded,
  onFieldUpdate,
  existingData,
  missingFields,
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [manualFields, setManualFields] = useState({
    name: existingData?.name || '',
    email: existingData?.email || '',
    phone: existingData?.phone || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync existing data with manual fields when props change
  React.useEffect(() => {
    if (existingData) {
      setManualFields({
        name: existingData.name || '',
        email: existingData.email || '',
        phone: existingData.phone || '',
      });
    }
  }, [existingData]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const resumeData = await ResumeParser.parseFile(file);
      setUploadedFile(file);
      onResumeUploaded(resumeData);
      
      // Only update fields that are currently empty, preserve existing data
      const updatedFields = {
        name: (existingData?.name && existingData.name.trim()) ? existingData.name : (resumeData.parsedFields.name || manualFields.name),
        email: (existingData?.email && existingData.email.trim()) ? existingData.email : (resumeData.parsedFields.email || manualFields.email),
        phone: (existingData?.phone && existingData.phone.trim()) ? existingData.phone : (resumeData.parsedFields.phone || manualFields.phone),
      };
      setManualFields(updatedFields);
      
      // Only update parent component with new contact fields that were actually parsed from resume
      const contactFields = ['name', 'email', 'phone'] as const;
      contactFields.forEach((field) => {
        const value = resumeData.parsedFields[field];
        const existingValue = existingData?.[field];
        
        if (typeof value === 'string' && value.trim() && (!existingValue || !existingValue.trim())) {
          onFieldUpdate(field, value);
        }
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to parse resume');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualFieldChange = (field: 'name' | 'email' | 'phone', value: string) => {
    setManualFields(prev => ({ ...prev, [field]: value }));
    
    // Validate and update if valid
    let isValid = false;
    switch (field) {
      case 'name':
        isValid = validateName(value);
        break;
      case 'email':
        isValid = validateEmail(value);
        break;
      case 'phone':
        isValid = validatePhone(value);
        break;
    }
    
    if (isValid || value.trim() === '') {
      onFieldUpdate(field, value);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFieldValid = (field: 'name' | 'email' | 'phone') => {
    const value = manualFields[field];
    if (!value) return false;
    
    switch (field) {
      case 'name':
        return validateName(value);
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      default:
        return false;
    }
  };

  const getFieldIcon = (field: 'name' | 'email' | 'phone') => {
    switch (field) {
      case 'name':
        return User;
      case 'email':
        return Mail;
      case 'phone':
        return Phone;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* File Upload Area */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload Your Resume</h3>
        
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : uploadedFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                <p className="text-blue-600 font-medium">Processing your resume...</p>
              </motion.div>
            ) : uploadedFile ? (
              <motion.div
                key="uploaded"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-green-700">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-600">Resume uploaded successfully!</p>
                </div>
                <button
                  onClick={removeFile}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Remove file
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Drop your resume here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF and DOCX files up to 10MB
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{uploadError}</p>
          </motion.div>
        )}
      </div>

      {/* Manual Field Entry */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        <p className="text-sm text-gray-600">
          Please verify or fill in your contact details below:
        </p>

        <div className="grid gap-4">
          {(['name', 'email', 'phone'] as const).map((field) => {
            const Icon = getFieldIcon(field);
            const isMissing = missingFields.includes(field);
            const isValid = isFieldValid(field);
            
            return (
              <motion.div
                key={field}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-1"
              >
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {field}
                  {isMissing && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className={`w-4 h-4 ${
                      isMissing ? 'text-red-400' : isValid ? 'text-green-400' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={manualFields[field]}
                    onChange={(e) => handleManualFieldChange(field, e.target.value)}
                    placeholder={`Enter your ${field}`}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isMissing
                        ? 'border-red-300 bg-red-50'
                        : isValid
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300'
                    }`}
                  />
                  
                  {isValid && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
                
                {isMissing && (
                  <p className="text-xs text-red-600">This field is required to start the interview</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};