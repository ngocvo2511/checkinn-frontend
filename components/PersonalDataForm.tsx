'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import UserSidebar from './UserSidebar';
import { authApi } from '@/lib/api/auth';
import { loyaltyApi } from '@/lib/api/booking';
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
    address: '',
    loyaltyPoints: {
      totalPoints: 0,
      usedPoints: 0,
      availablePoints: 0
    }
  });
  const [originalData, setOriginalData] = useState(formData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'security'>('account');
  
  // Password form states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const genderOptions = ['Nam', 'Nữ', 'Khác'];
  const countryOptions = [
    'Việt Nam',
    'Hoa Kỳ',
    'Vương quốc Anh',
    'Canada',
    'Úc',
    'Pháp',
    'Đức',
    'Nhật Bản',
    'Trung Quốc',
    'Ấn Độ',
    'Brazil',
    'Mexico',
    'Hàn Quốc',
    'Singapore',
    'Thái Lan',
    'Indonesia',
    'Malaysia',
    'Philippines'
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Không tìm thấy token xác thực');
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
        throw new Error('Không thể lấy thông tin người dùng');
      }

      const data = await response.json();
      
      // Fetch loyalty points
      let loyaltyPoints = {
        totalPoints: 0,
        usedPoints: 0,
        availablePoints: 0
      };
      
      try {
        if (data.id) {
          const pointsData = await loyaltyApi.getUserPoints(data.id);
          loyaltyPoints = pointsData;
        }
      } catch (pointsErr) {
        console.error('Error fetching loyalty points:', pointsErr);
        // Continue without loyalty points data
      }
      
      const newData = {
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        countryCode: data.countryCode || '+84',
        birthday: data.birthday || '',
        address: data.address || '',
        gender: data.gender || '',
        country: data.country || '',
        loyaltyPoints: loyaltyPoints
      };
      setFormData(newData);
      setOriginalData(newData);
      setError('');
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Không thể tải thông tin người dùng');
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
        setError('Không tìm thấy token xác thực');
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
        throw new Error(errorData.message || 'Không thể lưu thay đổi');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setError('');
    } catch (err) {
      console.error('Error saving user data:', err);
      setError(err instanceof Error ? err.message : 'Không thể lưu thay đổi');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate password fields
    const errors = {
      currentPassword: !passwordData.currentPassword ? 'Vui lòng nhập mật khẩu hiện tại' : '',
      newPassword: !passwordData.newPassword ? 'Vui lòng nhập mật khẩu mới' : 
        passwordData.newPassword.length < 6 ? 'Mật khẩu phải có ít nhất 6 ký tự' : '',
      confirmPassword: !passwordData.confirmPassword ? 'Vui lòng xác nhận mật khẩu mới' : 
        passwordData.confirmPassword !== passwordData.newPassword ? 'Mật khẩu xác nhận không khớp' : ''
    };
    
    setPasswordErrors(errors);
    
    if (errors.currentPassword || errors.newPassword || errors.confirmPassword) {
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordSuccess(false);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Không tìm thấy token xác thực');
        return;
      }

      await authApi.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        token
      );

      setPasswordSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="bg-[#f9f9f9] flex flex-col">
      <div className="flex-1 max-w-[1440px] mx-auto w-full px-[104px] py-8">
        <div className="flex gap-6">
          <UserSidebar fullName={formData.fullName} activeMenu="profile" onLogout={() => {}} />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Edit Photo Section */}
            <div className="bg-white rounded-2xl overflow-hidden mb-6">
              <div className="h-[180px] flex items-start justify-between p-6 min-w-[920px]">
                <div className="flex items-start gap-8">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex-shrink-0 flex items-center justify-center text-white font-semibold text-5xl">
                    {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'E'}
                  </div>
                  <div>
                    <h1 className="text-4xl font-semibold text-[#454c58] mb-2">Hồ sơ của tôi</h1>
                    <p className="text-lg text-[#8b94a4]">Thông tin và hoạt động cá nhân của bạn.</p>
                    <div className="flex gap-8 mt-4">
                      <div className="bg-blue-50 px-4 py-2 rounded-lg">
                        <p className="text-sm text-gray-600">Điểm tích luỹ</p>
                        <p className="text-2xl font-semibold text-[#0057FF]">{formData.loyaltyPoints?.availablePoints || 0}</p>
                      </div>
                      <div className="bg-green-50 px-4 py-2 rounded-lg">
                        <p className="text-sm text-gray-600">Tổng điểm đã tích</p>
                        <p className="text-2xl font-semibold text-green-600">{formData.loyaltyPoints?.totalPoints || 0}</p>
                      </div>
                      <div className="bg-orange-50 px-4 py-2 rounded-lg">
                        <p className="text-sm text-gray-600">Điểm đã sử dụng</p>
                        <p className="text-2xl font-semibold text-orange-600">{formData.loyaltyPoints?.usedPoints || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="flex items-center justify-center gap-2 h-14 px-4 rounded-xl text-[#B5BAC2] hover:bg-gray-50 transition-colors">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 7.29167H19.2967L18.7296 5.58724C18.3714 4.51391 17.3704 3.79167 16.2388 3.79167H11.7612C10.6296 3.79167 9.62855 4.51391 9.27039 5.58724L8.70329 7.29167H7C4.179 7.29167 2.625 8.84567 2.625 11.6667V21C2.625 23.821 4.179 25.375 7 25.375H21C23.821 25.375 25.375 23.821 25.375 21V11.6667C25.375 8.84567 23.821 7.29167 21 7.29167ZM23.625 21C23.625 22.8398 22.8398 23.625 21 23.625H7C5.16017 23.625 4.375 22.8398 4.375 21V11.6667C4.375 9.82684 5.16017 9.04167 7 9.04167H9.33333C9.71017 9.04167 10.0437 8.80024 10.1639 8.44324L10.9318 6.13896C11.0508 5.78079 11.3844 5.54053 11.7612 5.54053H16.2388C16.6156 5.54053 16.9492 5.78079 17.0682 6.13896L17.8361 8.4421C17.9563 8.7991 18.2898 9.04053 18.6667 9.04053H21C22.8398 9.04053 23.625 9.8257 23.625 11.6655V21ZM14 11.9583C11.5885 11.9583 9.625 13.9207 9.625 16.3333C9.625 18.746 11.5885 20.7083 14 20.7083C16.4115 20.7083 18.375 18.746 18.375 16.3333C18.375 13.9207 16.4115 11.9583 14 11.9583ZM14 18.9583C12.5533 18.9583 11.375 17.7812 11.375 16.3333C11.375 14.8855 12.5533 13.7083 14 13.7083C15.4467 13.7083 16.625 14.8855 16.625 16.3333C16.625 17.7812 15.4467 18.9583 14 18.9583ZM21.5833 12.25C21.5833 12.894 21.0607 13.4167 20.4167 13.4167C19.7727 13.4167 19.25 12.894 19.25 12.25C19.25 11.606 19.7727 11.0833 20.4167 11.0833C21.0607 11.0833 21.5833 11.606 21.5833 12.25Z" fill="#8B94A4"/>
                  </svg>
                  <span className="text-xl font-medium">Chỉnh sửa</span>
                </button>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white rounded-2xl mb-6 p-2 min-w-[920px]">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('account')}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium text-base transition-colors ${
                    activeTab === 'account'
                      ? 'bg-[#e8effc] text-[#0057ff]'
                      : 'text-[#383e48] hover:bg-gray-50'
                  }`}
                >
                  Thông tin tài khoản
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium text-base transition-colors ${
                    activeTab === 'security'
                      ? 'bg-[#e8effc] text-[#0057ff]'
                      : 'text-[#383e48] hover:bg-gray-50'
                  }`}
                >
                  Mật khẩu & Bảo mật
                </button>
              </div>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-2xl p-6 min-w-[920px]">
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0057FF]"></div>
                  <span className="ml-2 text-[#454C58]">Đang tải hồ sơ của bạn...</span>
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
                  Cập nhật hồ sơ thành công!
                </div>
              )}

              {/* Form Content */}
              {!loading && activeTab === 'account' && (
              <>
              {/* First Row: Full Name */}
              <div className="flex justify-between gap-6 mb-10">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-lg font-medium text-[#454C58]">Họ và tên</label>
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
            <label className="text-lg font-medium text-[#454C58]">Địa chỉ Email</label>
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
            <label className="text-lg font-medium text-[#454C58]">Số điện thoại</label>
            <div className="flex items-center gap-2 h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white">
              <div className="flex items-center gap-2">
                
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
            <label className="text-lg font-medium text-[#454C58]">Giới tính</label>
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
                <span className="flex-1 text-base text-[#383E48]">{formData.gender || 'Chọn giới tính'}</span>
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
            <label className="text-lg font-medium text-[#454C58]">Ngày sinh</label>
            <div className="relative flex items-center h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white hover:border-[#0057FF] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 3.75H16.75V3C16.75 2.586 16.414 2.25 16 2.25C15.586 2.25 15.25 2.586 15.25 3V3.75H8.75V3C8.75 2.586 8.414 2.25 8 2.25C7.586 2.25 7.25 2.586 7.25 3V3.75H6C3.582 3.75 2.25 5.082 2.25 7.5V18C2.25 20.418 3.582 21.75 6 21.75H18C20.418 21.75 21.75 20.418 21.75 18V7.5C21.75 5.082 20.418 3.75 18 3.75ZM6 5.25H7.25V6C7.25 6.414 7.586 6.75 8 6.75C8.414 6.75 8.75 6.414 8.75 6V5.25H15.25V6C15.25 6.414 15.586 6.75 16 6.75C16.414 6.75 16.75 6.414 16.75 6V5.25H18C19.577 5.25 20.25 5.923 20.25 7.5V8.25H3.75V7.5C3.75 5.923 4.423 5.25 6 5.25ZM18 20.25H6C4.423 20.25 3.75 19.577 3.75 18V9.75H20.25V18C20.25 19.577 19.577 20.25 18 20.25ZM9.02002 13C9.02002 13.552 8.57302 14 8.02002 14C7.46802 14 7.01489 13.552 7.01489 13C7.01489 12.448 7.45801 12 8.01001 12H8.02002C8.57202 12 9.02002 12.448 9.02002 13ZM13.02 13C13.02 13.552 12.573 14 12.02 14C11.468 14 11.0149 13.552 11.0149 13C11.0149 12.448 11.458 12 12.01 12H12.02C12.572 12 13.02 12.448 13.02 13ZM17.02 13C17.02 13.552 16.573 14 16.02 14C15.468 14 15.0149 13.552 15.0149 13C15.0149 12.448 15.458 12 16.01 12H16.02C16.572 12 17.02 12.448 17.02 13ZM9.02002 17C9.02002 17.552 8.57302 18 8.02002 18C7.46802 18 7.01489 17.552 7.01489 17C7.01489 16.448 7.45801 16 8.01001 16H8.02002C8.57202 16 9.02002 16.448 9.02002 17ZM13.02 17C13.02 17.552 12.573 18 12.02 18C11.468 18 11.0149 17.552 11.0149 17C11.0149 16.448 11.458 16 12.01 16H12.02C12.572 16 13.02 16.448 13.02 17ZM17.02 17C17.02 17.552 16.573 18 16.02 18C15.468 18 15.0149 17.552 15.0149 17C15.0149 16.448 15.458 16 16.01 16H16.02C16.572 16 17.02 16.448 17.02 17Z" fill="#383E48"/>
              </svg>
              <DatePicker
                selected={formData.birthday ? new Date(formData.birthday) : null}
                onChange={(date) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const formatted = `${year}-${month}-${day}`;
                    setFormData({...formData, birthday: formatted});
                  }
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText="Chọn ngày"
                className="flex-1 ml-2 text-base text-[#383E48] outline-none bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 w-[480px]">
            <label className="text-lg font-medium text-[#454C58]">Quốc gia</label>
            <div 
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="relative flex items-center justify-between h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white cursor-pointer hover:border-[#0057FF] transition-colors"
            >
              <div className="flex items-center gap-1 flex-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1.25C6.072 1.25 1.25 6.073 1.25 12C1.25 17.927 6.072 22.75 12 22.75C17.928 22.75 22.75 17.927 22.75 12C22.75 6.073 17.928 1.25 12 1.25ZM21.212 11.25H17.162C17.031 8.507 16.187 5.71201 14.727 3.16101C18.27 4.25701 20.903 7.43 21.212 11.25ZM12.73 2.78699C14.486 5.39799 15.509 8.36 15.662 11.25H8.33801C8.49001 8.36 9.51399 5.39799 11.27 2.78699C11.512 2.76799 11.754 2.75 12 2.75C12.246 2.75 12.489 2.76799 12.73 2.78699ZM9.27301 3.16101C7.81301 5.71201 6.96901 8.507 6.83801 11.25H2.78799C3.09699 7.43 5.73001 4.25701 9.27301 3.16101ZM2.78799 12.75H6.83801C6.96901 15.493 7.81301 18.288 9.27301 20.839C5.73001 19.743 3.09699 16.57 2.78799 12.75ZM11.27 21.213C9.51399 18.602 8.49101 15.64 8.33801 12.75H15.662C15.51 15.64 14.486 18.602 12.73 21.213C12.488 21.232 12.246 21.25 12 21.25C11.754 21.25 11.511 21.232 11.27 21.213ZM14.727 20.839C16.187 18.288 17.031 15.493 17.162 12.75H21.212C20.903 16.57 18.27 19.743 14.727 20.839Z" fill="#383E48"/>
                </svg>
                <span className="flex-1 text-base text-[#383E48]">{formData.country || 'Chọn quốc gia'}</span>
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
            <label className="text-lg font-medium text-[#454C58]">Địa chỉ</label>
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
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center justify-center h-12 px-4 min-w-[154px] rounded-xl border border-[#0057FF] bg-white text-lg font-medium text-[#0057FF] hover:bg-[#E8EFFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
              </>
              )}

              {/* Password & Security Form */}
              {!loading && activeTab === 'security' && (
              <>
                {/* Success Message */}
                {passwordSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                    Đổi mật khẩu thành công!
                  </div>
                )}

                {/* Password Change Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-[#0F172A] mb-4">Đổi mật khẩu</h3>
                    <p className="text-sm text-[#6B7280] mb-6">Cập nhật mật khẩu của bạn để bảo mật tài khoản</p>
                  </div>

                  {/* Current Password */}
                  <div className="flex justify-between gap-6 mb-10">
                    <div className="flex flex-col gap-2 w-full">
                    <label className="text-lg font-medium text-[#454C58]">Mật khẩu hiện tại<span className="text-red-600">*</span></label>
                    <div className="flex items-center gap-1 h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 8.5H17V6.5C17 3.74 14.76 1.5 12 1.5C9.24 1.5 7 3.74 7 6.5V8.5H6C4.34 8.5 3 9.84 3 11.5V19.5C3 21.16 4.34 22.5 6 22.5H18C19.66 22.5 21 21.16 21 19.5V11.5C21 9.84 19.66 8.5 18 8.5ZM8.5 6.5C8.5 4.57 10.07 3 12 3C13.93 3 15.5 4.57 15.5 6.5V8.5H8.5V6.5ZM19.5 19.5C19.5 20.33 18.83 21 18 21H6C5.17 21 4.5 20.33 4.5 19.5V11.5C4.5 10.67 5.17 10 6 10H18C18.83 10 19.5 10.67 19.5 11.5V19.5ZM12 13C11.17 13 10.5 13.67 10.5 14.5C10.5 15.06 10.8 15.54 11.25 15.8V17.25C11.25 17.66 11.59 18 12 18C12.41 18 12.75 17.66 12.75 17.25V15.8C13.2 15.54 13.5 15.06 13.5 14.5C13.5 13.67 12.83 13 12 13Z" fill="#383E48"/>
                      </svg>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        onBlur={() => {
                          if (!passwordData.currentPassword) {
                            setPasswordErrors({...passwordErrors, currentPassword: 'Vui lòng nhập mật khẩu hiện tại'});
                          } else {
                            setPasswordErrors({...passwordErrors, currentPassword: ''});
                          }
                        }}
                        className="flex-1 text-base text-[#383E48] outline-none"
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-red-600">{passwordErrors.currentPassword}</p>
                    )}
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="flex justify-between gap-6 mb-10">
                    <div className="flex flex-col gap-2 w-full">
                    <label className="text-lg font-medium text-[#454C58]">Mật khẩu mới<span className="text-red-600">*</span></label>
                    <div className="flex items-center gap-1 h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 8.5H17V6.5C17 3.74 14.76 1.5 12 1.5C9.24 1.5 7 3.74 7 6.5V8.5H6C4.34 8.5 3 9.84 3 11.5V19.5C3 21.16 4.34 22.5 6 22.5H18C19.66 22.5 21 21.16 21 19.5V11.5C21 9.84 19.66 8.5 18 8.5ZM8.5 6.5C8.5 4.57 10.07 3 12 3C13.93 3 15.5 4.57 15.5 6.5V8.5H8.5V6.5ZM19.5 19.5C19.5 20.33 18.83 21 18 21H6C5.17 21 4.5 20.33 4.5 19.5V11.5C4.5 10.67 5.17 10 6 10H18C18.83 10 19.5 10.67 19.5 11.5V19.5ZM12 13C11.17 13 10.5 13.67 10.5 14.5C10.5 15.06 10.8 15.54 11.25 15.8V17.25C11.25 17.66 11.59 18 12 18C12.41 18 12.75 17.66 12.75 17.25V15.8C13.2 15.54 13.5 15.06 13.5 14.5C13.5 13.67 12.83 13 12 13Z" fill="#383E48"/>
                      </svg>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        onBlur={() => {
                          if (!passwordData.newPassword) {
                            setPasswordErrors({...passwordErrors, newPassword: 'Vui lòng nhập mật khẩu mới'});
                          } else if (passwordData.newPassword.length < 6) {
                            setPasswordErrors({...passwordErrors, newPassword: 'Mật khẩu phải có ít nhất 6 ký tự'});
                          } else {
                            setPasswordErrors({...passwordErrors, newPassword: ''});
                          }
                        }}
                        className="flex-1 text-base text-[#383E48] outline-none"
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      />
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-red-600">{passwordErrors.newPassword}</p>
                    )}
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="flex justify-between gap-6 mb-10">
                    <div className="flex flex-col gap-2 w-full">
                    <label className="text-lg font-medium text-[#454C58]">Xác nhận mật khẩu mới<span className="text-red-600">*</span></label>
                    <div className="flex items-center gap-1 h-14 px-4 border border-[#DDDFE3] rounded-xl bg-white">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 8.5H17V6.5C17 3.74 14.76 1.5 12 1.5C9.24 1.5 7 3.74 7 6.5V8.5H6C4.34 8.5 3 9.84 3 11.5V19.5C3 21.16 4.34 22.5 6 22.5H18C19.66 22.5 21 21.16 21 19.5V11.5C21 9.84 19.66 8.5 18 8.5ZM8.5 6.5C8.5 4.57 10.07 3 12 3C13.93 3 15.5 4.57 15.5 6.5V8.5H8.5V6.5ZM19.5 19.5C19.5 20.33 18.83 21 18 21H6C5.17 21 4.5 20.33 4.5 19.5V11.5C4.5 10.67 5.17 10 6 10H18C18.83 10 19.5 10.67 19.5 11.5V19.5ZM12 13C11.17 13 10.5 13.67 10.5 14.5C10.5 15.06 10.8 15.54 11.25 15.8V17.25C11.25 17.66 11.59 18 12 18C12.41 18 12.75 17.66 12.75 17.25V15.8C13.2 15.54 13.5 15.06 13.5 14.5C13.5 13.67 12.83 13 12 13Z" fill="#383E48"/>
                      </svg>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        onBlur={() => {
                          if (!passwordData.confirmPassword) {
                            setPasswordErrors({...passwordErrors, confirmPassword: 'Vui lòng xác nhận mật khẩu mới'});
                          } else if (passwordData.confirmPassword !== passwordData.newPassword) {
                            setPasswordErrors({...passwordErrors, confirmPassword: 'Mật khẩu xác nhận không khớp'});
                          } else {
                            setPasswordErrors({...passwordErrors, confirmPassword: ''});
                          }
                        }}
                        className="flex-1 text-base text-[#383E48] outline-none"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                    )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-6 mt-16 pt-6 border-t border-gray-200">
                    <button 
                      onClick={() => {
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      disabled={isChangingPassword}
                      className="flex items-center justify-center h-12 px-4 min-w-[154px] rounded-xl border border-[#2B3037] bg-white text-lg font-medium text-[#2B3037] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      Hủy bỏ
                    </button>
                    <button 
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword}
                      className="flex items-center justify-center h-12 px-4 min-w-[154px] rounded-xl border border-[#0057FF] bg-white text-lg font-medium text-[#0057FF] hover:bg-[#E8EFFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {isChangingPassword ? 'Đang lưu...' : 'Đổi mật khẩu'}
                    </button>
                  </div>
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
