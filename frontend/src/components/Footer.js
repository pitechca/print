import React from 'react';
import { Link } from 'react-router-dom';
import { InstagramIcon, FacebookIcon, PhoneIcon, MailIcon, LinkedinIcon} from 'lucide-react'; 


const Footer = () => {
  const phoneNumber = "+1 (604) 834-8118";

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
        <div>
          <h4 className="text-xl font-bold mb-4">Bag & Box</h4>
          <p className="text-gray-400">Professional custom packaging solutions for businesses across North America.</p>
          {/* <img src='../images/logo.png' style={{height:150+"px"}}/> */}
        </div>
        <div>
          <h4 className="text-xl font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-blue-500">Home</Link></li>
            <li><Link to="/aboutUs" className="hover:text-blue-500">About Us</Link></li>
            <li><Link to="/products" className="hover:text-blue-500">Products</Link></li>
            <li><Link to="/contactUs" className="hover:text-blue-500">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-4">Contact</h4>
          <p>☏ Phone: {phoneNumber}
            {/* {<PhoneIcon className="mr-2 h-5 w-5"/>} */}
           </p>
          <p style={{marginTop:7+'px'}}>
            ✉ Email: support@bagbox.ca
            {/* {<MailIcon className="mr-2 h-5 w-5"/>}  */}
             </p>
          <p style={{marginTop:7+'px'}}>
           ⚲ Address: 102-1127 14th St W,<br/> North Vancouver, BC, V7P 1J9

          </p>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-4">Follow Us</h4>
          <div className="flex space-x-4">
            <a href="https://www.instagram.com/bagbox.ca" className="text-gray-400 hover:text-white">{<InstagramIcon className="mr-2 h-5 w-5"/>}</a>
            <a href="#" className="text-gray-400 hover:text-white">{<FacebookIcon className="mr-2 h-5 w-5"/>}</a>
            <a href="#" className="text-gray-400 hover:text-white">{<LinkedinIcon className="mr-2 h-5 w-5"/>}</a>
          </div>
        </div>
      </div>
      <div className="text-center mt-8 border-t border-gray-800 pt-4">
        <p>&copy; 2025 Bag & Box. All Rights Reserved.<br/>
        Design & Development By <a href='https://pitech.ca' target='new'>PiTech.ca</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;