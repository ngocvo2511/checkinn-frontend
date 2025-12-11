'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function PersonalDataForm() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+84',
    gender: '',
    birthday: '',
    country: '',
    address: ''
  });
  const [originalData, setOriginalData] = useState(formData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const genderOptions = ['Male', 'Female', 'Other'];
  const countryOptions = [
    'Vietnam',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'France',
    'Germany',
    'Japan',
    'China',
    'India',
    'Brazil',
    'Mexico',
    'South Korea',
    'Singapore',
    'Thailand',
    'Indonesia',
    'Malaysia',
    'Philippines'
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8080/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      const newData = {
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        birthday: data.birthday || '',
        address: data.address || '',
        gender: data.gender || '',
        country: data.country || ''
      };
      setFormData(newData);
      setOriginalData(newData);
      setError('');
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('http://localhost:8080/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          birthday: formData.birthday,
          address: formData.address,
          gender: formData.gender,
          country: formData.country
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save changes');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setError('');
    } catch (err) {
      console.error('Error saving user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#DDDFE3] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 items-center justify-between px-4 md:px-8 lg:px-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-[#0057FF]">tripto</span>
            <span className="rounded-full bg-[#FFCC00] px-2 py-0.5 text-xs font-semibold text-[#121316]">new</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 rounded-full bg-[#F1F2F3] px-3 py-2 hover:bg-[#E1E2E7]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0057FF] text-xs font-bold text-white">
                  {formData.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-[#2B3037]">{formData.fullName || 'User'}</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#DDDFE3] bg-white shadow-lg">
                  <button className="w-full px-4 py-2 text-left text-sm text-[#2B3037] hover:bg-[#F1F2F3]">
                    Booking History
                  </button>
                  <hr className="my-1 border-[#DDDFE3]" />
                  <button
                    onClick={() => { handleLogout(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-[1440px] mx-auto w-full px-[104px] py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 sticky top-28">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-semibold text-lg">
                  {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'E'}
                </div>
                <div>
                  <h3 className="font-semibold text-[#1f2226]">{formData.fullName || 'Loading...'}</h3>
                  <p className="text-xs text-[#8b94a4]">Traveler</p>
                </div>
              </div>

              {/* Divider */}
              <div className="mb-6 border-b border-gray-200"></div>

              {/* Navigation Menu */}
              <nav className="space-y-2 mb-6">
                <button className="w-full text-left px-5 py-3 rounded-xl bg-[#e8effc] text-[#0057ff] font-medium text-base flex items-center gap-2 hover:bg-[#d4e3f7]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                  </svg>
                  Personal Data
                </button>
                
                <button className="w-full text-left px-5 py-3 rounded-xl text-[#383e48] font-medium text-base flex items-center gap-2 hover:bg-gray-50">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6h-2V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v2H9V4c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v2H1v2h2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8h2V6zm0 12H5V8h14v10zm-9-9h2v2h-2zm4 0h2v2h-2zm-8 0h2v2H6z"/>
                  </svg>
                  Payment Account
                </button>
                
                <button className="w-full text-left px-5 py-3 rounded-xl text-[#383e48] font-medium text-base flex items-center justify-between gap-2 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 6.41L16.59 5 12 9.59 7.41 5 6 6.41 11.59 12 6 17.59 7.41 19 12 14.41 16.59 19 18 17.59 12.41 12 18 6.41z"/>
                    </svg>
                    Trips
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#383e48]">
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </button>
                
                <button className="w-full text-left px-5 py-3 rounded-xl text-[#383e48] font-medium text-base flex items-center gap-2 hover:bg-gray-50">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  Wish Lists
                </button>
                
                <button className="w-full text-left px-5 py-3 rounded-xl text-[#383e48] font-medium text-base flex items-center gap-2 hover:bg-gray-50">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                  </svg>
                  Support
                </button>
                
                <button className="w-full text-left px-5 py-3 rounded-xl text-[#383e48] font-medium text-base flex items-center gap-2 hover:bg-gray-50">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16zm-5.04-6.71l-2.75 3.54-2.19-2.92c-.25-.33-.73-.32-1.01.03l-3.26 4.47c-.33.45-.1 1.1.4 1.1h15.2c.5 0 .73-.65.4-1.1l-6.59-9.12c-.24-.33-.73-.34-1.01-.02z"/>
                  </svg>
                  Reviews
                </button>
              </nav>

              {/* Divider */}
              <div className="mb-6 border-b border-gray-200"></div>

              {/* Settings */}
              <button className="w-full text-left px-5 py-3 rounded-xl text-[#383e48] font-medium text-base flex items-center gap-2 hover:bg-gray-50 mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.64l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.49.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.22-.07.49.12.64l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.64l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.49-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.64l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                </svg>
                Settings
              </button>

              {/* Logout */}
              <button className="w-full text-left px-5 py-3 rounded-xl text-[#ee0000] font-medium text-base flex items-center gap-2 hover:bg-red-50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#ee0000]">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                Log out
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {/* Edit Photo Section */}
            <div className="bg-white rounded-2xl overflow-hidden mb-6">
              <div className="h-[180px] flex items-start justify-between p-6">
                <div className="flex items-start gap-8">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex-shrink-0 flex items-center justify-center text-white font-semibold text-5xl">
                    {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'E'}
                  </div>
                  <div>
                    <h1 className="text-4xl font-semibold text-[#454c58] mb-2">My Profile</h1>
                    <p className="text-lg text-[#8b94a4]">Real-time information and activities of your prototype.</p>
                  </div>
                </div>
                <button className="flex items-center justify-center gap-2 h-14 px-4 rounded-xl text-[#B5BAC2] hover:bg-gray-50 transition-colors">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 7.29167H19.2967L18.7296 5.58724C18.3714 4.51391 17.3704 3.79167 16.2388 3.79167H11.7612C10.6296 3.79167 9.62855 4.51391 9.27039 5.58724L8.70329 7.29167H7C4.179 7.29167 2.625 8.84567 2.625 11.6667V21C2.625 23.821 4.179 25.375 7 25.375H21C23.821 25.375 25.375 23.821 25.375 21V11.6667C25.375 8.84567 23.821 7.29167 21 7.29167ZM23.625 21C23.625 22.8398 22.8398 23.625 21 23.625H7C5.16017 23.625 4.375 22.8398 4.375 21V11.6667C4.375 9.82684 5.16017 9.04167 7 9.04167H9.33333C9.71017 9.04167 10.0437 8.80024 10.1639 8.44324L10.9318 6.13896C11.0508 5.78079 11.3844 5.54053 11.7612 5.54053H16.2388C16.6156 5.54053 16.9492 5.78079 17.0682 6.13896L17.8361 8.4421C17.9563 8.7991 18.2898 9.04053 18.6667 9.04053H21C22.8398 9.04053 23.625 9.8257 23.625 11.6655V21ZM14 11.9583C11.5885 11.9583 9.625 13.9207 9.625 16.3333C9.625 18.746 11.5885 20.7083 14 20.7083C16.4115 20.7083 18.375 18.746 18.375 16.3333C18.375 13.9207 16.4115 11.9583 14 11.9583ZM14 18.9583C12.5533 18.9583 11.375 17.7812 11.375 16.3333C11.375 14.8855 12.5533 13.7083 14 13.7083C15.4467 13.7083 16.625 14.8855 16.625 16.3333C16.625 17.7812 15.4467 18.9583 14 18.9583ZM21.5833 12.25C21.5833 12.894 21.0607 13.4167 20.4167 13.4167C19.7727 13.4167 19.25 12.894 19.25 12.25C19.25 11.606 19.7727 11.0833 20.4167 11.0833C21.0607 11.0833 21.5833 11.606 21.5833 12.25Z" fill="#8B94A4"/>
                  </svg>
                  <span className="text-xl font-medium">Edit</span>
                </button>
              </div>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-2xl p-6">
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0057FF]"></div>
                  <span className="ml-2 text-[#454C58]">Loading your profile...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {saveSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                  Profile updated successfully!
                </div>
              )}

              {/* Form Content */}
              {!loading && (
              <>
              {/* First Row: Full Name */}
              <div className="flex justify-between gap-6 mb-10">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-lg font-medium text-[#454C58]">Full Name</label>
            <div className="flex items-center gap-1 h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.009 10.75C9.66503 10.75 7.75903 8.843 7.75903 6.5C7.75903 4.157 9.66503 2.25 12.009 2.25C14.353 2.25 16.259 4.157 16.259 6.5C16.259 8.843 14.353 10.75 12.009 10.75ZM12.009 3.75C10.492 3.75 9.25903 4.983 9.25903 6.5C9.25903 8.017 10.492 9.25 12.009 9.25C13.526 9.25 14.759 8.017 14.759 6.5C14.759 4.983 13.525 3.75 12.009 3.75ZM15.9969 21.75H8.00305C5.58305 21.75 4.25 20.425 4.25 18.019C4.25 15.358 5.756 12.25 10 12.25H14C18.244 12.25 19.75 15.357 19.75 18.019C19.75 20.425 18.4169 21.75 15.9969 21.75ZM10 13.75C6.057 13.75 5.75 17.017 5.75 18.019C5.75 19.583 6.42405 20.25 8.00305 20.25H15.9969C17.5759 20.25 18.25 19.583 18.25 18.019C18.25 17.018 17.943 13.75 14 13.75H10Z" fill="#383E48"/>
              </svg>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="flex-1 text-base text-[#383E48] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Second Row: Email Address, Phone Number */}
        <div className="flex justify-between gap-6 mb-10">
          <div className="flex flex-col gap-2 w-[480px]">
            <label className="text-lg font-medium text-[#454C58]">Email Address</label>
            <div className="flex items-center gap-1 h-14 px-4 border border-[#B5BAC2] rounded-xl bg-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 20.75H6C3.582 20.75 2.25 19.418 2.25 17V8C2.25 5.582 3.582 4.25 6 4.25H18C20.418 4.25 21.75 5.582 21.75 8V17C21.75 19.418 20.418 20.75 18 20.75ZM6 5.75C4.423 5.75 3.75 6.423 3.75 8V17C3.75 18.577 4.423 19.25 6 19.25H18C19.577 19.25 20.25 18.577 20.25 17V8C20.25 6.423 19.577 5.75 18 5.75H6ZM13.0291 13.179L17.9409 9.60699C18.2759 9.36399 18.35 8.89401 18.106 8.55901C17.863 8.22501 17.3951 8.149 17.0581 8.394L12.146 11.966C12.058 12.03 11.941 12.03 11.853 11.966L6.94092 8.394C6.60292 8.149 6.13607 8.22601 5.89307 8.55901C5.64907 8.89401 5.72311 9.36299 6.05811 9.60699L10.97 13.18C11.278 13.404 11.639 13.515 11.999 13.515C12.359 13.515 12.7221 13.403 13.0291 13.179Z" fill="#B5BAC2"/>
              </svg>
              <input
                type="email"
                value={formData.email}
                disabled
                className="flex-1 text-base text-[#B5BAC2] outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 w-[480px]">
            <label className="text-lg font-medium text-[#454C58]">Phone Number</label>
            <div className="flex items-center gap-2 h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-between w-10 px-[2px] border border-[#DDDFE3] rounded-xl bg-white">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_10006_27118)">
                      <path d="M0 0.0208435H20V20.0208H0" fill="#CE1126"/>
                      <path d="M20 18.5H0V16.9583H20V18.5ZM20 15.4167H0V13.875H20V15.4167ZM20 12.3333H0V10.7917H20V12.3333ZM20 9.25H0V7.70833H20V9.25ZM20 6.16667H0V4.625H20V6.16667ZM20 3.09584H0V1.55417H20V3.09584Z" fill="white"/>
                      <path d="M0 0.0208435H8V10.7917H0" fill="#007AFF"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_10006_27118">
                        <rect width="20" height="20" rx="10" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.0005 9.83334C7.8725 9.83334 7.74448 9.78469 7.64715 9.68669L4.98048 7.02003C4.78515 6.82469 4.78515 6.508 4.98048 6.31267C5.17582 6.11733 5.49251 6.11733 5.68784 6.31267L8.00115 8.62598L10.3145 6.31267C10.5098 6.11733 10.8265 6.11733 11.0218 6.31267C11.2172 6.508 11.2172 6.82469 11.0218 7.02003L8.35516 9.68669C8.25649 9.78469 8.1285 9.83334 8.0005 9.83334Z" fill="#383E48"/>
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-base text-[#383E48]">(+84)</span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="flex-1 text-base text-[#383E48] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Third Row: Gender, Birthday, Country */}
        <div className="flex justify-between gap-6 mb-10">
          <div className="flex flex-col gap-2 w-[220px]">
            <label className="text-lg font-medium text-[#454C58]">Gender</label>
            <div 
              onClick={() => setShowGenderDropdown(!showGenderDropdown)}
              className="relative flex items-center justify-between h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white cursor-pointer hover:border-[#0057FF] transition-colors"
            >
              <div className="flex items-center gap-1 flex-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_10006_13343)">
                    <path d="M23.25 0H19.5C19.086 0 18.75 0.336 18.75 0.75C18.75 1.164 19.086 1.5 19.5 1.5H21.4395L17.7083 5.23125C16.5532 4.3065 15.0915 3.75 13.5 3.75C12.0465 3.75 10.6365 4.22475 9.47475 5.0895C8.625 4.71 7.6965 4.5 6.75 4.5C3.0285 4.5 0 7.5285 0 11.25C0 14.718 2.63025 17.5807 6 17.9557V20.25H4.5C4.086 20.25 3.75 20.586 3.75 21C3.75 21.414 4.086 21.75 4.5 21.75H6V23.25C6 23.664 6.336 24 6.75 24C7.164 24 7.5 23.664 7.5 23.25V21.75H9C9.414 21.75 9.75 21.414 9.75 21C9.75 20.586 9.414 20.25 9 20.25H7.5V17.9528C8.68425 17.82 9.8145 17.3752 10.7752 16.6605C11.625 17.04 12.5535 17.25 13.5 17.25C17.2215 17.25 20.25 14.2215 20.25 10.5C20.25 8.9085 19.6935 7.44675 18.7687 6.29175L22.5 2.5605V4.5C22.5 4.914 22.836 5.25 23.25 5.25C23.664 5.25 24 4.914 24 4.5V0.75C24 0.336 23.664 0 23.25 0ZM13.5 15.75C12.6307 15.75 11.7773 15.5347 11.0243 15.1252C9.31275 14.2155 8.25 12.4432 8.25 10.5C8.25 9.996 8.3205 9.50175 8.45925 9.03225C8.577 8.6355 8.34975 8.2185 7.95225 8.10075C7.55625 7.9845 7.13775 8.21025 7.02075 8.60775C6.8415 9.21525 6.75 9.852 6.75 10.5C6.75 12.6053 7.7295 14.5463 9.348 15.8063C8.5605 16.2563 7.6665 16.5 6.75 16.5C3.855 16.5 1.5 14.145 1.5 11.25C1.5 8.355 3.855 6 6.75 6C7.61925 6 8.47275 6.21525 9.22575 6.62475C10.9373 7.5345 12 9.30675 12 11.25C12 11.7495 11.9295 12.2407 11.7907 12.7095C11.673 13.107 11.9002 13.524 12.297 13.6417C12.6938 13.758 13.1108 13.5323 13.2292 13.1355C13.4085 12.528 13.5 11.8935 13.5 11.25C13.5 9.14475 12.5205 7.20375 10.902 5.94375C11.6895 5.49375 12.5835 5.25 13.5 5.25C16.395 5.25 18.75 7.605 18.75 10.5C18.75 13.395 16.395 15.75 13.5 15.75Z" fill="#454C58"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_10006_13343">
                      <rect width="24" height="24" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                <span className="flex-1 text-base text-[#383E48]">{formData.gender || 'Select gender'}</span>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${showGenderDropdown ? 'rotate-180' : ''}`}>
                <path d="M11.9998 14.75C11.8078 14.75 11.6157 14.6771 11.4697 14.5301L7.46975 10.5301C7.17675 10.2371 7.17675 9.76202 7.46975 9.46902C7.76275 9.17602 8.23779 9.17602 8.53079 9.46902L12.0008 12.939L15.4707 9.46902C15.7637 9.17602 16.2388 9.17602 16.5318 9.46902C16.8248 9.76202 16.8248 10.2371 16.5318 10.5301L12.5318 14.5301C12.3838 14.6771 12.1918 14.75 11.9998 14.75Z" fill="#383E48"/>
              </svg>

              {showGenderDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DDDFE3] rounded-xl shadow-lg z-10">
                  {genderOptions.map((option) => (
                    <button
                      key={option}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({...formData, gender: option});
                        setShowGenderDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#E8EFFC] text-[#383E48] text-base first:rounded-t-xl last:rounded-b-xl transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-[220px]">
            <label className="text-lg font-medium text-[#454C58]">Birthday</label>
            <div className="relative flex items-center h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white hover:border-[#0057FF] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 3.75H16.75V3C16.75 2.586 16.414 2.25 16 2.25C15.586 2.25 15.25 2.586 15.25 3V3.75H8.75V3C8.75 2.586 8.414 2.25 8 2.25C7.586 2.25 7.25 2.586 7.25 3V3.75H6C3.582 3.75 2.25 5.082 2.25 7.5V18C2.25 20.418 3.582 21.75 6 21.75H18C20.418 21.75 21.75 20.418 21.75 18V7.5C21.75 5.082 20.418 3.75 18 3.75ZM6 5.25H7.25V6C7.25 6.414 7.586 6.75 8 6.75C8.414 6.75 8.75 6.414 8.75 6V5.25H15.25V6C15.25 6.414 15.586 6.75 16 6.75C16.414 6.75 16.75 6.414 16.75 6V5.25H18C19.577 5.25 20.25 5.923 20.25 7.5V8.25H3.75V7.5C3.75 5.923 4.423 5.25 6 5.25ZM18 20.25H6C4.423 20.25 3.75 19.577 3.75 18V9.75H20.25V18C20.25 19.577 19.577 20.25 18 20.25ZM9.02002 13C9.02002 13.552 8.57302 14 8.02002 14C7.46802 14 7.01489 13.552 7.01489 13C7.01489 12.448 7.45801 12 8.01001 12H8.02002C8.57202 12 9.02002 12.448 9.02002 13ZM13.02 13C13.02 13.552 12.573 14 12.02 14C11.468 14 11.0149 13.552 11.0149 13C11.0149 12.448 11.458 12 12.01 12H12.02C12.572 12 13.02 12.448 13.02 13ZM17.02 13C17.02 13.552 16.573 14 16.02 14C15.468 14 15.0149 13.552 15.0149 13C15.0149 12.448 15.458 12 16.01 12H16.02C16.572 12 17.02 12.448 17.02 13ZM9.02002 17C9.02002 17.552 8.57302 18 8.02002 18C7.46802 18 7.01489 17.552 7.01489 17C7.01489 16.448 7.45801 16 8.01001 16H8.02002C8.57202 16 9.02002 16.448 9.02002 17ZM13.02 17C13.02 17.552 12.573 18 12.02 18C11.468 18 11.0149 17.552 11.0149 17C11.0149 16.448 11.458 16 12.01 16H12.02C12.572 16 13.02 16.448 13.02 17ZM17.02 17C17.02 17.552 16.573 18 16.02 18C15.468 18 15.0149 17.552 15.0149 17C15.0149 16.448 15.458 16 16.01 16H16.02C16.572 16 17.02 16.448 17.02 17Z" fill="#383E48"/>
              </svg>
              <DatePicker
                selected={formData.birthday ? new Date(formData.birthday) : null}
                onChange={(date) => {
                  if (date) {
                    const formatted = date.toISOString().split('T')[0];
                    setFormData({...formData, birthday: formatted});
                  }
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="flex-1 ml-2 text-base text-[#383E48] outline-none bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 w-[480px]">
            <label className="text-lg font-medium text-[#454C58]">Country</label>
            <div 
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="relative flex items-center justify-between h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white cursor-pointer hover:border-[#0057FF] transition-colors"
            >
              <div className="flex items-center gap-1 flex-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1.25C6.072 1.25 1.25 6.073 1.25 12C1.25 17.927 6.072 22.75 12 22.75C17.928 22.75 22.75 17.927 22.75 12C22.75 6.073 17.928 1.25 12 1.25ZM21.212 11.25H17.162C17.031 8.507 16.187 5.71201 14.727 3.16101C18.27 4.25701 20.903 7.43 21.212 11.25ZM12.73 2.78699C14.486 5.39799 15.509 8.36 15.662 11.25H8.33801C8.49001 8.36 9.51399 5.39799 11.27 2.78699C11.512 2.76799 11.754 2.75 12 2.75C12.246 2.75 12.489 2.76799 12.73 2.78699ZM9.27301 3.16101C7.81301 5.71201 6.96901 8.507 6.83801 11.25H2.78799C3.09699 7.43 5.73001 4.25701 9.27301 3.16101ZM2.78799 12.75H6.83801C6.96901 15.493 7.81301 18.288 9.27301 20.839C5.73001 19.743 3.09699 16.57 2.78799 12.75ZM11.27 21.213C9.51399 18.602 8.49101 15.64 8.33801 12.75H15.662C15.51 15.64 14.486 18.602 12.73 21.213C12.488 21.232 12.246 21.25 12 21.25C11.754 21.25 11.511 21.232 11.27 21.213ZM14.727 20.839C16.187 18.288 17.031 15.493 17.162 12.75H21.212C20.903 16.57 18.27 19.743 14.727 20.839Z" fill="#383E48"/>
                </svg>
                <span className="flex-1 text-base text-[#383E48]">{formData.country || 'Select country'}</span>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`}>
                <path d="M11.9998 14.75C11.8078 14.75 11.6157 14.6771 11.4697 14.5301L7.46975 10.5301C7.17675 10.2371 7.17675 9.76202 7.46975 9.46902C7.76275 9.17602 8.23779 9.17602 8.53079 9.46902L12.0008 12.939L15.4707 9.46902C15.7637 9.17602 16.2388 9.17602 16.5318 9.46902C16.8248 9.76202 16.8248 10.2371 16.5318 10.5301L12.5318 14.5301C12.3838 14.6771 12.1918 14.75 11.9998 14.75Z" fill="#383E48"/>
              </svg>

              {showCountryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#DDDFE3] rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                  {countryOptions.map((option) => (
                    <button
                      key={option}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({...formData, country: option});
                        setShowCountryDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#E8EFFC] text-[#383E48] text-base first:rounded-t-xl last:rounded-b-xl transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fourth Row: Address (full width) */}
        <div className="flex justify-between gap-6 mb-10">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-lg font-medium text-[#454C58]">Address</label>
            <div className="flex items-center gap-1 h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="flex-1 text-base text-[#383E48] outline-none"
              />
            </div>
          </div>
        </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-6 mt-16 pt-6 border-t border-gray-200">
                <button 
                  onClick={() => setFormData(originalData)}
                  disabled={isSaving}
                  className="flex items-center justify-center h-12 px-4 min-w-[154px] rounded-xl border border-[#2B3037] bg-white text-lg font-medium text-[#2B3037] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center justify-center h-12 px-4 min-w-[154px] rounded-xl border border-[#0057FF] bg-white text-lg font-medium text-[#0057FF] hover:bg-[#E8EFFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
              </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#121316] text-white mt-16">
        <div className="max-w-[1440px] mx-auto px-[104px] py-8">
          <div className="grid grid-cols-5 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-[#99bdff] text-lg mb-4">Explore</h4>
              <ul className="space-y-3 text-base">
                <li><a href="#" className="text-gray-300 hover:text-white transition">Trending Destinations</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Summer Hotspots</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Winter Getaways</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Weekend Deals</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Family-Friendly Stays</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#99bdff] text-lg mb-4">Property Types</h4>
              <ul className="space-y-3 text-base">
                <li><a href="#" className="text-gray-300 hover:text-white transition">Hotels</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Apartments</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Villas</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Cabins</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Glamping</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Domes</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#99bdff] text-lg mb-4">Support</h4>
              <ul className="space-y-3 text-base">
                <li><a href="#" className="text-gray-300 hover:text-white transition">Help Centre</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Live Chat Support</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">FAQs</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#99bdff] text-lg mb-4">Get In Touch</h4>
              <div className="space-y-3 text-base">
                <p className="text-gray-300">+1 (800) 123-456</p>
                <p className="text-gray-300">support@tripto.com</p>
                <div className="flex gap-3 pt-2">
                  <a href="#" className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                    <span className="text-xs">f</span>
                  </a>
                  <a href="#" className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                    <span className="text-xs">in</span>
                  </a>
                  <a href="#" className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                    <span className="text-xs">yt</span>
                  </a>
                  <a href="#" className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                    <span className="text-xs">tw</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-b border-gray-700 mb-6"></div>

          {/* Copyright */}
          <div className="text-center text-xs text-gray-400">
            © 2025 Tripto. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
