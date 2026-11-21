import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/kaamsetu_db.json');

export const generateSeedData = async () => {
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('kaamsetu123', salt);

  // 1. ADMIN USER
  const adminUser = {
    _id: 'usr_admin_01',
    name: 'KAAMSETU Admin (Vigilance & Ops)',
    phone: '9876543210',
    email: 'admin@kaamsetu.in',
    password: defaultPasswordHash,
    role: 'admin',
    verificationStatus: 'Identity Verified',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isActive: true,
    createdAt: new Date('2026-01-10').toISOString()
  };

  // 2. PRIMARY DEMO WORKER: Ramesh Kumar
  const rameshUser = {
    _id: 'usr_ramesh_kumar',
    name: 'Ramesh Kumar',
    phone: '9811002233',
    email: 'ramesh.kumar@gmail.com',
    password: defaultPasswordHash,
    role: 'worker',
    verificationStatus: 'Identity Verified',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isActive: true,
    createdAt: new Date('2026-02-01').toISOString()
  };

  const rameshWorkerProfile = {
    _id: 'wp_ramesh_kumar',
    userId: 'usr_ramesh_kumar',
    fullName: 'Ramesh Kumar',
    phone: '9811002233',
    email: 'ramesh.kumar@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    preferredLanguage: 'Hindi',
    workerId: 'KS-W-6201',
    primarySkill: 'Electrician',
    experienceLevel: '3–5 years',
    experienceYearsNum: 3,
    skills: [
      {
        skillName: 'Electrician',
        category: 'Electrical',
        experienceYears: 3,
        verificationStatus: 'Employer Confirmed',
        endorsementsCount: 8,
        evidenceUrl: 'https://kaamsetu.in/docs/ramesh_trade_cert.pdf'
      },
      {
        skillName: 'Wireman',
        category: 'Electrical',
        experienceYears: 3,
        verificationStatus: 'Evidence Submitted',
        endorsementsCount: 4,
        evidenceUrl: 'https://kaamsetu.in/docs/wireman_license.pdf'
      },
      {
        skillName: 'Appliance Repair',
        category: 'Electrical',
        experienceYears: 2,
        verificationStatus: 'Self-declared',
        endorsementsCount: 2,
        evidenceUrl: ''
      }
    ],
    location: {
      state: 'Uttar Pradesh',
      city: 'Noida',
      area: 'Sector 62',
      pincode: '201309',
      coordinates: { lat: 28.6280, lng: 77.3649 }
    },
    preferences: {
      expectedDailyWage: 800,
      expectedMonthlyWage: 22000,
      jobType: 'Daily Wage',
      availableDates: 'Immediate',
      maxDistanceKm: 8
    },
    skillPassport: {
      passportId: 'KSP-NOIDA-7842',
      qrCodeString: 'https://kaamsetu.in/passport/KSP-NOIDA-7842',
      verifiedSkillsCount: 2,
      trustScore: 94,
      completedJobsCount: 14,
      rating: 4.9,
      reviewsCount: 11,
      badges: ['Top Rated Artisan', 'Identity Verified', 'Zero Cancellation Record', 'Speedy Responder'],
      issueDate: new Date('2026-02-10').toISOString()
    },
    bio: 'Experienced licensed residential and commercial wireman. Expert in MCB installation, 3-phase wiring, inverter setup, and emergency fault isolation.',
    isProfileComplete: true
  };

  // 3. PRIMARY DEMO EMPLOYER: Sharma Electrical Services
  const sharmaEmployerUser = {
    _id: 'usr_sharma_services',
    name: 'Sunil Sharma',
    phone: '9811445566',
    email: 'contact@sharmaelectricals.in',
    password: defaultPasswordHash,
    role: 'employer',
    verificationStatus: 'Identity Verified',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    isActive: true,
    createdAt: new Date('2026-01-15').toISOString()
  };

  const sharmaEmployerProfile = {
    _id: 'ep_sharma_services',
    userId: 'usr_sharma_services',
    companyName: 'Sharma Electrical Services',
    contactPerson: 'Sunil Sharma (Proprietor)',
    phone: '9811445566',
    email: 'contact@sharmaelectricals.in',
    industry: 'Electrical Contracting & Maintenance',
    businessType: 'Small Business / Shop',
    verificationStatus: 'Identity Verified',
    gstOrGovtId: '09AAACS1429B1Z8 (GST Verified)',
    address: {
      state: 'Uttar Pradesh',
      city: 'Noida',
      area: 'Sector 63',
      pincode: '201301',
      coordinates: { lat: 28.6271, lng: 77.3820 }
    },
    rating: 4.9,
    jobsPostedCount: 9,
    activeJobsCount: 2,
    hiredWorkersCount: 18,
    aboutCompany: 'Licensed electrical contractors executing commercial building fitouts, factory panel maintenance, and residential rewiring throughout Noida & Indirapuram.'
  };

  // 4. MORE EMPLOYERS (Total 5)
  const additionalEmployers = [
    {
      user: {
        _id: 'usr_emp_verma',
        name: 'Rajeev Verma',
        phone: '9811883344',
        email: 'verma.builders@gmail.com',
        password: defaultPasswordHash,
        role: 'employer',
        verificationStatus: 'Identity Verified',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        isActive: true
      },
      profile: {
        _id: 'ep_verma_builders',
        userId: 'usr_emp_verma',
        companyName: 'Verma Infrastructure & Masonry',
        contactPerson: 'Rajeev Verma',
        phone: '9811883344',
        email: 'verma.builders@gmail.com',
        industry: 'Construction & Civil Works',
        businessType: 'Individual Contractor',
        verificationStatus: 'Identity Verified',
        gstOrGovtId: '09AABCV2219K1ZA',
        address: {
          state: 'Uttar Pradesh',
          city: 'Indirapuram',
          area: 'Vaibhav Khand',
          pincode: '201014',
          coordinates: { lat: 28.6415, lng: 77.3712 }
        },
        rating: 4.8,
        jobsPostedCount: 6,
        activeJobsCount: 3,
        hiredWorkersCount: 24,
        aboutCompany: 'Residential tiling, plastering and masonry projects in Indirapuram & Vaishali.'
      }
    },
    {
      user: {
        _id: 'usr_emp_anand',
        name: 'Anand Singh',
        phone: '9871223344',
        email: 'anand.plumbing@gmail.com',
        password: defaultPasswordHash,
        role: 'employer',
        verificationStatus: 'Contact Verified',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        isActive: true
      },
      profile: {
        _id: 'ep_anand_plumbing',
        userId: 'usr_emp_anand',
        companyName: 'Apex Pipe & Sanitary Solutions',
        contactPerson: 'Anand Singh',
        phone: '9871223344',
        email: 'anand.plumbing@gmail.com',
        industry: 'Sanitary & Plumbing Services',
        businessType: 'Small Business / Shop',
        verificationStatus: 'Contact Verified',
        gstOrGovtId: '09BCPSA7721L1Z2',
        address: {
          state: 'Uttar Pradesh',
          city: 'Ghaziabad',
          area: 'Raj Nagar Extension',
          pincode: '201017',
          coordinates: { lat: 28.6947, lng: 77.4376 }
        },
        rating: 4.7,
        jobsPostedCount: 5,
        activeJobsCount: 2,
        hiredWorkersCount: 12,
        aboutCompany: 'Commercial high-rise pipeline fitting, CPVC plumbing, pump stations.'
      }
    },
    {
      user: {
        _id: 'usr_emp_gupta',
        name: 'Vikas Gupta',
        phone: '9891004455',
        email: 'vikas.decor@gmail.com',
        password: defaultPasswordHash,
        role: 'employer',
        verificationStatus: 'Identity Verified',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        isActive: true
      },
      profile: {
        _id: 'ep_gupta_decor',
        userId: 'usr_emp_gupta',
        companyName: 'Gupta Home Decor & Woodcraft',
        contactPerson: 'Vikas Gupta',
        phone: '9891004455',
        email: 'vikas.decor@gmail.com',
        industry: 'Woodworking & Interiors',
        businessType: 'Small Business / Shop',
        verificationStatus: 'Identity Verified',
        gstOrGovtId: '09AAAFG8831P1ZP',
        address: {
          state: 'Uttar Pradesh',
          city: 'Noida',
          area: 'Sector 18',
          pincode: '201301',
          coordinates: { lat: 28.5708, lng: 77.3271 }
        },
        rating: 4.9,
        jobsPostedCount: 8,
        activeJobsCount: 2,
        hiredWorkersCount: 15,
        aboutCompany: 'Modular kitchens, wooden wardrobe installations, and luxury finishes.'
      }
    },
    {
      user: {
        _id: 'usr_emp_mehta',
        name: 'Pooja Mehta',
        phone: '9810998877',
        email: 'pooja.cleaners@gmail.com',
        password: defaultPasswordHash,
        role: 'employer',
        verificationStatus: 'Contact Verified',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        isActive: true
      },
      profile: {
        _id: 'ep_clean_express',
        userId: 'usr_emp_mehta',
        companyName: 'Express Facility & Deep Cleaning',
        contactPerson: 'Pooja Mehta',
        phone: '9810998877',
        email: 'pooja.cleaners@gmail.com',
        industry: 'Facility Management & Sanitation',
        businessType: 'Small Business / Shop',
        verificationStatus: 'Contact Verified',
        gstOrGovtId: '09AABCE3321D1ZN',
        address: {
          state: 'Uttar Pradesh',
          city: 'Vaishali',
          area: 'Sector 4',
          pincode: '201010',
          coordinates: { lat: 28.6472, lng: 77.3398 }
        },
        rating: 4.6,
        jobsPostedCount: 7,
        activeJobsCount: 3,
        hiredWorkersCount: 20,
        aboutCompany: 'Corporate office sanitization, post-construction cleaning, and residential deep scrub.'
      }
    }
  ];

  // 5. 14 MORE WORKERS (Total 15)
  const additionalWorkersData = [
    {
      name: 'Mohammad Imran',
      phone: '9811223341',
      skill: 'Plumber',
      experience: '3–5 years',
      expNum: 4,
      area: 'Indirapuram',
      city: 'Ghaziabad',
      coords: { lat: 28.6415, lng: 77.3712 },
      wage: 850,
      rating: 4.8,
      jobs: 19,
      trust: 92,
      skillsList: [
        { skillName: 'Plumber', category: 'Plumbing', experienceYears: 4, verificationStatus: 'Employer Confirmed' },
        { skillName: 'Pipe Fitter', category: 'Plumbing', experienceYears: 3, verificationStatus: 'Evidence Submitted' }
      ]
    },
    {
      name: 'Suresh Prajapati',
      phone: '9811223342',
      skill: 'Carpenter',
      experience: '5+ years',
      expNum: 6,
      area: 'Sector 18',
      city: 'Noida',
      coords: { lat: 28.5708, lng: 77.3271 },
      wage: 950,
      rating: 4.9,
      jobs: 32,
      trust: 96,
      skillsList: [
        { skillName: 'Carpenter', category: 'Woodwork', experienceYears: 6, verificationStatus: 'Employer Confirmed' },
        { skillName: 'Furniture Maker', category: 'Woodwork', experienceYears: 5, verificationStatus: 'Employer Confirmed' }
      ]
    },
    {
      name: 'Santosh Yadav',
      phone: '9811223343',
      skill: 'Painter',
      experience: '1–3 years',
      expNum: 2,
      area: 'Sector 62',
      city: 'Noida',
      coords: { lat: 28.6280, lng: 77.3649 },
      wage: 750,
      rating: 4.7,
      jobs: 9,
      trust: 87,
      skillsList: [
        { skillName: 'Painter', category: 'Painting', experienceYears: 2, verificationStatus: 'Self-declared' },
        { skillName: 'Wall Putty Worker', category: 'Painting', experienceYears: 2, verificationStatus: 'Evidence Submitted' }
      ]
    },
    {
      name: 'Manoj Kumar Bind',
      phone: '9811223344',
      skill: 'Mason',
      experience: '5+ years',
      expNum: 7,
      area: 'Vaishali',
      city: 'Ghaziabad',
      coords: { lat: 28.6472, lng: 77.3398 },
      wage: 850,
      rating: 4.8,
      jobs: 27,
      trust: 95,
      skillsList: [
        { skillName: 'Mason', category: 'Construction', experienceYears: 7, verificationStatus: 'Employer Confirmed' },
        { skillName: 'Tile Layer', category: 'Construction', experienceYears: 5, verificationStatus: 'Employer Confirmed' }
      ]
    },
    {
      name: 'Amit Rawat',
      phone: '9811223345',
      skill: 'Mechanic',
      experience: '3–5 years',
      expNum: 4,
      area: 'Sector 63',
      city: 'Noida',
      coords: { lat: 28.6271, lng: 77.3820 },
      wage: 900,
      rating: 4.9,
      jobs: 16,
      trust: 91,
      skillsList: [
        { skillName: 'Mechanic', category: 'Automotive', experienceYears: 4, verificationStatus: 'Employer Confirmed' },
        { skillName: 'Two-Wheeler Technician', category: 'Automotive', experienceYears: 3, verificationStatus: 'Evidence Submitted' }
      ]
    },
    {
      name: 'Pappu Sharma',
      phone: '9811223346',
      skill: 'Electrician',
      experience: '1–3 years',
      expNum: 2,
      area: 'Greater Noida',
      city: 'Greater Noida',
      coords: { lat: 28.4744, lng: 77.5040 },
      wage: 750,
      rating: 4.6,
      jobs: 8,
      trust: 84,
      skillsList: [
        { skillName: 'Electrician', category: 'Electrical', experienceYears: 2, verificationStatus: 'Evidence Submitted' }
      ]
    },
    {
      name: 'Deepak Varma',
      phone: '9811223347',
      skill: 'Welder',
      experience: '3–5 years',
      expNum: 3,
      area: 'Sector 63',
      city: 'Noida',
      coords: { lat: 28.6271, lng: 77.3820 },
      wage: 850,
      rating: 4.7,
      jobs: 14,
      trust: 89,
      skillsList: [
        { skillName: 'Welder', category: 'Fabrication', experienceYears: 3, verificationStatus: 'Employer Confirmed' },
        { skillName: 'Iron Worker', category: 'Fabrication', experienceYears: 2, verificationStatus: 'Self-declared' }
      ]
    },
    {
      name: 'Sunita Devi',
      phone: '9811223348',
      skill: 'Cleaner',
      experience: '3–5 years',
      expNum: 4,
      area: 'Indirapuram',
      city: 'Ghaziabad',
      coords: { lat: 28.6415, lng: 77.3712 },
      wage: 650,
      rating: 4.9,
      jobs: 38,
      trust: 97,
      skillsList: [
        { skillName: 'Cleaner', category: 'Sanitation', experienceYears: 4, verificationStatus: 'Employer Confirmed' },
        { skillName: 'Deep Cleaning Specialist', category: 'Sanitation', experienceYears: 3, verificationStatus: 'Employer Confirmed' }
      ]
    },
    {
      name: 'Babu Lal',
      phone: '9811223349',
      skill: 'Painter',
      experience: '5+ years',
      expNum: 8,
      area: 'Sector 50',
      city: 'Noida',
      coords: { lat: 28.5818, lng: 77.3685 },
      wage: 850,
      rating: 4.8,
      jobs: 29,
      trust: 94,
      skillsList: [
        { skillName: 'Painter', category: 'Painting', experienceYears: 8, verificationStatus: 'Employer Confirmed' },
        { skillName: 'Texture Painter', category: 'Painting', experienceYears: 6, verificationStatus: 'Evidence Submitted' }
      ]
    },
    {
      name: 'Virender Singh',
      phone: '9811223350',
      skill: 'Delivery',
      experience: '1–3 years',
      expNum: 2,
      area: 'Sector 62',
      city: 'Noida',
      coords: { lat: 28.6280, lng: 77.3649 },
      wage: 700,
      rating: 4.6,
      jobs: 22,
      trust: 88,
      skillsList: [
        { skillName: 'Delivery', category: 'Logistics', experienceYears: 2, verificationStatus: 'Employer Confirmed' },
        { skillName: 'Two-Wheeler Driver', category: 'Logistics', experienceYears: 3, verificationStatus: 'Evidence Submitted' }
      ]
    },
    {
      name: 'Kallu Mian',
      phone: '9811223351',
      skill: 'Carpenter',
      experience: '3–5 years',
      expNum: 4,
      area: 'Vaishali',
      city: 'Ghaziabad',
      coords: { lat: 28.6472, lng: 77.3398 },
      wage: 900,
      rating: 4.7,
      jobs: 15,
      trust: 90,
      skillsList: [
        { skillName: 'Carpenter', category: 'Woodwork', experienceYears: 4, verificationStatus: 'Employer Confirmed' }
      ]
    },
    {
      name: 'Radhe Shyam',
      phone: '9811223352',
      skill: 'Electrician',
      experience: '5+ years',
      expNum: 6,
      area: 'Ghaziabad',
      city: 'Ghaziabad',
      coords: { lat: 28.6692, lng: 77.4538 },
      wage: 950,
      rating: 4.9,
      jobs: 41,
      trust: 98,
      skillsList: [
        { skillName: 'Electrician', category: 'Electrical', experienceYears: 6, verificationStatus: 'Employer Confirmed' },
        { skillName: 'Industrial Panel Wiring', category: 'Electrical', experienceYears: 5, verificationStatus: 'Employer Confirmed' }
      ]
    },
    {
      name: 'Rani Kumari',
      phone: '9811223353',
      skill: 'Cleaner',
      experience: '1–3 years',
      expNum: 2,
      area: 'Sector 62',
      city: 'Noida',
      coords: { lat: 28.6280, lng: 77.3649 },
      wage: 600,
      rating: 4.8,
      jobs: 14,
      trust: 89,
      skillsList: [
        { skillName: 'Cleaner', category: 'Sanitation', experienceYears: 2, verificationStatus: 'Self-declared' }
      ]
    },
    {
      name: 'Gopal Krishna',
      phone: '9811223354',
      skill: 'Mason',
      experience: '3–5 years',
      expNum: 3,
      area: 'Indirapuram',
      city: 'Ghaziabad',
      coords: { lat: 28.6415, lng: 77.3712 },
      wage: 800,
      rating: 4.7,
      jobs: 11,
      trust: 88,
      skillsList: [
        { skillName: 'Mason', category: 'Construction', experienceYears: 3, verificationStatus: 'Evidence Submitted' }
      ]
    }
  ];

  const workersUsers = [];
  const workersProfiles = [];

  additionalWorkersData.forEach((item, idx) => {
    const uId = `usr_worker_${idx + 2}`;
    const pId = `wp_worker_${idx + 2}`;
    workersUsers.push({
      _id: uId,
      name: item.name,
      phone: item.phone,
      email: `${item.name.toLowerCase().replace(/\s+/g, '.')}${idx}@kaamsetu.demo`,
      password: defaultPasswordHash,
      role: 'worker',
      verificationStatus: idx % 2 === 0 ? 'Identity Verified' : 'Contact Verified',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + (idx * 12345678) % 100000000}?w=150`,
      isActive: true,
      createdAt: new Date('2026-02-05').toISOString()
    });

    workersProfiles.push({
      _id: pId,
      userId: uId,
      fullName: item.name,
      phone: item.phone,
      email: `${item.name.toLowerCase().replace(/\s+/g, '.')}${idx}@kaamsetu.demo`,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + (idx * 12345678) % 100000000}?w=150`,
      preferredLanguage: 'Hindi',
      workerId: `KS-W-${7100 + idx}`,
      primarySkill: item.skill,
      experienceLevel: item.experience,
      experienceYearsNum: item.expNum,
      skills: item.skillsList,
      location: {
        state: 'Uttar Pradesh',
        city: item.city,
        area: item.area,
        pincode: '201301',
        coordinates: item.coords
      },
      preferences: {
        expectedDailyWage: item.wage,
        expectedMonthlyWage: item.wage * 26,
        jobType: 'Daily Wage',
        availableDates: 'Immediate',
        maxDistanceKm: 12
      },
      skillPassport: {
        passportId: `KSP-${item.area.toUpperCase().replace(/\s+/g, '-')}-${8000 + idx}`,
        qrCodeString: `https://kaamsetu.in/passport/KSP-${item.area.toUpperCase().replace(/\s+/g, '-')}-${8000 + idx}`,
        verifiedSkillsCount: item.skillsList.filter(s => s.verificationStatus === 'Employer Confirmed').length,
        trustScore: item.trust,
        completedJobsCount: item.jobs,
        rating: item.rating,
        reviewsCount: Math.round(item.jobs * 0.7),
        badges: ['Identity Verified', 'Local Verified Artisan'],
        issueDate: new Date('2026-02-12').toISOString()
      },
      bio: `Skilled professional with practical hands-on experience in ${item.skill}. Dedicated to punctual, clean execution.`,
      isProfileComplete: true
    });
  });

  // 6. 20 JOB LISTINGS (All with Fair Wage Transparency details)
  const jobListings = [
    // PRIMARY DEMO JOB: Sharma Electrical Services looking for Electrician in Sector 63
    {
      _id: 'job_sharma_elec_01',
      employerId: 'usr_sharma_services',
      employerProfileId: 'ep_sharma_services',
      companyName: 'Sharma Electrical Services',
      title: 'Commercial Electrician Required for Office Rewiring',
      category: 'Electrician',
      requiredSkills: ['Electrician', 'Wireman'],
      description: 'Need an experienced electrician for 3-phase wiring, DB dressing, and LED fixture installations in a newly leased corporate floor at H-Block Sector 63 Noida. Tools provided on site.',
      requiredExperience: '1–3 years',
      vacancies: 2,
      filledVacancies: 0,
      offeredWage: 900,
      wageType: 'daily',
      workDuration: '5 Days (extendable)',
      paymentFrequency: 'Daily at shift end',
      paymentTerms: 'Direct UPI or Cash disbursement at 6:00 PM daily. Zero deduction.',
      deductions: 'None. Full ₹900 paid in hand daily.',
      overtimeTerms: '₹140/hour overtime compensation for any work beyond 8 hours.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Plot H-14, Ground Floor, Sector 63',
        area: 'Sector 63',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        coordinates: { lat: 28.6271, lng: 77.3820 }
      },
      startDate: new Date('2026-02-22').toISOString(),
      endDate: new Date('2026-02-27').toISOString(),
      workTimings: '9:00 AM - 6:00 PM (1 hr lunch)',
      employerContact: {
        phone: '9811445566',
        personName: 'Sunil Sharma'
      },
      status: 'active',
      applicantsCount: 1,
      shortlistedCount: 0,
      isReported: false,
      reportCount: 0,
      createdAt: new Date('2026-02-20').toISOString()
    },
    // Job 2: Plumber in Indirapuram
    {
      _id: 'job_indirapuram_plumb_02',
      employerId: 'usr_emp_anand',
      employerProfileId: 'ep_anand_plumbing',
      companyName: 'Apex Pipe & Sanitary Solutions',
      title: 'Master Plumber for High-Rise Sanitary Fitouts',
      category: 'Plumber',
      requiredSkills: ['Plumber', 'Pipe Fitter'],
      description: 'Urgent requirement for sanitary pipe fitting, CPVC concealed lines, and bathroom fixture installation in Indirapuram society.',
      requiredExperience: '3–5 years',
      vacancies: 3,
      filledVacancies: 1,
      offeredWage: 900,
      wageType: 'daily',
      workDuration: '10 Days',
      paymentFrequency: 'Daily at shift end',
      paymentTerms: 'Same day payment via cash/UPI upon engineer checklist sign-off.',
      deductions: 'No deductions.',
      overtimeTerms: '₹120/hr overtime.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Tower B, Ahinsa Khand 2',
        area: 'Indirapuram',
        city: 'Ghaziabad',
        state: 'Uttar Pradesh',
        pincode: '201014',
        coordinates: { lat: 28.6415, lng: 77.3712 }
      },
      startDate: new Date('2026-02-23').toISOString(),
      workTimings: '9:30 AM - 6:30 PM',
      employerContact: { phone: '9871223344', personName: 'Anand Singh' },
      status: 'active',
      applicantsCount: 2,
      shortlistedCount: 1,
      isReported: false
    },
    // Job 3: Carpenter in Sector 18 Noida
    {
      _id: 'job_gupta_carpenter_03',
      employerId: 'usr_emp_gupta',
      employerProfileId: 'ep_gupta_decor',
      companyName: 'Gupta Home Decor & Woodcraft',
      title: 'Skilled Carpenter for Modular Kitchen Assembly',
      category: 'Carpenter',
      requiredSkills: ['Carpenter', 'Furniture Maker'],
      description: 'Assembling pre-laminated marine ply kitchen carcass, soft-close hinges, and hydraulic channels.',
      requiredExperience: '3–5 years',
      vacancies: 2,
      filledVacancies: 0,
      offeredWage: 1000,
      wageType: 'daily',
      workDuration: '7 Days',
      paymentFrequency: 'Weekly every Saturday',
      paymentTerms: 'Weekly bank transfer/UPI with advance tea allowance provided daily.',
      deductions: 'None.',
      overtimeTerms: '₹150/hr overtime.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Atta Market, Sector 18',
        area: 'Sector 18',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        coordinates: { lat: 28.5708, lng: 77.3271 }
      },
      startDate: new Date('2026-02-24').toISOString(),
      workTimings: '10:00 AM - 7:00 PM',
      employerContact: { phone: '9891004455', personName: 'Vikas Gupta' },
      status: 'active',
      applicantsCount: 1
    },
    // Job 4: Construction Mason in Vaishali
    {
      _id: 'job_verma_mason_04',
      employerId: 'usr_emp_verma',
      employerProfileId: 'ep_verma_builders',
      companyName: 'Verma Infrastructure & Masonry',
      title: 'Tile Layer & Brick Mason Required',
      category: 'Mason',
      requiredSkills: ['Mason', 'Tile Layer'],
      description: 'Laying 2x2 vitrified floor tiles and skirting for duplex renovation. Precision laser level provided.',
      requiredExperience: '3–5 years',
      vacancies: 4,
      filledVacancies: 1,
      offeredWage: 850,
      wageType: 'daily',
      workDuration: '14 Days',
      paymentFrequency: 'Weekly every Saturday',
      paymentTerms: 'Saturday cash payout with signed voucher.',
      deductions: 'None.',
      overtimeTerms: '₹100/hr overtime.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Sector 4, Near Metro Station',
        area: 'Vaishali',
        city: 'Ghaziabad',
        state: 'Uttar Pradesh',
        pincode: '201010',
        coordinates: { lat: 28.6472, lng: 77.3398 }
      },
      startDate: new Date('2026-02-22').toISOString(),
      workTimings: '8:30 AM - 5:30 PM',
      employerContact: { phone: '9811883344', personName: 'Rajeev Verma' },
      status: 'active',
      applicantsCount: 3
    },
    // Job 5: Painter in Sector 62
    {
      _id: 'job_painter_sec62_05',
      employerId: 'usr_sharma_services',
      employerProfileId: 'ep_sharma_services',
      companyName: 'Sharma Electrical Services',
      title: 'Interior Wall Painter & Putty Specialist',
      category: 'Painter',
      requiredSkills: ['Painter', 'Wall Putty Worker'],
      description: 'Applying double coat acrylic emulsion and Birla putty smoothing for newly partitioned office cabins in Sector 62.',
      requiredExperience: '1–3 years',
      vacancies: 2,
      filledVacancies: 0,
      offeredWage: 800,
      wageType: 'daily',
      workDuration: '4 Days',
      paymentFrequency: 'Daily at shift end',
      paymentTerms: 'Daily UPI transfer right at site exit.',
      deductions: 'None.',
      overtimeTerms: '₹110/hr overtime.',
      wageTransparencyWarnings: [],
      location: {
        address: 'C-Block, Electronic City, Sector 62',
        area: 'Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201309',
        coordinates: { lat: 28.6280, lng: 77.3649 }
      },
      startDate: new Date('2026-02-23').toISOString(),
      workTimings: '9:00 AM - 6:00 PM',
      employerContact: { phone: '9811445566', personName: 'Sunil Sharma' },
      status: 'active',
      applicantsCount: 1
    },
    // Job 6: Deep Cleaner in Vaishali
    {
      _id: 'job_cleaner_vaishali_06',
      employerId: 'usr_emp_mehta',
      employerProfileId: 'ep_clean_express',
      companyName: 'Express Facility & Deep Cleaning',
      title: 'Commercial Floor Cleaner & Sanitation Worker',
      category: 'Cleaner',
      requiredSkills: ['Cleaner', 'Deep Cleaning Specialist'],
      description: 'Machine scrubbing, glass cleaning, and washroom sanitation for newly opened healthcare clinic.',
      requiredExperience: 'Fresher',
      vacancies: 3,
      filledVacancies: 0,
      offeredWage: 700,
      wageType: 'daily',
      workDuration: '3 Days',
      paymentFrequency: 'Daily at shift end',
      paymentTerms: 'Immediate cash payment after supervisor check.',
      deductions: 'None.',
      overtimeTerms: '₹100/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Sector 3',
        area: 'Vaishali',
        city: 'Ghaziabad',
        state: 'Uttar Pradesh',
        pincode: '201010',
        coordinates: { lat: 28.6472, lng: 77.3398 }
      },
      startDate: new Date('2026-02-22').toISOString(),
      workTimings: '8:00 AM - 5:00 PM',
      employerContact: { phone: '9810998877', personName: 'Pooja Mehta' },
      status: 'active',
      applicantsCount: 2
    },
    // Job 7: Auto Mechanic in Sector 63
    {
      _id: 'job_mechanic_sec63_07',
      employerId: 'usr_sharma_services',
      employerProfileId: 'ep_sharma_services',
      companyName: 'Sharma Electrical Services',
      title: 'Diesel Generator & Motor Mechanic',
      category: 'Mechanic',
      requiredSkills: ['Mechanic', 'Motor Winding'],
      description: 'Servicing standby 125kVA generator, fuel line cleaning, belt tensioning and pump calibration.',
      requiredExperience: '3–5 years',
      vacancies: 1,
      filledVacancies: 0,
      offeredWage: 950,
      wageType: 'daily',
      workDuration: '2 Days',
      paymentFrequency: 'Upon Job Completion',
      paymentTerms: 'Direct UPI upon DG test run clearance.',
      deductions: 'None.',
      overtimeTerms: '₹150/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'B-Block, Sector 63',
        area: 'Sector 63',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        coordinates: { lat: 28.6271, lng: 77.3820 }
      },
      startDate: new Date('2026-02-23').toISOString(),
      workTimings: '9:30 AM - 6:30 PM',
      employerContact: { phone: '9811445566', personName: 'Sunil Sharma' },
      status: 'active',
      applicantsCount: 1
    },
    // Job 8: Welder in Sector 63
    {
      _id: 'job_welder_sec63_08',
      employerId: 'usr_emp_verma',
      employerProfileId: 'ep_verma_builders',
      companyName: 'Verma Infrastructure & Masonry',
      title: 'Arc Welder for Shed Fabrication',
      category: 'Welder',
      requiredSkills: ['Welder', 'Iron Worker'],
      description: 'MIG/ARC welding for MS hollow pipes, roof trusses, and staircase railing.',
      requiredExperience: '3–5 years',
      vacancies: 2,
      filledVacancies: 0,
      offeredWage: 900,
      wageType: 'daily',
      workDuration: '6 Days',
      paymentFrequency: 'Daily at shift end',
      paymentTerms: 'Cash or UPI daily.',
      deductions: 'None.',
      overtimeTerms: '₹130/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'D-Block Industrial Area, Sector 63',
        area: 'Sector 63',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        coordinates: { lat: 28.6271, lng: 77.3820 }
      },
      startDate: new Date('2026-02-24').toISOString(),
      workTimings: '9:00 AM - 6:00 PM',
      employerContact: { phone: '9811883344', personName: 'Rajeev Verma' },
      status: 'active',
      applicantsCount: 0
    },
    // Job 9: Delivery Rider in Noida
    {
      _id: 'job_delivery_sec62_09',
      employerId: 'usr_emp_mehta',
      employerProfileId: 'ep_clean_express',
      companyName: 'Express Facility & Deep Cleaning',
      title: 'Local Hyperlocal Material Runner & Delivery Worker',
      category: 'Delivery',
      requiredSkills: ['Delivery', 'Two-Wheeler Driver'],
      description: 'Delivering cleaning supplies and light machinery parts between Sector 62 and Indirapuram job sites. Two-wheeler petrol reimbursed at ₹3.5/km.',
      requiredExperience: 'Fresher',
      vacancies: 2,
      filledVacancies: 0,
      offeredWage: 750,
      wageType: 'daily',
      workDuration: '30 Days',
      paymentFrequency: 'Weekly every Saturday',
      paymentTerms: 'Weekly UPI transfer + Daily fuel reimbursement.',
      deductions: 'None.',
      overtimeTerms: '₹100/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Sector 62 Metro Hub',
        area: 'Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201309',
        coordinates: { lat: 28.6280, lng: 77.3649 }
      },
      startDate: new Date('2026-02-22').toISOString(),
      workTimings: '9:00 AM - 6:00 PM',
      employerContact: { phone: '9810998877', personName: 'Pooja Mehta' },
      status: 'active',
      applicantsCount: 1
    },
    // Job 10: Suspicious listing with Fair Wage Warning demo
    {
      _id: 'job_warning_demo_10',
      employerId: 'usr_emp_anand',
      employerProfileId: 'ep_anand_plumbing',
      companyName: 'Apex Pipe & Sanitary Solutions',
      title: 'Plumber Assistant Needed (Urgent Help)',
      category: 'Plumber',
      requiredSkills: ['Plumber'],
      description: 'Need helping hand for digging trench and lifting heavy GI pipes. Payment details to be negotiated on site after work.',
      requiredExperience: 'Any',
      vacancies: 1,
      filledVacancies: 0,
      offeredWage: 500, // Below standard guideline
      wageType: 'daily',
      workDuration: '1 Day',
      paymentFrequency: 'Upon Job Completion',
      paymentTerms: 'Payment discussed after work',
      deductions: 'Unknown / Not specified by employer',
      overtimeTerms: 'No overtime specified',
      wageTransparencyWarnings: [
        'Wage (₹500) is significantly below the minimum local trade baseline (₹700).',
        'Payment terms are unspecified: "Payment discussed after work" represents payment risk.',
        'No clear overtime or meal terms provided.'
      ],
      location: {
        address: 'Near Old Bus Stand',
        area: 'Ghaziabad',
        city: 'Ghaziabad',
        state: 'Uttar Pradesh',
        pincode: '201001',
        coordinates: { lat: 28.6692, lng: 77.4538 }
      },
      startDate: new Date('2026-02-23').toISOString(),
      workTimings: '8:00 AM - 7:00 PM',
      employerContact: { phone: '9871223344', personName: 'Anand Singh' },
      status: 'active',
      applicantsCount: 0,
      isReported: true,
      reportCount: 1
    },
    // Jobs 11 to 20 for diverse NCR coverage
    {
      _id: 'job_elec_grnoida_11',
      employerId: 'usr_sharma_services',
      employerProfileId: 'ep_sharma_services',
      companyName: 'Sharma Electrical Services',
      title: 'Solar Panel Inverter Wireman',
      category: 'Electrician',
      requiredSkills: ['Electrician', 'Solar Installer'],
      description: 'DC cable pulling and inverter junction box mounting for rooftop solar system in Greater Noida Knowledge Park.',
      requiredExperience: '1–3 years',
      vacancies: 2,
      filledVacancies: 0,
      offeredWage: 950,
      wageType: 'daily',
      workDuration: '7 Days',
      paymentFrequency: 'Daily at shift end',
      paymentTerms: 'UPI payment daily at 6:00 PM.',
      deductions: 'None.',
      overtimeTerms: '₹140/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Knowledge Park III',
        area: 'Greater Noida',
        city: 'Greater Noida',
        state: 'Uttar Pradesh',
        pincode: '201310',
        coordinates: { lat: 28.4744, lng: 77.5040 }
      },
      startDate: new Date('2026-02-24').toISOString(),
      workTimings: '9:00 AM - 6:00 PM',
      employerContact: { phone: '9811445566', personName: 'Sunil Sharma' },
      status: 'active',
      applicantsCount: 0
    },
    {
      _id: 'job_carpenter_sec50_12',
      employerId: 'usr_emp_gupta',
      employerProfileId: 'ep_gupta_decor',
      companyName: 'Gupta Home Decor & Woodcraft',
      title: 'Door & Window Frame Polish Worker',
      category: 'Carpenter',
      requiredSkills: ['Carpenter', 'Wood Polisher'],
      description: 'Melamine and PU spray polishing for solid teak main doors and window frames.',
      requiredExperience: '3–5 years',
      vacancies: 1,
      filledVacancies: 0,
      offeredWage: 900,
      wageType: 'daily',
      workDuration: '4 Days',
      paymentFrequency: 'Daily at shift end',
      paymentTerms: 'Direct cash daily.',
      deductions: 'None.',
      overtimeTerms: '₹130/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Sector 50',
        area: 'Sector 50',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        coordinates: { lat: 28.5818, lng: 77.3685 }
      },
      startDate: new Date('2026-02-25').toISOString(),
      workTimings: '9:30 AM - 6:00 PM',
      employerContact: { phone: '9891004455', personName: 'Vikas Gupta' },
      status: 'active',
      applicantsCount: 0
    },
    {
      _id: 'job_clean_sec62_13',
      employerId: 'usr_emp_mehta',
      employerProfileId: 'ep_clean_express',
      companyName: 'Express Facility & Deep Cleaning',
      title: 'Post-Construction Deep Cleaning Crew',
      category: 'Cleaner',
      requiredSkills: ['Cleaner', 'Deep Cleaning Specialist'],
      description: 'Removing cement stains, window glue, and buffing marble flooring for newly handed-over software office.',
      requiredExperience: 'Less than 1 year',
      vacancies: 4,
      filledVacancies: 2,
      offeredWage: 750,
      wageType: 'daily',
      workDuration: '3 Days',
      paymentFrequency: 'Daily at shift end',
      paymentTerms: 'Cash upon shift end.',
      deductions: 'None.',
      overtimeTerms: '₹110/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Block B, Sector 62',
        area: 'Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201309',
        coordinates: { lat: 28.6280, lng: 77.3649 }
      },
      startDate: new Date('2026-02-23').toISOString(),
      workTimings: '9:00 AM - 6:00 PM',
      employerContact: { phone: '9810998877', personName: 'Pooja Mehta' },
      status: 'active',
      applicantsCount: 2
    },
    {
      _id: 'job_mason_indirapuram_14',
      employerId: 'usr_emp_verma',
      employerProfileId: 'ep_verma_builders',
      companyName: 'Verma Infrastructure & Masonry',
      title: 'Boundary Wall Bricklayer & Plasterer',
      category: 'Mason',
      requiredSkills: ['Mason', 'Plaster Worker'],
      description: 'Constructing 9-inch brick wall with sand-cement plaster finish.',
      requiredExperience: '1–3 years',
      vacancies: 2,
      filledVacancies: 0,
      offeredWage: 850,
      wageType: 'daily',
      workDuration: '8 Days',
      paymentFrequency: 'Weekly every Saturday',
      paymentTerms: 'Saturday cash payout with signed voucher.',
      deductions: 'None.',
      overtimeTerms: '₹120/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Gyan Khand 1',
        area: 'Indirapuram',
        city: 'Ghaziabad',
        state: 'Uttar Pradesh',
        pincode: '201014',
        coordinates: { lat: 28.6415, lng: 77.3712 }
      },
      startDate: new Date('2026-02-24').toISOString(),
      workTimings: '8:30 AM - 5:30 PM',
      employerContact: { phone: '9811883344', personName: 'Rajeev Verma' },
      status: 'active',
      applicantsCount: 1
    },
    {
      _id: 'job_painter_vaishali_15',
      employerId: 'usr_emp_gupta',
      employerProfileId: 'ep_gupta_decor',
      companyName: 'Gupta Home Decor & Woodcraft',
      title: 'Waterproofing & Exterior Texture Painter',
      category: 'Painter',
      requiredSkills: ['Painter', 'Waterproofing Technician'],
      description: 'Applying Dr. Fixit damp-proof coating and exterior weather-shield paint on terrace wall parapets.',
      requiredExperience: '3–5 years',
      vacancies: 2,
      filledVacancies: 0,
      offeredWage: 850,
      wageType: 'daily',
      workDuration: '5 Days',
      paymentFrequency: 'Daily at shift end',
      paymentTerms: 'Daily UPI transfer at 6:00 PM.',
      deductions: 'None.',
      overtimeTerms: '₹120/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Sector 1',
        area: 'Vaishali',
        city: 'Ghaziabad',
        state: 'Uttar Pradesh',
        pincode: '201010',
        coordinates: { lat: 28.6472, lng: 77.3398 }
      },
      startDate: new Date('2026-02-25').toISOString(),
      workTimings: '9:00 AM - 5:30 PM',
      employerContact: { phone: '9891004455', personName: 'Vikas Gupta' },
      status: 'active',
      applicantsCount: 0
    },
    {
      _id: 'job_elec_indirapuram_16',
      employerId: 'usr_emp_anand',
      employerProfileId: 'ep_anand_plumbing',
      companyName: 'Apex Pipe & Sanitary Solutions',
      title: 'Pump Panel & Submersible Wiring Electrician',
      category: 'Electrician',
      requiredSkills: ['Electrician', 'Motor Winding'],
      description: 'Installing automatic water-level controller sensors, starter relays, and 3-phase pump cable connections.',
      requiredExperience: '1–3 years',
      vacancies: 1,
      filledVacancies: 0,
      offeredWage: 850,
      wageType: 'daily',
      workDuration: '2 Days',
      paymentFrequency: 'Upon Job Completion',
      paymentTerms: 'UPI payment immediately upon successful sensor commissioning.',
      deductions: 'None.',
      overtimeTerms: '₹130/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Niti Khand 2',
        area: 'Indirapuram',
        city: 'Ghaziabad',
        state: 'Uttar Pradesh',
        pincode: '201014',
        coordinates: { lat: 28.6415, lng: 77.3712 }
      },
      startDate: new Date('2026-02-23').toISOString(),
      workTimings: '10:00 AM - 6:00 PM',
      employerContact: { phone: '9871223344', personName: 'Anand Singh' },
      status: 'active',
      applicantsCount: 1
    },
    {
      _id: 'job_monthly_carpenter_17',
      employerId: 'usr_emp_gupta',
      employerProfileId: 'ep_gupta_decor',
      companyName: 'Gupta Home Decor & Woodcraft',
      title: 'Workshop Carpenter (Monthly Position)',
      category: 'Carpenter',
      requiredSkills: ['Carpenter', 'Wood Craftsman'],
      description: 'Full-time monthly craftsman for custom furniture fabrication, laminate pressing, and edge-banding in factory.',
      requiredExperience: '3–5 years',
      vacancies: 2,
      filledVacancies: 1,
      offeredWage: 24000,
      wageType: 'monthly',
      workDuration: 'Full-time permanent',
      paymentFrequency: 'Monthly on 1st',
      paymentTerms: 'Direct NEFT/IMPS bank transfer on the 1st of every month. PF & ESI included.',
      deductions: 'Standard statutory PF deduction matching employer contribution.',
      overtimeTerms: '₹120/hr overtime.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Sector 10',
        area: 'Noida',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        coordinates: { lat: 28.5912, lng: 77.3190 }
      },
      startDate: new Date('2026-03-01').toISOString(),
      workTimings: '9:30 AM - 6:30 PM (Mon-Sat)',
      employerContact: { phone: '9891004455', personName: 'Vikas Gupta' },
      status: 'active',
      applicantsCount: 2
    },
    {
      _id: 'job_delivery_express_18',
      employerId: 'usr_emp_mehta',
      employerProfileId: 'ep_clean_express',
      companyName: 'Express Facility & Deep Cleaning',
      title: 'Equipment Van Driver',
      category: 'Driver',
      requiredSkills: ['Driver', 'Delivery Driver'],
      description: 'Driving Tata Ace delivery van carrying scrubbers and vacuums to commercial client facilities across NCR.',
      requiredExperience: '3–5 years',
      vacancies: 1,
      filledVacancies: 0,
      offeredWage: 850,
      wageType: 'daily',
      workDuration: '15 Days',
      paymentFrequency: 'Weekly every Saturday',
      paymentTerms: 'Weekly bank payment + daily food allowance of ₹100.',
      deductions: 'None.',
      overtimeTerms: '₹120/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Sector 62',
        area: 'Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201309',
        coordinates: { lat: 28.6280, lng: 77.3649 }
      },
      startDate: new Date('2026-02-23').toISOString(),
      workTimings: '8:00 AM - 5:00 PM',
      employerContact: { phone: '9810998877', personName: 'Pooja Mehta' },
      status: 'active',
      applicantsCount: 1
    },
    {
      _id: 'job_mechanic_bike_19',
      employerId: 'usr_sharma_services',
      employerProfileId: 'ep_sharma_services',
      companyName: 'Sharma Electrical Services',
      title: 'Fleet Scooter & Bike Mechanic',
      category: 'Mechanic',
      requiredSkills: ['Mechanic', 'Two-Wheeler Technician'],
      description: 'Tune up, brake shoe replacement, oil change, and electrical wiring inspection for company field technicians fleet of 12 motorcycles.',
      requiredExperience: '1–3 years',
      vacancies: 1,
      filledVacancies: 0,
      offeredWage: 900,
      wageType: 'daily',
      workDuration: '3 Days',
      paymentFrequency: 'Daily at shift end',
      paymentTerms: 'Direct cash daily.',
      deductions: 'None.',
      overtimeTerms: '₹120/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'C-Block, Sector 63',
        area: 'Sector 63',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        coordinates: { lat: 28.6271, lng: 77.3820 }
      },
      startDate: new Date('2026-02-24').toISOString(),
      workTimings: '9:00 AM - 6:00 PM',
      employerContact: { phone: '9811445566', personName: 'Sunil Sharma' },
      status: 'active',
      applicantsCount: 1
    },
    {
      _id: 'job_completed_demo_20',
      employerId: 'usr_sharma_services',
      employerProfileId: 'ep_sharma_services',
      companyName: 'Sharma Electrical Services',
      title: 'Emergency Generator Line Repair (Completed Work)',
      category: 'Electrician',
      requiredSkills: ['Electrician'],
      description: 'Restoration of severed feeder cable during metro road expansion.',
      requiredExperience: '3–5 years',
      vacancies: 1,
      filledVacancies: 1,
      offeredWage: 1200,
      wageType: 'daily',
      workDuration: '1 Day',
      paymentFrequency: 'Upon Job Completion',
      paymentTerms: 'Immediate cash payment on completion.',
      deductions: 'None.',
      overtimeTerms: '₹200/hr.',
      wageTransparencyWarnings: [],
      location: {
        address: 'Sector 62 Metro Roundabout',
        area: 'Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201309',
        coordinates: { lat: 28.6280, lng: 77.3649 }
      },
      startDate: new Date('2026-02-15').toISOString(),
      workTimings: '8:00 AM - 4:00 PM',
      employerContact: { phone: '9811445566', personName: 'Sunil Sharma' },
      status: 'completed',
      acceptedWorkerId: 'usr_ramesh_kumar',
      applicantsCount: 1,
      shortlistedCount: 1
    }
  ];

  // 7. 10 SAMPLE APPLICATIONS (Including the primary demonstration journey link)
  const sampleApplications = [
    // Ramesh Kumar applied for Sharma Electrical Services Job 1
    {
      _id: 'app_ramesh_sharma_01',
      jobId: 'job_sharma_elec_01',
      workerId: 'usr_ramesh_kumar',
      employerId: 'usr_sharma_services',
      status: 'Applied', // will be accepted during demonstration journey!
      matchScore: {
        total: 92,
        breakdown: {
          skillScore: 95,
          locationScore: 90,
          wageScore: 100,
          availabilityScore: 100
        },
        distanceKm: 2.1,
        explanations: [
          'Direct skill match for Electrician, Wireman.',
          'Job site is 2.1 km away from your base location (Sector 62 to Sector 63).',
          'Offered wage ₹900/daily (₹100 above your expected wage!).',
          'Your immediate availability matches employer timeline perfectly.'
        ]
      },
      coverNote: 'Namaste Sharma ji, I live in Sector 62, have 3 years experience in office 3-phase wiring and have all safety tools ready. Available immediately.',
      employerNotes: '',
      createdAt: new Date('2026-02-21T08:30:00').toISOString()
    },
    // Application 2: Mohammad Imran applied for Plumber Job
    {
      _id: 'app_imran_plumb_02',
      jobId: 'job_indirapuram_plumb_02',
      workerId: 'usr_worker_2',
      employerId: 'usr_emp_anand',
      status: 'Shortlisted',
      matchScore: {
        total: 94,
        breakdown: { skillScore: 100, locationScore: 100, wageScore: 100, availabilityScore: 90 },
        distanceKm: 0.8,
        explanations: [
          'Direct skill match for Plumber, Pipe Fitter.',
          'Job is in your exact neighbourhood (Indirapuram).',
          'Offered wage ₹900 meets your rate.',
          'Available as requested.'
        ]
      },
      coverNote: 'Local plumber with 4 years experience in high rise flats.',
      createdAt: new Date('2026-02-20T11:00:00').toISOString()
    },
    // Application 3: Suresh Prajapati applied for Carpenter job
    {
      _id: 'app_suresh_gupta_03',
      jobId: 'job_gupta_carpenter_03',
      workerId: 'usr_worker_3',
      employerId: 'usr_emp_gupta',
      status: 'Viewed',
      matchScore: {
        total: 95,
        breakdown: { skillScore: 100, locationScore: 100, wageScore: 100, availabilityScore: 85 },
        distanceKm: 0.5,
        explanations: ['Direct skill match for Carpenter.', 'Within walking distance in Sector 18.']
      },
      createdAt: new Date('2026-02-20T14:15:00').toISOString()
    },
    // Application 4: Santosh Yadav applied for Painter job
    {
      _id: 'app_santosh_painter_04',
      jobId: 'job_painter_sec62_05',
      workerId: 'usr_worker_4',
      employerId: 'usr_sharma_services',
      status: 'Applied',
      matchScore: {
        total: 90,
        breakdown: { skillScore: 90, locationScore: 100, wageScore: 100, availabilityScore: 85 },
        distanceKm: 0.3,
        explanations: ['Direct skill match for Painter.', 'Located in Sector 62.']
      },
      createdAt: new Date('2026-02-21T09:10:00').toISOString()
    },
    // Application 5: Manoj Bind applied for Mason job
    {
      _id: 'app_manoj_mason_05',
      jobId: 'job_verma_mason_04',
      workerId: 'usr_worker_5',
      employerId: 'usr_emp_verma',
      status: 'Accepted',
      matchScore: {
        total: 93,
        breakdown: { skillScore: 100, locationScore: 100, wageScore: 100, availabilityScore: 85 },
        distanceKm: 0.6,
        explanations: ['Direct skill match for Mason, Tile Layer.']
      },
      createdAt: new Date('2026-02-19T10:00:00').toISOString()
    },
    // Application 6: Amit Rawat applied for DG mechanic job
    {
      _id: 'app_amit_mech_06',
      jobId: 'job_mechanic_sec63_07',
      workerId: 'usr_worker_6',
      employerId: 'usr_sharma_services',
      status: 'Viewed',
      matchScore: {
        total: 89,
        breakdown: { skillScore: 95, locationScore: 100, wageScore: 100, availabilityScore: 75 },
        distanceKm: 1.1,
        explanations: ['Direct skill match for Mechanic.']
      },
      createdAt: new Date('2026-02-20T16:30:00').toISOString()
    },
    // Application 7: Deepak Varma applied for Welder job
    {
      _id: 'app_deepak_welder_07',
      jobId: 'job_welder_sec63_08',
      workerId: 'usr_worker_8',
      employerId: 'usr_emp_verma',
      status: 'Applied',
      matchScore: {
        total: 91,
        breakdown: { skillScore: 100, locationScore: 95, wageScore: 100, availabilityScore: 80 },
        distanceKm: 1.5,
        explanations: ['Direct skill match for Welder.']
      },
      createdAt: new Date('2026-02-21T07:20:00').toISOString()
    },
    // Application 8: Sunita Devi applied for Cleaner job
    {
      _id: 'app_sunita_clean_08',
      jobId: 'job_cleaner_vaishali_06',
      workerId: 'usr_worker_9',
      employerId: 'usr_emp_mehta',
      status: 'Accepted',
      matchScore: {
        total: 92,
        breakdown: { skillScore: 100, locationScore: 90, wageScore: 100, availabilityScore: 90 },
        distanceKm: 2.3,
        explanations: ['Direct skill match for Cleaner.']
      },
      createdAt: new Date('2026-02-19T12:00:00').toISOString()
    },
    // Application 9: Virender Singh applied for Delivery job
    {
      _id: 'app_virender_del_09',
      jobId: 'job_delivery_sec62_09',
      workerId: 'usr_worker_11',
      employerId: 'usr_emp_mehta',
      status: 'Shortlisted',
      matchScore: {
        total: 88,
        breakdown: { skillScore: 90, locationScore: 100, wageScore: 100, availabilityScore: 80 },
        distanceKm: 0.4,
        explanations: ['Direct skill match for Delivery.']
      },
      createdAt: new Date('2026-02-20T10:45:00').toISOString()
    },
    // Application 10: Completed demo job application for Ramesh Kumar
    {
      _id: 'app_ramesh_completed_10',
      jobId: 'job_completed_demo_20',
      workerId: 'usr_ramesh_kumar',
      employerId: 'usr_sharma_services',
      status: 'Completed',
      matchScore: {
        total: 96,
        breakdown: { skillScore: 100, locationScore: 100, wageScore: 100, availabilityScore: 95 },
        distanceKm: 0.2,
        explanations: ['Emergency generator repair executed on time.']
      },
      coverNote: 'Executed emergency restoration.',
      createdAt: new Date('2026-02-15T08:00:00').toISOString()
    }
  ];

  // 8. SAMPLE REVIEWS
  const sampleReviews = [
    {
      _id: 'rev_sharma_to_ramesh',
      jobId: 'job_completed_demo_20',
      fromUserId: 'usr_sharma_services',
      toUserId: 'usr_ramesh_kumar',
      fromRole: 'employer',
      rating: 5,
      punctualityScore: 5,
      workQualityScore: 5,
      communicationScore: 5,
      reviewText: 'Ramesh is an exceptional wireman. Arrived within 20 minutes for our emergency line fault, restored the feeder cable safely and with zero hassles. Strongly recommended!',
      isVerifiedWork: true,
      createdAt: new Date('2026-02-15T18:00:00').toISOString()
    },
    {
      _id: 'rev_ramesh_to_sharma',
      jobId: 'job_completed_demo_20',
      fromUserId: 'usr_ramesh_kumar',
      toUserId: 'usr_sharma_services',
      fromRole: 'worker',
      rating: 5,
      punctualityScore: 5,
      workQualityScore: 5,
      communicationScore: 5,
      reviewText: 'Sunil Sharma ji gave clear site instructions, provided proper safety boots and paid full ₹1200 immediately via UPI upon completion. Genuine employer.',
      isVerifiedWork: true,
      createdAt: new Date('2026-02-15T18:30:00').toISOString()
    }
  ];

  // 9. SAMPLE NOTIFICATIONS
  const sampleNotifications = [
    {
      _id: 'notif_ramesh_01',
      userId: 'usr_ramesh_kumar',
      title: 'Nearby Job Match Found (92%)',
      message: 'Sharma Electrical Services posted "Commercial Electrician Required" in Sector 63 (2.1 km away).',
      type: 'info',
      actionUrl: '/worker/find-jobs',
      isRead: false,
      createdAt: new Date('2026-02-21T08:00:00').toISOString()
    },
    {
      _id: 'notif_sharma_01',
      userId: 'usr_sharma_services',
      title: 'New Candidate Applied!',
      message: 'Ramesh Kumar (Electrician, 3 yrs exp, 94 Trust Score) applied for your Sector 63 job.',
      type: 'success',
      actionUrl: '/employer/candidates',
      isRead: false,
      createdAt: new Date('2026-02-21T08:31:00').toISOString()
    }
  ];

  // 10. SAMPLE REPORTS
  const sampleReports = [
    {
      _id: 'rep_demo_01',
      reportedBy: 'usr_worker_2',
      targetType: 'job',
      targetId: 'job_warning_demo_10',
      targetName: 'Plumber Assistant Needed (Urgent Help)',
      reason: 'Wage Fraud / Unpaid',
      details: 'Employer stated payment would be negotiated on site after 11 hours of hard manual digging. Wage stated ₹500 is way below trade safety guidelines.',
      evidenceUrls: [],
      status: 'Pending',
      adminNotes: '',
      actionTaken: 'Flagged for moderation',
      createdAt: new Date('2026-02-21T09:00:00').toISOString()
    }
  ];

  // 11. SKILL CATEGORIES WITH BENCHMARKS
  const skillsData = [
    { name: 'Electrician', category: 'Electrical', benchmarkWageMin: 750, benchmarkWageMax: 1100, demandLevel: 'Very High', icon: 'Zap' },
    { name: 'Wireman', category: 'Electrical', benchmarkWageMin: 700, benchmarkWageMax: 1000, demandLevel: 'High', icon: 'Zap' },
    { name: 'Plumber', category: 'Plumbing', benchmarkWageMin: 700, benchmarkWageMax: 1100, demandLevel: 'High', icon: 'Wrench' },
    { name: 'Pipe Fitter', category: 'Plumbing', benchmarkWageMin: 750, benchmarkWageMax: 1150, demandLevel: 'High', icon: 'Wrench' },
    { name: 'Carpenter', category: 'Woodwork', benchmarkWageMin: 800, benchmarkWageMax: 1250, demandLevel: 'High', icon: 'Hammer' },
    { name: 'Painter', category: 'Painting', benchmarkWageMin: 650, benchmarkWageMax: 950, demandLevel: 'Very High', icon: 'Paintbrush' },
    { name: 'Mason', category: 'Construction', benchmarkWageMin: 750, benchmarkWageMax: 1050, demandLevel: 'High', icon: 'HardHat' },
    { name: 'Mechanic', category: 'Automotive', benchmarkWageMin: 800, benchmarkWageMax: 1200, demandLevel: 'Moderate', icon: 'Settings' },
    { name: 'Welder', category: 'Fabrication', benchmarkWageMin: 800, benchmarkWageMax: 1150, demandLevel: 'Moderate', icon: 'Flame' },
    { name: 'Cleaner', category: 'Sanitation', benchmarkWageMin: 550, benchmarkWageMax: 800, demandLevel: 'Very High', icon: 'Sparkles' },
    { name: 'Delivery', category: 'Logistics', benchmarkWageMin: 650, benchmarkWageMax: 900, demandLevel: 'Very High', icon: 'Truck' }
  ];

  // Compile full JSON structure
  const allUsers = [
    adminUser,
    rameshUser,
    sharmaEmployerUser,
    ...additionalEmployers.map(e => e.user),
    ...workersUsers
  ];

  const allWorkerProfiles = [
    rameshWorkerProfile,
    ...workersProfiles
  ];

  const allEmployerProfiles = [
    sharmaEmployerProfile,
    ...additionalEmployers.map(e => e.profile)
  ];

  const fullDatabase = {
    users: allUsers,
    workerProfiles: allWorkerProfiles,
    employerProfiles: allEmployerProfiles,
    jobs: jobListings,
    applications: sampleApplications,
    skills: skillsData,
    reviews: sampleReviews,
    notifications: sampleNotifications,
    reports: sampleReports
  };

  // Write to local json file
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(fullDatabase, null, 2), 'utf-8');
    console.log(`[Seed] Seeded ${allUsers.length} users, ${allWorkerProfiles.length} workers, ${allEmployerProfiles.length} employers, ${jobListings.length} jobs to ${DATA_FILE}`);
  } catch (err) {
    console.error('[Seed] Error writing JSON demo file:', err.message);
  }

  return fullDatabase;
};

// If run directly via node seedData.js
if (process.argv[1] && process.argv[1].endsWith('seedData.js')) {
  generateSeedData().then(() => {
    console.log('[Seed] Database initialization complete.');
    process.exit(0);
  });
}
