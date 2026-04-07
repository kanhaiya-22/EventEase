/**
 * Email domain → College/University mapping for Uttar Pradesh institutions.
 *
 * How it works:
 *  - When a user registers with e.g. "student@iitk.ac.in", we extract "iitk.ac.in"
 *  - Look up in this map → get college name, slug, city, type
 *  - findOrCreate the Organization in DB
 *
 * Maintenance:
 *  - Add new colleges by appending to the appropriate section
 *  - One domain can map to exactly one college
 *  - If a college uses multiple domains, add separate entries for each
 */

export interface CollegeInfo {
  name: string;
  slug: string;
  city: string;
  type:
    | "IIT"
    | "NIT"
    | "IIIT"
    | "Central University"
    | "State University"
    | "State Technical University"
    | "Govt Autonomous"
    | "Govt College"
    | "Private University"
    | "Private Deemed"
    | "Private College"
    | "Medical"
    | "Agricultural"
    | "Law"
    | "Management";
}

/**
 * Map of email domain (lowercase) → college info.
 * Domains are without the "@" prefix.
 */
export const COLLEGE_DOMAIN_MAP: Record<string, CollegeInfo> = {
  // ═══════════════════════════════════════════════════════════
  // IITs (Indian Institutes of Technology)
  // ═══════════════════════════════════════════════════════════
  "iitk.ac.in": {
    name: "Indian Institute of Technology Kanpur",
    slug: "iit-kanpur",
    city: "Kanpur",
    type: "IIT",
  },
  "iitbhu.ac.in": {
    name: "Indian Institute of Technology (BHU) Varanasi",
    slug: "iit-bhu",
    city: "Varanasi",
    type: "IIT",
  },
  "itbhu.ac.in": {
    name: "Indian Institute of Technology (BHU) Varanasi",
    slug: "iit-bhu",
    city: "Varanasi",
    type: "IIT",
  },

  // ═══════════════════════════════════════════════════════════
  // NITs (National Institutes of Technology)
  // ═══════════════════════════════════════════════════════════
  "mnnit.ac.in": {
    name: "Motilal Nehru National Institute of Technology Allahabad",
    slug: "mnnit-allahabad",
    city: "Prayagraj",
    type: "NIT",
  },

  // ═══════════════════════════════════════════════════════════
  // IIITs (Indian Institutes of Information Technology)
  // ═══════════════════════════════════════════════════════════
  "iiita.ac.in": {
    name: "Indian Institute of Information Technology Allahabad",
    slug: "iiit-allahabad",
    city: "Prayagraj",
    type: "IIIT",
  },
  "iiitl.ac.in": {
    name: "Indian Institute of Information Technology Lucknow",
    slug: "iiit-lucknow",
    city: "Lucknow",
    type: "IIIT",
  },

  // ═══════════════════════════════════════════════════════════
  // Central Universities
  // ═══════════════════════════════════════════════════════════
  "bhu.ac.in": {
    name: "Banaras Hindu University",
    slug: "bhu-varanasi",
    city: "Varanasi",
    type: "Central University",
  },
  "amu.ac.in": {
    name: "Aligarh Muslim University",
    slug: "amu-aligarh",
    city: "Aligarh",
    type: "Central University",
  },
  "myamu.ac.in": {
    name: "Aligarh Muslim University",
    slug: "amu-aligarh",
    city: "Aligarh",
    type: "Central University",
  },
  "bbau.ac.in": {
    name: "Babasaheb Bhimrao Ambedkar University",
    slug: "bbau-lucknow",
    city: "Lucknow",
    type: "Central University",
  },

  // ═══════════════════════════════════════════════════════════
  // State Universities
  // ═══════════════════════════════════════════════════════════
  "aktu.ac.in": {
    name: "Dr. A.P.J. Abdul Kalam Technical University",
    slug: "aktu-lucknow",
    city: "Lucknow",
    type: "State Technical University",
  },
  "lkouniv.ac.in": {
    name: "University of Lucknow",
    slug: "lucknow-university",
    city: "Lucknow",
    type: "State University",
  },
  "csjmu.ac.in": {
    name: "Chhatrapati Shahu Ji Maharaj University",
    slug: "csjmu-kanpur",
    city: "Kanpur",
    type: "State University",
  },
  "allduniv.ac.in": {
    name: "University of Allahabad",
    slug: "allahabad-university",
    city: "Prayagraj",
    type: "State University",
  },
  "ddugu.ac.in": {
    name: "Deen Dayal Upadhyaya Gorakhpur University",
    slug: "ddugu-gorakhpur",
    city: "Gorakhpur",
    type: "State University",
  },
  "dbrau.ac.in": {
    name: "Dr. Bhimrao Ambedkar University",
    slug: "dbrau-agra",
    city: "Agra",
    type: "State University",
  },
  "mjpru.ac.in": {
    name: "Mahatma Jyotiba Phule Rohilkhand University",
    slug: "mjpru-bareilly",
    city: "Bareilly",
    type: "State University",
  },
  "vbspu.ac.in": {
    name: "Veer Bahadur Singh Purvanchal University",
    slug: "vbspu-jaunpur",
    city: "Jaunpur",
    type: "State University",
  },
  "rmlau.ac.in": {
    name: "Dr. Ram Manohar Lohia Avadh University",
    slug: "rmlau-ayodhya",
    city: "Ayodhya",
    type: "State University",
  },
  "bujhansi.ac.in": {
    name: "Bundelkhand University",
    slug: "bu-jhansi",
    city: "Jhansi",
    type: "State University",
  },
  "mgkvp.ac.in": {
    name: "Mahatma Gandhi Kashi Vidyapith",
    slug: "mgkvp-varanasi",
    city: "Varanasi",
    type: "State University",
  },
  "ccsu.ac.in": {
    name: "Chaudhary Charan Singh University",
    slug: "ccsu-meerut",
    city: "Meerut",
    type: "State University",
  },
  "kfrsu.ac.in": {
    name: "Khwaja Moinuddin Chishti Language University",
    slug: "kmclu-lucknow",
    city: "Lucknow",
    type: "State University",
  },
  "upsrtc.ac.in": {
    name: "Atal Bihari Vajpayee Medical University",
    slug: "abvmu-lucknow",
    city: "Lucknow",
    type: "State University",
  },
  "svu.ac.in": {
    name: "Sampurnanand Sanskrit Vishwavidyalaya",
    slug: "ssvv-varanasi",
    city: "Varanasi",
    type: "State University",
  },

  // ═══════════════════════════════════════════════════════════
  // State Technical Universities
  // ═══════════════════════════════════════════════════════════
  "hbtu.ac.in": {
    name: "Harcourt Butler Technical University",
    slug: "hbtu-kanpur",
    city: "Kanpur",
    type: "State Technical University",
  },
  "mmmut.ac.in": {
    name: "Madan Mohan Malaviya University of Technology",
    slug: "mmmut-gorakhpur",
    city: "Gorakhpur",
    type: "State Technical University",
  },
  "gbu.ac.in": {
    name: "Gautam Buddha University",
    slug: "gbu-greater-noida",
    city: "Greater Noida",
    type: "State University",
  },

  // ═══════════════════════════════════════════════════════════
  // Government / Autonomous Engineering Colleges (AKTU affiliated)
  // ═══════════════════════════════════════════════════════════
  "ietlucknow.ac.in": {
    name: "Institute of Engineering and Technology Lucknow",
    slug: "iet-lucknow",
    city: "Lucknow",
    type: "Govt Autonomous",
  },
  "knit.ac.in": {
    name: "Kamla Nehru Institute of Technology",
    slug: "knit-sultanpur",
    city: "Sultanpur",
    type: "Govt Autonomous",
  },
  "bietjhs.ac.in": {
    name: "Bundelkhand Institute of Engineering and Technology",
    slug: "biet-jhansi",
    city: "Jhansi",
    type: "Govt College",
  },
  "fiet.ac.in": {
    name: "Feroze Gandhi Institute of Engineering and Technology",
    slug: "fgiet-raebareli",
    city: "Raebareli",
    type: "Govt College",
  },
  "jklu.ac.in": {
    name: "JK Institute of Applied Physics and Technology",
    slug: "jk-allahabad",
    city: "Prayagraj",
    type: "Govt College",
  },
  "mmec.ac.in": {
    name: "Manyawar Kanshiram Ji Government Engineering College",
    slug: "mmec-ambedkar-nagar",
    city: "Ambedkar Nagar",
    type: "Govt College",
  },
  "geci.ac.in": {
    name: "Government Engineering College Idukki",
    slug: "gec-idukki",
    city: "Idukki",
    type: "Govt College",
  },
  "hcet.ac.in": {
    name: "Hindustan College of Engineering and Technology",
    slug: "hcet-agra",
    city: "Agra",
    type: "Govt College",
  },

  // ═══════════════════════════════════════════════════════════
  // Private Universities
  // ═══════════════════════════════════════════════════════════
  "amity.edu": {
    name: "Amity University Noida",
    slug: "amity-noida",
    city: "Noida",
    type: "Private Deemed",
  },
  "s.amity.edu": {
    name: "Amity University Noida",
    slug: "amity-noida",
    city: "Noida",
    type: "Private Deemed",
  },
  "amity.edu.in": {
    name: "Amity University Lucknow",
    slug: "amity-lucknow",
    city: "Lucknow",
    type: "Private Deemed",
  },
  "sharda.ac.in": {
    name: "Sharda University",
    slug: "sharda-greater-noida",
    city: "Greater Noida",
    type: "Private University",
  },
  "bennett.edu.in": {
    name: "Bennett University",
    slug: "bennett-greater-noida",
    city: "Greater Noida",
    type: "Private University",
  },
  "gla.ac.in": {
    name: "GLA University",
    slug: "gla-mathura",
    city: "Mathura",
    type: "Private University",
  },
  "srmu.ac.in": {
    name: "Shri Ramswaroop Memorial University",
    slug: "srmu-lucknow",
    city: "Lucknow",
    type: "Private University",
  },
  "galgotiasuniversity.edu.in": {
    name: "Galgotias University",
    slug: "galgotias-greater-noida",
    city: "Greater Noida",
    type: "Private University",
  },
  "iul.ac.in": {
    name: "Integral University",
    slug: "integral-lucknow",
    city: "Lucknow",
    type: "Private University",
  },
  "jiit.ac.in": {
    name: "Jaypee Institute of Information Technology",
    slug: "jiit-noida",
    city: "Noida",
    type: "Private Deemed",
  },
  "tmu.ac.in": {
    name: "Teerthanker Mahaveer University",
    slug: "tmu-moradabad",
    city: "Moradabad",
    type: "Private University",
  },
  "invertisuniversity.ac.in": {
    name: "Invertis University",
    slug: "invertis-bareilly",
    city: "Bareilly",
    type: "Private University",
  },
  "bbdu.ac.in": {
    name: "Babu Banarasi Das University",
    slug: "bbdu-lucknow",
    city: "Lucknow",
    type: "Private University",
  },
  "mangalayatan.edu.in": {
    name: "Mangalayatan University",
    slug: "mangalayatan-aligarh",
    city: "Aligarh",
    type: "Private University",
  },
  "muit.in": {
    name: "Maharishi University of Information Technology",
    slug: "muit-lucknow",
    city: "Lucknow",
    type: "Private University",
  },
  "ramauniversity.ac.in": {
    name: "Rama University",
    slug: "rama-kanpur",
    city: "Kanpur",
    type: "Private University",
  },
  "srmuniversity.ac.in": {
    name: "SRM University UP",
    slug: "srm-up",
    city: "Sonepat",
    type: "Private University",
  },
  "snu.edu.in": {
    name: "Shiv Nadar University",
    slug: "snu-greater-noida",
    city: "Greater Noida",
    type: "Private University",
  },
  "niilmuniversity.in": {
    name: "NIILM University",
    slug: "niilm-lucknow",
    city: "Lucknow",
    type: "Private University",
  },
  "sanskriti.edu.in": {
    name: "Sanskriti University",
    slug: "sanskriti-mathura",
    city: "Mathura",
    type: "Private University",
  },
  "mvn.edu.in": {
    name: "MVN University",
    slug: "mvn-palwal",
    city: "Palwal",
    type: "Private University",
  },
  "mru.edu.in": {
    name: "Manav Rachna University",
    slug: "mru-faridabad",
    city: "Faridabad",
    type: "Private University",
  },
  "noida.amity.edu": {
    name: "Amity University Noida",
    slug: "amity-noida",
    city: "Noida",
    type: "Private Deemed",
  },
  "lpu.co.in": {
    name: "Lovely Professional University (UP campus)",
    slug: "lpu-up",
    city: "Greater Noida",
    type: "Private University",
  },
  "iftmuniversity.ac.in": {
    name: "IFTM University",
    slug: "iftm-moradabad",
    city: "Moradabad",
    type: "Private University",
  },
  "mru.ac.in": {
    name: "Mohammad Ali Jauhar University",
    slug: "maju-rampur",
    city: "Rampur",
    type: "Private University",
  },
  "erauniversity.in": {
    name: "Era University",
    slug: "era-lucknow",
    city: "Lucknow",
    type: "Private University",
  },
  "rfrsu.ac.in": {
    name: "Raja Mahendra Pratap Singh State University",
    slug: "rmpsu-aligarh",
    city: "Aligarh",
    type: "State University",
  },

  // ═══════════════════════════════════════════════════════════
  // Private Engineering Colleges (AKTU affiliated)
  // ═══════════════════════════════════════════════════════════
  "kiet.edu": {
    name: "KIET Group of Institutions",
    slug: "kiet-ghaziabad",
    city: "Ghaziabad",
    type: "Private College",
  },
  "akgec.ac.in": {
    name: "Ajay Kumar Garg Engineering College",
    slug: "akgec-ghaziabad",
    city: "Ghaziabad",
    type: "Private College",
  },
  "abes.ac.in": {
    name: "ABES Engineering College",
    slug: "abes-ghaziabad",
    city: "Ghaziabad",
    type: "Private College",
  },
  "jssaten.ac.in": {
    name: "JSS Academy of Technical Education",
    slug: "jssate-noida",
    city: "Noida",
    type: "Private College",
  },
  "niet.co.in": {
    name: "Noida Institute of Engineering and Technology",
    slug: "niet-greater-noida",
    city: "Greater Noida",
    type: "Private College",
  },
  "glbitm.org": {
    name: "GL Bajaj Institute of Technology and Management",
    slug: "glbitm-greater-noida",
    city: "Greater Noida",
    type: "Private College",
  },
  "galgotiacollege.edu": {
    name: "Galgotias College of Engineering and Technology",
    slug: "gcet-greater-noida",
    city: "Greater Noida",
    type: "Private College",
  },
  "rkgit.edu.in": {
    name: "Raj Kumar Goel Institute of Technology",
    slug: "rkgit-ghaziabad",
    city: "Ghaziabad",
    type: "Private College",
  },
  "srmcem.ac.in": {
    name: "Shri Ramswaroop Memorial College of Engineering and Management",
    slug: "srmcem-lucknow",
    city: "Lucknow",
    type: "Private College",
  },
  "bbimt.in": {
    name: "Babu Banarasi Das Northern India Institute of Technology",
    slug: "bbdniit-lucknow",
    city: "Lucknow",
    type: "Private College",
  },
  "bbdnitm.ac.in": {
    name: "BBD National Institute of Technology and Management",
    slug: "bbdnitm-lucknow",
    city: "Lucknow",
    type: "Private College",
  },
  "imsnoida.com": {
    name: "Institute of Management Studies Noida",
    slug: "ims-noida",
    city: "Noida",
    type: "Private College",
  },
  "ipsacademy.org": {
    name: "IPS Academy",
    slug: "ips-academy",
    city: "Gwalior",
    type: "Private College",
  },
  "hrit.com": {
    name: "HMR Institute of Technology and Management",
    slug: "hrit-ghaziabad",
    city: "Ghaziabad",
    type: "Private College",
  },
  "iitm.ac.in": {
    name: "IITM Group of Institutions",
    slug: "iitm-meerut",
    city: "Meerut",
    type: "Private College",
  },
  "psit.ac.in": {
    name: "Pranveer Singh Institute of Technology",
    slug: "psit-kanpur",
    city: "Kanpur",
    type: "Private College",
  },
  "bncet.ac.in": {
    name: "BN College of Engineering and Technology",
    slug: "bncet-lucknow",
    city: "Lucknow",
    type: "Private College",
  },
  "uietkanpur.com": {
    name: "United Institute of Engineering and Technology",
    slug: "uiet-kanpur",
    city: "Kanpur",
    type: "Private College",
  },
  "srmgpc.ac.in": {
    name: "SRM Group of Professional Colleges",
    slug: "srmgpc-lucknow",
    city: "Lucknow",
    type: "Private College",
  },
  "aith.ac.in": {
    name: "Azad Institute of Engineering and Technology",
    slug: "aith-lucknow",
    city: "Lucknow",
    type: "Private College",
  },
  "knmiet.ac.in": {
    name: "KNM Institute of Engineering and Technology",
    slug: "knmiet-modinagar",
    city: "Modinagar",
    type: "Private College",
  },
  "rfriet.ac.in": {
    name: "Rajkiya Engineering College",
    slug: "rec-azamgarh",
    city: "Azamgarh",
    type: "Govt College",
  },
  "recsonbhadra.ac.in": {
    name: "Rajkiya Engineering College Sonbhadra",
    slug: "rec-sonbhadra",
    city: "Sonbhadra",
    type: "Govt College",
  },
  "recbanda.ac.in": {
    name: "Rajkiya Engineering College Banda",
    slug: "rec-banda",
    city: "Banda",
    type: "Govt College",
  },
  "reciit.ac.in": {
    name: "Rajkiya Engineering College Mainpuri",
    slug: "rec-mainpuri",
    city: "Mainpuri",
    type: "Govt College",
  },
  "recambedkarnagar.ac.in": {
    name: "Rajkiya Engineering College Ambedkar Nagar",
    slug: "rec-ambedkar-nagar",
    city: "Ambedkar Nagar",
    type: "Govt College",
  },
  "recbijnor.ac.in": {
    name: "Rajkiya Engineering College Bijnor",
    slug: "rec-bijnor",
    city: "Bijnor",
    type: "Govt College",
  },
  "reckannauj.ac.in": {
    name: "Rajkiya Engineering College Kannauj",
    slug: "rec-kannauj",
    city: "Kannauj",
    type: "Govt College",
  },
  "recchitrakoot.ac.in": {
    name: "Rajkiya Engineering College Chitrakoot",
    slug: "rec-chitrakoot",
    city: "Chitrakoot",
    type: "Govt College",
  },
  "iemec.in": {
    name: "IEM Engineering College",
    slug: "iem-lucknow",
    city: "Lucknow",
    type: "Private College",
  },
  "siet.ac.in": {
    name: "Sarvottam Institute of Engineering and Technology",
    slug: "siet-noida",
    city: "Greater Noida",
    type: "Private College",
  },
  "dbrcer.org": {
    name: "Dr. B.R. Ambedkar Institute of Technology",
    slug: "dbrcer-agra",
    city: "Agra",
    type: "Private College",
  },
  "gehu.ac.in": {
    name: "Graphic Era Hill University (UP campus)",
    slug: "gehu-up",
    city: "Greater Noida",
    type: "Private University",
  },
  "sage.ac.in": {
    name: "SAGE University",
    slug: "sage-university",
    city: "Noida",
    type: "Private University",
  },
  "ssr.ac.in": {
    name: "Shri Shankaracharya Group of Institutions",
    slug: "ssr-lucknow",
    city: "Lucknow",
    type: "Private College",
  },

  // ═══════════════════════════════════════════════════════════
  // Medical Universities & Colleges
  // ═══════════════════════════════════════════════════════════
  "kgmu.org": {
    name: "King George's Medical University",
    slug: "kgmu-lucknow",
    city: "Lucknow",
    type: "Medical",
  },
  "sgpgi.ac.in": {
    name: "Sanjay Gandhi Postgraduate Institute of Medical Sciences",
    slug: "sgpgims-lucknow",
    city: "Lucknow",
    type: "Medical",
  },
  "gsvm.ac.in": {
    name: "Ganesh Shankar Vidyarthi Memorial Medical College",
    slug: "gsvm-kanpur",
    city: "Kanpur",
    type: "Medical",
  },
  "rmlimslu.ac.in": {
    name: "Dr. Ram Manohar Lohia Institute of Medical Sciences",
    slug: "rmlims-lucknow",
    city: "Lucknow",
    type: "Medical",
  },
  "brd.ac.in": {
    name: "BRD Medical College",
    slug: "brd-gorakhpur",
    city: "Gorakhpur",
    type: "Medical",
  },
  "snmc.ac.in": {
    name: "SN Medical College Agra",
    slug: "snmc-agra",
    city: "Agra",
    type: "Medical",
  },
  "mlnmc.ac.in": {
    name: "MLN Medical College Prayagraj",
    slug: "mlnmc-prayagraj",
    city: "Prayagraj",
    type: "Medical",
  },
  "tsmclu.ac.in": {
    name: "TS Misra Medical College and Hospital",
    slug: "tsmc-lucknow",
    city: "Lucknow",
    type: "Medical",
  },

  // ═══════════════════════════════════════════════════════════
  // Agricultural Universities
  // ═══════════════════════════════════════════════════════════
  "csauk.ac.in": {
    name: "Chandra Shekhar Azad University of Agriculture and Technology",
    slug: "csauat-kanpur",
    city: "Kanpur",
    type: "Agricultural",
  },
  "nduat.org": {
    name: "Acharya Narendra Deva University of Agriculture and Technology",
    slug: "nduat-ayodhya",
    city: "Ayodhya",
    type: "Agricultural",
  },
  "svpuat.edu.in": {
    name: "Sardar Vallabhbhai Patel University of Agriculture and Technology",
    slug: "svpuat-meerut",
    city: "Meerut",
    type: "Agricultural",
  },
  "buat.edu.in": {
    name: "Banda University of Agriculture and Technology",
    slug: "buat-banda",
    city: "Banda",
    type: "Agricultural",
  },
  "shuats.edu.in": {
    name: "Sam Higginbottom University of Agriculture, Technology and Sciences",
    slug: "shuats-prayagraj",
    city: "Prayagraj",
    type: "Agricultural",
  },

  // ═══════════════════════════════════════════════════════════
  // Law Universities
  // ═══════════════════════════════════════════════════════════
  "rfrlu.ac.in": {
    name: "Ram Manohar Lohiya National Law University",
    slug: "rmlnlu-lucknow",
    city: "Lucknow",
    type: "Law",
  },
  "dsnlu.ac.in": {
    name: "Dr. Shakuntala Misra National Rehabilitation University",
    slug: "dsmru-lucknow",
    city: "Lucknow",
    type: "State University",
  },

  // ═══════════════════════════════════════════════════════════
  // Management Institutes
  // ═══════════════════════════════════════════════════════════
  "iiml.ac.in": {
    name: "Indian Institute of Management Lucknow",
    slug: "iim-lucknow",
    city: "Lucknow",
    type: "Management",
  },
  "iimkashipur.ac.in": {
    name: "Indian Institute of Management Kashipur",
    slug: "iim-kashipur",
    city: "Kashipur",
    type: "Management",
  },

  // ═══════════════════════════════════════════════════════════
  // Additional AKTU affiliated private colleges
  // ═══════════════════════════════════════════════════════════
  "imsec.ac.in": {
    name: "IMS Engineering College",
    slug: "imsec-ghaziabad",
    city: "Ghaziabad",
    type: "Private College",
  },
  "its.edu.in": {
    name: "I.T.S Engineering College",
    slug: "its-greater-noida",
    city: "Greater Noida",
    type: "Private College",
  },
  "dfriet.ac.in": {
    name: "Dronacharya College of Engineering",
    slug: "dce-greater-noida",
    city: "Greater Noida",
    type: "Private College",
  },
  "gcetnoida.ac.in": {
    name: "Greater Noida Institute of Technology",
    slug: "gnit-greater-noida",
    city: "Greater Noida",
    type: "Private College",
  },
  "abesit.in": {
    name: "ABES Institute of Technology",
    slug: "abesit-ghaziabad",
    city: "Ghaziabad",
    type: "Private College",
  },
  "krishnainstitute.com": {
    name: "Krishna Institute of Engineering and Technology",
    slug: "kiet-gzb",
    city: "Ghaziabad",
    type: "Private College",
  },
  "ipcsedu.in": {
    name: "IP College of Engineering and Technology",
    slug: "ipcs-ghaziabad",
    city: "Ghaziabad",
    type: "Private College",
  },
  "himcs.ac.in": {
    name: "Hi-Tech Institute of Engineering and Technology",
    slug: "himcs-lucknow",
    city: "Lucknow",
    type: "Private College",
  },
  "dfrgroup.com": {
    name: "DFR Group of Institutions",
    slug: "dfr-lucknow",
    city: "Lucknow",
    type: "Private College",
  },
  "srmscet.ac.in": {
    name: "SRMS College of Engineering and Technology",
    slug: "srms-bareilly",
    city: "Bareilly",
    type: "Private College",
  },
  "iec.edu.in": {
    name: "IEC Group of Institutions",
    slug: "iec-greater-noida",
    city: "Greater Noida",
    type: "Private College",
  },
  "gniot.ac.in": {
    name: "Greater Noida Institute of Technology",
    slug: "gniot-greater-noida",
    city: "Greater Noida",
    type: "Private College",
  },
  "ucer.ac.in": {
    name: "United College of Engineering and Research",
    slug: "ucer-greater-noida",
    city: "Greater Noida",
    type: "Private College",
  },
  "rfrknit.ac.in": {
    name: "RKG Educational College",
    slug: "rkgec-ghaziabad",
    city: "Ghaziabad",
    type: "Private College",
  },
  "dit.edu.in": {
    name: "DIT University (UP campus)",
    slug: "dit-up",
    city: "Greater Noida",
    type: "Private College",
  },
  "vitbhopal.ac.in": {
    name: "VIT Bhopal (UP campus)",
    slug: "vit-up",
    city: "Greater Noida",
    type: "Private College",
  },
};

/**
 * Extract the domain from an email address.
 * Returns lowercase domain or null if invalid.
 */
export function extractEmailDomain(email: string): string | null {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2 || !parts[1]) return null;
  return parts[1];
}

/**
 * Look up college info from an email address.
 * Returns the CollegeInfo if found, null otherwise.
 */
export function lookupCollegeByEmail(
  email: string
): CollegeInfo | null {
  const domain = extractEmailDomain(email);
  if (!domain) return null;

  // Direct match
  if (COLLEGE_DOMAIN_MAP[domain]) {
    return COLLEGE_DOMAIN_MAP[domain];
  }

  // Try subdomain matching: if email is "user@cs.iitk.ac.in",
  // check "cs.iitk.ac.in", then "iitk.ac.in"
  const parts = domain.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const parentDomain = parts.slice(i).join(".");
    if (COLLEGE_DOMAIN_MAP[parentDomain]) {
      return COLLEGE_DOMAIN_MAP[parentDomain];
    }
  }

  return null;
}

/**
 * Get total number of mapped colleges (unique by slug).
 */
export function getMappedCollegeCount(): number {
  const uniqueSlugs = new Set(
    Object.values(COLLEGE_DOMAIN_MAP).map((c) => c.slug)
  );
  return uniqueSlugs.size;
}

/**
 * Get all unique colleges from the map.
 */
export function getAllMappedColleges(): CollegeInfo[] {
  const seen = new Set<string>();
  const colleges: CollegeInfo[] = [];
  for (const info of Object.values(COLLEGE_DOMAIN_MAP)) {
    if (!seen.has(info.slug)) {
      seen.add(info.slug);
      colleges.push(info);
    }
  }
  return colleges.sort((a, b) => a.name.localeCompare(b.name));
}
