import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';
import PersonalDataForm from '@/components/PersonalDataForm';

export default function PersonalDataPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9F9F9]">
      <Header />
      
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8 px-[317px]">
          <div className="w-[120px] h-[120px] rounded-full bg-gray-300" style={{ backgroundImage: 'url(https://api.builder.io/api/v1/image/assets/TEMP/f55b53fee651ff9733d528589582445022ab24de?width=240)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <div className="flex flex-col gap-[5px]">
            <h1 className="text-[28px] font-semibold leading-[34px] text-[#454C58]">My Profile</h1>
            <p className="text-lg font-normal leading-6 text-[#8B94A4]">Real-time information and activities of your prototype.</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          <Sidebar activeItem="Personal Data" />
          
          <div className="flex-1">
            <PersonalDataForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
