// Types
export interface Address {
  street: string;
  city: string;
  province: string;
}

export interface Social {
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

export interface Contact {
  phone: string;
  email: string;
  social: Social;
}

export interface Service {
  day: string;
  time: string; // Now supports ranges like "9:00 AM - 11:00 AM"
  type: string;
}

export interface Pastor {
  name: string;
  role: string;
  since: string;
}

export interface Stats {
  totalMembers: number;
  yearFounded: number;
}

export interface Church {
  id: number;
  name: string;
  address: Address;
  contact: Contact;
  services: Service[];
  pastors: Pastor[];
  stats: Stats;
}

// Data
export const churches: Church[] = [
  {
    id: 1,
    name: "March of Faith Tagbilaran",
    address: {
      street: "Tagbilaran City",
      city: "Tagbilaran City",
      province: "Bohol"
    },
    contact: {
      phone: "(038) 411-1234",
      email: "tagbilaran@marchoffaith.org",
      social: {
        facebook: "MOFTagbilaran"
      }
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" },
      { day: 'Wednesday', time: "6:00 PM - 7:30 PM", type: "Midweek Service" }
    ],
    pastors: [
      { name: "Ptr. Ralph Steven D. Trigo", role: "Senior Pastor", since: "2010" }
    ],
    stats: {
      totalMembers: 500,
      yearFounded: 1974
    }
  },
  {
    id: 2,
    name: "March of Faith Triple Union",
    address: {
      street: "Triple Union",
      city: "Catigbian",
      province: "Bohol"
    },
    contact: {
      phone: "0912-345-6789",
      email: "tripleunion@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 120,
      yearFounded: 1980
    }
  },
  {
    id: 3,
    name: "March of Faith Caningag",
    address: {
      street: "Caningag",
      city: "Alicia",
      province: "Bohol"
    },
    contact: {
      phone: "0912-345-6789",
      email: "caningag@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 80,
      yearFounded: 1985
    }
  },
  {
    id: 4,
    name: "March of Faith Libertad",
    address: {
      street: "Libertad",
      city: "Tubigon",
      province: "Bohol"
    },
    contact: {
      phone: "0912-345-6789",
      email: "libertad@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 100,
      yearFounded: 1990
    }
  },
  {
    id: 5,
    name: "March of Faith Ajong",
    address: {
      street: "Ajong",
      city: "Sibulan",
      province: "Negros Oriental"
    },
    contact: {
      phone: "0912-345-6789",
      email: "ajong@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 150,
      yearFounded: 1995
    }
  },
  {
    id: 6,
    name: "March of Faith Poblacion Sibulan",
    address: {
      street: "Poblacion",
      city: "Sibulan",
      province: "Negros Oriental"
    },
    contact: {
      phone: "0912-345-6789",
      email: "sibulan@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 200,
      yearFounded: 1998
    }
  },
  {
    id: 7,
    name: "March of Faith Magatas",
    address: {
      street: "Magatas",
      city: "Sibulan",
      province: "Negros Oriental"
    },
    contact: {
      phone: "0912-345-6789",
      email: "magatas@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 100,
      yearFounded: 2000
    }
  },
  {
    id: 8,
    name: "March of Faith Pinucawan",
    address: {
      street: "Pinucawan",
      city: "Tayasan",
      province: "Negros Oriental"
    },
    contact: {
      phone: "0912-345-6789",
      email: "pinucawan@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 80,
      yearFounded: 2005
    }
  },
  {
    id: 9,
    name: "March of Faith Cambaye",
    address: {
      street: "Cambaye",
      city: "Tayasan",
      province: "Negros Oriental"
    },
    contact: {
      phone: "0912-345-6789",
      email: "cambaye@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 70,
      yearFounded: 2008
    }
  },
  {
    id: 10,
    name: "March of Faith Linao",
    address: {
      street: "Linao",
      city: "Tayasan",
      province: "Negros Oriental"
    },
    contact: {
      phone: "0912-345-6789",
      email: "linao@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 60,
      yearFounded: 2010
    }
  },
  {
    id: 11,
    name: "March of Faith Dumaguete",
    address: {
      street: "Dumaguete City",
      city: "Dumaguete City",
      province: "Negros Oriental"
    },
    contact: {
      phone: "0912-345-6789",
      email: "dumaguete@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 300,
      yearFounded: 2015
    }
  },
  {
    id: 12,
    name: "March of Faith Bolisong",
    address: {
      street: "Bolisong",
      city: "Manjuyod",
      province: "Negros Oriental"
    },
    contact: {
      phone: "0912-345-6789",
      email: "bolisong@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 90,
      yearFounded: 2018
    }
  },
  {
    id: 13,
    name: "March of Faith Manlawaan",
    address: {
      street: "Manlawaan",
      city: "Sta. Catalina",
      province: "Negros Oriental"
    },
    contact: {
      phone: "0912-345-6789",
      email: "manlawaan@marchoffaith.org",
      social: {}
    },
    services: [
      { day: 'Sunday', time: "9:00 AM - 11:00 AM", type: "Worship Service" }
    ],
    pastors: [
      { name: "TBA", role: "Resident Pastor", since: "2024" }
    ],
    stats: {
      totalMembers: 50,
      yearFounded: 2020
    }
  }
];