"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Users, Activity, FileText, ShieldCheck,
  Search, ChevronRight, RefreshCw, ArrowUpRight,
  Clock, CheckCircle2, XCircle
} from 'lucide-react';

type Patient = {
  uid: string;
  email: string;
  displayName: string;
  creationTime: string;
  lastSignInTime: string;
  disabled: boolean;
  documentsCount?: number;
};

export default function AdminPage() {
  const { user, isAdmin, getIdToken, loading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, loading]);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      fetchPatients();
    }
  }, [user, isAdmin, loading]);

  const fetchPatients = async () => {
    setFetchLoading(true);
    setError('');
    try {
      const token = await getIdToken();
      const res = await fetch('http://127.0.0.1:8000/api/admin/patients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const filtered = patients.filter(p =>
    (p.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: patients.length,
    active: patients.filter(p => !p.disabled).length,
    disabled: patients.filter(p => p.disabled).length,
  };

  if (loading || (!user && !loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
          Loading admin panel...
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 ml-[280px] mr-0 bg-gray-50 min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Admin Panel</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Patient Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all registered patients across Vitalis AI</p>
        </div>
        <button onClick={fetchPatients}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Patients', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Accounts', value: stats.active, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Suspended', value: stats.disabled, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-lg`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Patient table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs text-gray-500 ml-auto">{filtered.length} patients</span>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">
            {error} — Is the backend running?
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/70 border-b border-gray-100">
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Last Active</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {fetchLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                  {patients.length === 0 ? 'No patients registered yet.' : 'No patients match your search.'}
                </td>
              </tr>
            ) : (
              filtered.map(patient => (
                <tr key={patient.uid} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                        {(patient.displayName || patient.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.displayName || 'Unnamed Patient'}</p>
                        <p className="text-xs text-gray-400 font-mono">{patient.uid.slice(0, 12)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{patient.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={13} />
                      {patient.creationTime ? new Date(patient.creationTime).toLocaleDateString() : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {patient.lastSignInTime ? new Date(patient.lastSignInTime).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      patient.disabled
                        ? 'bg-red-50 text-red-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${patient.disabled ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      {patient.disabled ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
