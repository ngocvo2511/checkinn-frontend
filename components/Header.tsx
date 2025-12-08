import Logo from './Logo';

export default function Header() {
  return (
    <header className="flex items-center justify-center w-full h-24 px-[104px] py-4 bg-white shadow-[0_1px_15px_0_rgba(0,0,0,0.14)]">
      <div className="flex items-center justify-between w-full">
        <Logo />
        
        <div className="flex items-center gap-2 pr-12">
          <div className="flex items-center justify-center w-10 h-10">
            <div className="w-10 h-10 rounded-full bg-gray-300" style={{ backgroundImage: 'url(https://api.builder.io/api/v1/image/assets/TEMP/f55b53fee651ff9733d528589582445022ab24de?width=48)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          </div>
          
          <div className="flex items-center justify-center h-12 px-2 gap-2 rounded-xl">
            <div className="flex items-center justify-center w-6 h-6 rounded-full">
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/f55b53fee651ff9733d528589582445022ab24de?width=48" alt="flag" className="w-6 h-6" />
            </div>
            <span className="text-base font-medium leading-5 text-[#0057FF]">USD</span>
          </div>
          
          <button className="flex items-center justify-center w-12 h-12 p-3 rounded-full hover:bg-gray-100 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.2551 8.86147C20.871 3.90801 16.8776 0 12.004 0C7.13038 0 3.13705 3.90801 2.75292 8.86147C1.1924 9.16017 0 10.579 0 12.2799V13.5411C0 15.4661 1.5045 17.026 3.36112 17.026H4.76959C5.20974 17.026 5.56986 16.6526 5.56986 16.1962V9.62482C5.56986 9.16847 5.20974 8.79509 4.76959 8.79509H4.35345C4.76159 4.78752 8.03468 1.65945 11.996 1.65945C15.9573 1.65945 19.2384 4.78752 19.6385 8.79509H19.2224C18.7823 8.79509 18.4221 9.16847 18.4221 9.62482V16.1962C18.4221 16.6526 18.7823 17.026 19.2224 17.026H19.3585V17.2334C19.3585 18.6522 18.2461 19.8139 16.8696 19.8139H15.021C14.997 18.9675 14.3248 18.2872 13.5005 18.2872H10.1234C9.28309 18.2872 8.60287 18.9924 8.60287 19.8636V21.4235C8.60287 22.2947 9.28309 23 10.1234 23H13.5005C14.3248 23 14.997 22.3196 15.021 21.4733H16.8696C19.1264 21.4733 20.959 19.5732 20.959 17.2334V16.9928C22.6636 16.8185 24 15.3499 24 13.5411V12.2799C24 10.5707 22.8076 9.16017 21.2471 8.86147H21.2551Z" fill="#0057FF"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
