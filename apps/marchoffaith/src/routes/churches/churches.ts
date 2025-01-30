// Types
export interface Address {
  street: string;
  city: string;
}

export interface Social {
  facebook: string;
  instagram: string;
  youtube: string;
}

export interface Contact {
  phone: string;
  email: string;
  social: Social;
}

export interface Service {
  day: string;
  time: string;
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
    name: "Main Campus",
    address: {
      street: "123 Main Street",
      city: "Cityville"
    },
    contact: {
      phone: "(555) 123-4567",
      email: "info@maincampus.church",
      social: {
        facebook: "MainCampusChurch",
        instagram: "@maincampuschurch",
        youtube: "MainCampusChurch"
      }
    },
    services: [
      { day: 'Sunday', time: "09:00", type: "traditional" },
      { day: 'Sunday', time: "11:00", type: "contemporary" },
      { day: 'Wednesday', time: "19:00", type: "bible-study" },
      { day: 'Thursday', time: "18:30", type: "youth" },
      { day: 'Saturday', time: "17:00", type: "prayer" }
    ],
    pastors: [
      { name: "John Smith", role: "Senior Pastor", since: "2018" },
      { name: "Sarah Johnson", role: "Youth Pastor", since: "2020" },
      { name: "Michael Chen", role: "Worship Pastor", since: "2019" }
    ],
    stats: {
      totalMembers: 2500,
      yearFounded: 1985
    }
  },
  {
    id: 2,
    name: "North Valley Community Church",
    address: {
      street: "456 Valley Road",
      city: "Valleytown"
    },
    contact: {
      phone: "(555) 234-5678",
      email: "info@northvalley.church",
      social: {
        facebook: "NorthValleyChurch",
        instagram: "@northvalleychurch",
        youtube: "NorthValleyChurch"
      }
    },
    services: [
      { day: 'Sunday', time: "08:30", type: "traditional" },
      { day: 'Sunday', time: "10:30", type: "family" },
      { day: 'Tuesday', time: "19:00", type: "bible-study" },
      { day: 'Friday', time: "18:00", type: "youth" }
    ],
    pastors: [
      { name: "David Williams", role: "Lead Pastor", since: "2015" },
      { name: "Emily Rodriguez", role: "Children's Pastor", since: "2019" },
      { name: "James Lee", role: "Executive Pastor", since: "2017" }
    ],
    stats: {
      totalMembers: 1800,
      yearFounded: 1992
    }
  },
  {
    id: 3,
    name: "Riverside Fellowship",
    address: {
      street: "789 River Drive",
      city: "Riverside"
    },
    contact: {
      phone: "(555) 345-6789",
      email: "hello@riverside.church",
      social: {
        facebook: "RiversideFellowship",
        instagram: "@riversidefellowship",
        youtube: "RiversideFellowship"
      }
    },
    services: [
      { day: 'Sunday', time: "09:30", type: "blended" },
      { day: 'Sunday', time: "11:30", type: "contemporary" },
      { day: 'Wednesday', time: "18:30", type: "midweek" },
      { day: 'Saturday', time: "18:00", type: "young-adults" }
    ],
    pastors: [
      { name: "Robert Taylor", role: "Senior Pastor", since: "2016" },
      { name: "Lisa Chang", role: "Worship Pastor", since: "2018" },
      { name: "Mark Anderson", role: "Community Pastor", since: "2020" }
    ],
    stats: {
      totalMembers: 2100,
      yearFounded: 1978
    }
  },
  {
    id: 4,
    name: "Grace Harbor Church",
    address: {
      street: "321 Harbor View",
      city: "Harborside"
    },
    contact: {
      phone: "(555) 456-7890",
      email: "contact@graceharbor.church",
      social: {
        facebook: "GraceHarborChurch",
        instagram: "@graceharborchurch",
        youtube: "GraceHarborChurch"
      }
    },
    services: [
      { day: 'Sunday', time: "08:00", type: "traditional" },
      { day: 'Sunday', time: "10:00", type: "contemporary" },
      { day: 'Sunday', time: "17:00", type: "evening" },
      { day: 'Thursday', time: "19:00", type: "bible-study" },
      { day: 'Friday', time: "19:30", type: "youth" }
    ],
    pastors: [
      { name: "Thomas Wilson", role: "Lead Pastor", since: "2014" },
      { name: "Rachel Kim", role: "Family Ministry Pastor", since: "2017" },
      { name: "Daniel Martinez", role: "Teaching Pastor", since: "2019" }
    ],
    stats: {
      totalMembers: 3200,
      yearFounded: 1965
    }
  }
];