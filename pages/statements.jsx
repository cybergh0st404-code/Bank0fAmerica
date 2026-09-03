'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  FileText, 
  Download, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ArrowDownToLine, 
  ExternalLink,
  Shield,
  FileCheck
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../utils/AuthContext';
import AccountNoticeCard from '../components/AccountNoticeCard';

const StatementsPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('statements');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [paperless, setPaperless] = useState(true);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (!user) return;
    const fetchAccountData = async () => {
      try {
        const res = await fetch('/api/user/account-data');
        if (res.ok) {
          const data = await res.json();
          if (data.notice && data.notice.enabled) {
            setNotice(data.notice);
          } else {
            setNotice(null);
          }
        }
      } catch (err) {
        console.error('Error fetching account data:', err);
      }
    };
    fetchAccountData();
  }, [user]);

  const handleDownload = (name) => {
    alert(`Downloading ${name}... Your official Bank of America document is generating.`);
  };

  const statements2026 = [
    { id: 'st-01-26', month: 'January 2026', period: 'Jan 01, 2026 - Jan 31, 2026', size: '1.4 MB', closingBal: '$1,324,742.22' },
    { id: 'st-02-26', month: 'February 2026', period: 'Feb 01, 2026 - Feb 28, 2026', size: '1.2 MB', closingBal: '$1,324,742.22' },
  ];

  const statements2025 = [
    { id: 'st-12-25', month: 'December 2025', period: 'Dec 01, 2025 - Dec 31, 2025', size: '1.6 MB', closingBal: '$1,349,742.22' },
    { id: 'st-11-25', month: 'November 2025', period: 'Nov 01, 2025 - Nov 30, 2025', size: '1.5 MB', closingBal: '$1,335,120.00' },
    { id: 'st-10-25', month: 'October 2025', period: 'Oct 01, 2025 - Oct 31, 2025', size: '1.3 MB', closingBal: '$1,310,000.50' },
  ];

  const taxDocuments = [
    { id: 'tax-1099-2025', form: 'Form 1099-INT', title: 'Interest Income Tax Summary', taxYear: '2025', date: 'Jan 15, 2026', size: '820 KB' },
    { id: 'tax-1099-2024', form: 'Form 1099-INT', title: 'Interest Income Tax Summary', taxYear: '2024', date: 'Jan 18, 2025', size: '790 KB' },
    { id: 'tax-ann-2025', form: 'Annual Statement', title: 'Full Year Account Summary', taxYear: '2025', date: 'Dec 31, 2025', size: '2.1 MB' },
  ];

  const currentStatements = selectedYear === '2026' ? statements2026 : statements2025;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={user} onLogout={logout} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-primary-navy mb-1">Statements & Documents</h1>
                <p className="text-neutral-600 text-sm">Access your official electronic account statements and tax records.</p>
              </div>

              {/* Paperless Toggle */}
              <div className="flex items-center space-x-2 bg-white px-3.5 py-2 rounded-bank border border-neutral-200 shadow-sm">
                <FileCheck className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-neutral-700">Paperless Delivery:</span>
                <button
                  onClick={() => setPaperless(!paperless)}
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    paperless ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {paperless ? 'Enrolled' : 'Off'}
                </button>
              </div>
            </div>

            {notice && notice.enabled ? (
              <AccountNoticeCard notice={notice} />
            ) : (
              <>
                {/* Tabs */}
                <div className="flex space-x-2 border-b border-neutral-200 pb-2">
                  <button
                    onClick={() => setActiveTab('statements')}
                    className={`px-4 py-2 text-sm font-semibold rounded-t-bank transition-colors ${
                      activeTab === 'statements'
                        ? 'bg-white border-b-2 border-primary-blue text-primary-blue shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Monthly e-Statements
                  </button>
                  <button
                    onClick={() => setActiveTab('taxes')}
                    className={`px-4 py-2 text-sm font-semibold rounded-t-bank transition-colors ${
                      activeTab === 'taxes'
                        ? 'bg-white border-b-2 border-primary-blue text-primary-blue shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Tax Documents (1099)
                  </button>
                </div>

                {/* Statements Tab */}
                {activeTab === 'statements' && (
                  <Card>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 pb-4 border-b border-neutral-200">
                      <div>
                        <h2 className="text-lg font-bold text-primary-navy">Official Account Statements</h2>
                        <p className="text-xs text-neutral-500">Checking Account **** 4532</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-neutral-600">Year:</span>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="input-field text-xs py-1.5 px-3 w-28"
                        >
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200 text-sm">
                        <thead>
                          <tr className="bg-neutral-50 text-neutral-600">
                            <th className="text-left py-3 px-4 font-semibold">Statement Period</th>
                            <th className="text-left py-3 px-4 font-semibold">Date Range</th>
                            <th className="text-left py-3 px-4 font-semibold">Closing Balance</th>
                            <th className="text-left py-3 px-4 font-semibold">File Size</th>
                            <th className="text-right py-3 px-4 font-semibold">Download</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {currentStatements.map((st) => (
                            <tr key={st.id} className="hover:bg-neutral-50 transition-colors">
                              <td className="py-3.5 px-4 font-semibold text-neutral-900 flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-primary-blue" />
                                <span>{st.month}</span>
                              </td>
                              <td className="py-3.5 px-4 text-neutral-600 text-xs">{st.period}</td>
                              <td className="py-3.5 px-4 font-bold text-neutral-900">{st.closingBal}</td>
                              <td className="py-3.5 px-4 text-neutral-500 text-xs">{st.size}</td>
                              <td className="py-3.5 px-4 text-right">
                                <Button
                                  variant="outline"
                                  onClick={() => handleDownload(`Bank of America Statement - ${st.month}.pdf`)}
                                  className="text-xs px-3 py-1 inline-flex items-center space-x-1"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download PDF</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Taxes Tab */}
                {activeTab === 'taxes' && (
                  <Card title="Year-End Tax Forms" subtitle="Official IRS-reported banking documents">
                    <div className="divide-y divide-neutral-200">
                      {taxDocuments.map((tax) => (
                        <div key={tax.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-bank bg-red-100 flex items-center justify-center text-accent-red flex-shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-neutral-900">{tax.form}</span>
                                <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-mono">
                                  Tax Year {tax.taxYear}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-0.5">{tax.title} • Issued {tax.date}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => handleDownload(`${tax.form}_Tax_Year_${tax.taxYear}.pdf`)}
                            className="text-xs px-3.5 py-1.5 flex items-center space-x-1.5"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Tax PDF ({tax.size})</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default StatementsPage;
