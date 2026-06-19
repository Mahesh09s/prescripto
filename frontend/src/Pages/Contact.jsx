import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {



  return (
    <div>
      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p>CONTACT <span className='text-gray-700'>US</span></p>
      </div>
      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-sm'>
        <img className='w-full md:max-w-[360px]'src={assets.contact_image} alt="" />
        <div className='flex flex-col justify-centeritems-start gap-6'>
          <p className='font-semibold text-lg text-gray-600'>OUR OFFICE</p>
          <p className='text-gray-500'>1-24 willims station <br/>suite 350,washington,USA</p>
          <p className='text-gray-500'>tel:(415) 555-01234<br />Email: glahari123@gmail.com</p>
          
          <p className='font-semibold text-;g text-gray-600'>Careers at PRESCRIPTO</p>
          <p className='text-gray-500'>Learn more about our teams and job openings</p>
          <button className='border border-black px-8 py-4 text:sm hover:bg-black hover:text-white transistion-all duration-500'>Explore Jobs</button>
                  </div>
      </div>
    </div>
  )
}

export default Contact
