"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, ArrowUpRight, ArrowDownRight, Activity, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const healthMetrics = [
  { name: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'Normal', trend: 'down', color: 'bg-green-500' },
  { name: 'Blood Sugar (Fasting)', value: '95', unit: 'mg/dL', status: 'Normal', trend: 'stable', color: 'bg-green-500' },
  { name: 'LDL Cholesterol', value: '110', unit: 'mg/dL', status: 'Elevated', trend: 'up', color: 'bg-yellow-500' },
  { name: 'Triglycerides', value: '140', unit: 'mg/dL', status: 'Normal', trend: 'down', color: 'bg-green-500' },
  { name: 'BMI', value: '24.2', unit: '', status: 'Normal', trend: 'stable', color: 'bg-green-500' },
];

export default function CenterWorkspace() {
  const { getIdToken } = useAuth();
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadStatus('error');
      setErrorMessage('Only image files are supported in this MVP.');
      return;
    }

    setUploadedFileName(file.name);
    setUploadStatus('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadStatus('processing');
      const token = await getIdToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://127.0.0.1:8000/api/upload/', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload success:', data);
      setUploadStatus('done');
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err.message || 'An error occurred during upload.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
        handleFileChange({ target: { files: e.dataTransfer.files } } as any);
      }
    }
  };

  return (
    <main className="flex-1 ml-[280px] mr-[420px] bg-gray-50/30 min-h-screen p-8">
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, John</h2>
            <p className="text-sm text-gray-500 mt-1">Here is your latest health overview based on your recent reports.</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Risk Score</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">Low</span>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">92/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {healthMetrics.map((metric) => (
          <div key={metric.name} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-gray-500">{metric.name}</span>
              <div className={`w-2 h-2 rounded-full ${metric.color}`}></div>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
              <span className="text-xs text-gray-500">{metric.unit}</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                metric.status === 'Normal' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
              }`}>
                {metric.status}
              </span>
              {metric.trend === 'up' && <ArrowUpRight size={14} className="text-gray-400" />}
              {metric.trend === 'down' && <ArrowDownRight size={14} className="text-gray-400" />}
              {metric.trend === 'stable' && <Activity size={14} className="text-gray-400" />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Upload & Pipeline Area */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Upload Medical Report</h3>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center py-10 cursor-pointer"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <div className="w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-3">
                <UploadCloud size={24} className="text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">JPEG, PNG images only (MVP restriction)</p>
            </div>

            {uploadStatus === 'error' && (
              <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm flex gap-2 items-center">
                <AlertTriangle size={16} />
                {errorMessage}
              </div>
            )}

            {/* OCR Pipeline Visualization */}
            {uploadStatus !== 'idle' && uploadStatus !== 'error' && (
              <div className="mt-6 border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Latest Upload: <span className="font-semibold text-gray-900">{uploadedFileName}</span></h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                    uploadStatus === 'done' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600 flex items-center gap-1'
                  }`}>
                    {uploadStatus === 'processing' && <Loader2 size={12} className="animate-spin" />}
                    {uploadStatus === 'done' ? 'Complete' : 'Processing...'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 z-0"></div>
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 z-0 transition-all duration-1000"
                    style={{ width: uploadStatus === 'done' ? '100%' : '50%' }}
                  ></div>
                  
                  {[
                    { name: 'Upload', status: uploadStatus === 'uploading' ? 'active' : 'done' },
                    { name: 'OCR', status: uploadStatus === 'processing' ? 'active' : (uploadStatus === 'done' ? 'done' : 'pending') },
                    { name: 'Data Cleaning', status: uploadStatus === 'processing' ? 'active' : (uploadStatus === 'done' ? 'done' : 'pending') },
                    { name: 'Medical Analysis', status: uploadStatus === 'done' ? 'done' : 'pending' },
                    { name: 'Summary', status: uploadStatus === 'done' ? 'done' : 'pending' }
                  ].map((step, idx) => (
                    <div key={step.name} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                        step.status === 'done' ? 'bg-blue-500 border-blue-500 text-white' : 
                        step.status === 'active' ? 'bg-white border-blue-500 text-blue-500' : 
                        'bg-white border-gray-300 text-gray-300'
                      }`}>
                        {step.status === 'done' ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current"></div>}
                      </div>
                      <span className={`text-[10px] font-medium absolute -bottom-5 w-24 text-center ${
                        step.status === 'pending' ? 'text-gray-400' : 'text-gray-700'
                      }`}>
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Health Summary Sidebar */}
        <div className="col-span-1 space-y-4">
          
          {/* Critical Alerts */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-red-600">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-red-800">Review Required</h4>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  LDL Cholesterol is slightly elevated. Consider reducing saturated fats. See AI panel for dietary alternatives.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              Patient Profile
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Conditions</span>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md border border-gray-200">Pre-hypertension</span>
                </div>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Allergies</span>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-md border border-orange-100">Penicillin</span>
                  <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-md border border-orange-100">Peanuts</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Medications</span>
                <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100">
                  None active.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
