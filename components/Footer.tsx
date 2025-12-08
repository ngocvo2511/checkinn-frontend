export default function Footer() {
  const exploreLinks = ['Trending Destinations', 'Summer Hotspots', 'Winter Getaways', 'Weekend Deals', 'Family-Friendly Stays'];
  const propertyTypes = ['Hotels', 'Apartments', 'Villas', 'Cabins', 'Glamping', 'Domes'];
  const supportLinks = ['Help Centre', 'Live Chat Support', 'FAQs', 'Contact Us'];
  const socialIcons = ['facebook', 'instagram', 'youtube', 'twitter'];

  return (
    <footer className="bg-[#121316] text-white pt-8">
      <div className="max-w-[1440px] mx-auto px-[104px]">
        <div className="flex justify-between mb-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold leading-6 text-[#99BDFF] mb-2">Explore</h3>
            {exploreLinks.map(link => (
              <a key={link} href="#" className="text-base font-normal leading-6 text-white hover:text-[#99BDFF] transition-colors">
                {link}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold leading-6 text-[#99BDFF] mb-2">Property Types</h3>
            {propertyTypes.map(type => (
              <a key={type} href="#" className="text-base font-normal leading-6 text-white hover:text-[#99BDFF] transition-colors">
                {type}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold leading-6 text-[#99BDFF] mb-2">Support</h3>
            {supportLinks.map(link => (
              <a key={link} href="#" className="text-base font-normal leading-6 text-white hover:text-[#99BDFF] transition-colors">
                {link}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold leading-6 text-[#99BDFF] mb-2">Get In Touch </h3>
            <p className="text-base font-normal leading-6 text-white"> +1 (800) 123‑456</p>
            <p className="text-base font-normal leading-6 text-white">support@tripto.com</p>
            <div className="flex gap-2 mt-2">
              {socialIcons.map(icon => (
                <a
                  key={icon}
                  href="#"
                  className="flex items-center justify-center w-6 h-6 rounded bg-[rgba(255,255,255,0.20)] backdrop-blur-[2px] hover:bg-[rgba(255,255,255,0.30)] transition-colors"
                >
                  {icon === 'facebook' && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.15998 8.56796V13.7141H6.81331V8.56796H5.33331V6.43898H6.81331V4.8194C6.81331 2.97776 7.93331 1.95898 9.65331 1.95898C10.4733 1.95898 11.3333 2.10266 11.3333 2.10266V3.91164H10.3866C9.45331 3.91164 9.15998 4.4798 9.15998 5.06103V6.43898H11.2466L10.9133 8.56796H9.15998Z" fill="white"/>
                    </svg>
                  )}
                  {icon === 'instagram' && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.96 5.41397C13.9133 4.47357 13.6933 3.63766 12.9933 2.95194C12.2933 2.26623 11.44 2.05072 10.48 2.005C9.48665 1.95276 6.51997 1.95276 5.53331 2.005C4.57331 2.05072 3.72665 2.26623 3.01998 2.95194C2.31331 3.63766 2.09997 4.47357 2.05331 5.41397C1.99997 6.38704 1.99997 9.29316 2.05331 10.2662C2.09997 11.2066 2.31998 12.0426 3.01998 12.7283C3.72665 13.414 4.57331 13.6295 5.53331 13.6752C6.52664 13.7275 9.49332 13.7275 10.48 13.6752C11.44 13.6295 12.2933 13.414 12.9933 12.7283C13.6933 12.0426 13.9133 11.2066 13.96 10.2662C14.0133 9.29316 14.0133 6.38704 13.96 5.42051V5.41397ZM7.99998 10.9389C6.25331 10.9389 4.83331 9.54786 4.83331 7.83684C4.83331 6.12582 6.25331 4.7348 7.99998 4.7348C9.74665 4.7348 11.1666 6.12582 11.1666 7.83684C11.1666 9.54786 9.74665 10.9389 7.99998 10.9389ZM11.68 4.89806C11.3133 4.89806 11.0133 4.60418 11.0133 4.245C11.0133 3.88582 11.3066 3.59194 11.68 3.59194C12.0466 3.59194 12.3466 3.88582 12.3466 4.245C12.3466 4.60418 12.0466 4.89806 11.68 4.89806ZM10.1666 7.83684C10.1666 9.00582 9.19332 9.95929 7.99998 9.95929C6.80665 9.95929 5.83331 9.00582 5.83331 7.83684C5.83331 6.66786 6.80665 5.71439 7.99998 5.71439C9.19332 5.71439 10.1666 6.66786 10.1666 7.83684Z" fill="white"/>
                    </svg>
                  )}
                  {icon === 'youtube' && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.3866 4.69534C14.2333 4.13371 13.78 3.68963 13.2066 3.53942C12.1666 3.26514 7.99998 3.26514 7.99998 3.26514C7.99998 3.26514 3.83331 3.26514 2.79331 3.53942C2.21998 3.68963 1.76666 4.13371 1.61332 4.69534C1.33332 5.71412 1.33331 7.84309 1.33331 7.84309C1.33331 7.84309 1.33332 9.97208 1.61332 10.9909C1.76666 11.5525 2.21998 11.977 2.79331 12.1272C3.83331 12.4015 7.99998 12.4015 7.99998 12.4015C7.99998 12.4015 12.1666 12.4015 13.2066 12.1272C13.78 11.977 14.2333 11.5525 14.3866 10.9909C14.6666 9.97208 14.6666 7.84309 14.6666 7.84309C14.6666 7.84309 14.6666 5.71412 14.3866 4.69534ZM6.66665 9.79575V5.87738L9.99998 7.83657L6.66665 9.79575Z" fill="white"/>
                    </svg>
                  )}
                  {icon === 'twitter' && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.2933 5.21814C13.3 5.32916 13.3 5.44671 13.3 5.56426C13.3 9.05161 10.5533 13.0679 5.52664 13.0679C3.97998 13.0679 2.53998 12.6369 1.33331 11.8859C1.55331 11.912 1.76665 11.9185 1.99332 11.9185C3.27332 11.9185 4.44665 11.5006 5.38665 10.7953C4.18665 10.7692 3.17998 10.0116 2.83331 8.96671C2.99998 8.99283 3.17332 9.00589 3.34665 9.00589C3.59332 9.00589 3.83998 8.97324 4.06665 8.91446C2.81332 8.6663 1.87331 7.60834 1.87331 6.32834V6.29569C2.23998 6.49161 2.65998 6.61569 3.10665 6.62875C2.37332 6.15201 1.88665 5.34875 1.88665 4.43446C1.88665 3.94466 2.01998 3.49406 2.25998 3.10222C3.60665 4.70222 5.62664 5.74712 7.89331 5.86467C7.85331 5.66875 7.82665 5.4663 7.82665 5.26385C7.82665 3.80752 9.04664 2.62549 10.56 2.62549C11.3466 2.62549 12.06 2.94548 12.5533 3.45487C13.1733 3.34385 13.76 3.12182 14.2866 2.82141C14.0866 3.43529 13.6533 3.9512 13.0866 4.2712C13.6333 4.21242 14.1667 4.06875 14.66 3.8663C14.2867 4.38875 13.82 4.85242 13.2866 5.2312L13.2933 5.21814Z" fill="white"/>
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#B5BAC2]">
          <div className="flex items-center justify-center h-16 py-4">
            <p className="text-xs font-normal leading-4 text-[#F1F2F3] text-center">
              © 2025 Tripto. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
