import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div className='md:mx-10'>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40'>
        {/*---------- left section----------- */}
        <div>
          <img className='mb-5 w-40' src={assets.logo} alt="" />
          <p className='w-full md:w-2/3 text-gray-600 leading-6' >A healthcare professional who is authorized to write prescriptions for medications or treatments patients</p>
        </div>
        {/*---------- center section----------- */}
        <div>
            <p className='text-xl font-medium mb-5'>COMPANY</p>
            <ul className='flex flex-col gap-2 text-gray-600'>
                <li>Home</li>
                <li>About Us</li>
                <li>Contact Us</li>
                <li>Privacy policy</li>
            </ul>
        </div>

        {/*---------- right section----------- */}
        <div>
            <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-2 text-gray-600'>
                <li>+11 234-456-2346</li>
                <li>abcdefghij@gmil.com</li>
            </ul>
        </div>
      </div>
      
        {/*----------copy right text--------*/}
        <div>
            <hr />
            <p className='py-5 text-sm text-center'>CopyRight 2025@ Prescripto-All Rights Reserved.</p>
      </div>

    </div>
  )
}

export default Footer
