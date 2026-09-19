/**
 * Authoritative Centralized List of Active Banking Institutions in India
 * Grounded in current Reserve Bank of India (RBI) records.
 *
 * Categorized into:
 * 1. Public Sector Banks (12 surviving banks after national consolidation)
 * 2. Private Sector Banks (21 scheduled commercial banks)
 * 3. Small Finance Banks (11 active SFBs)
 * 4. Payments Banks (5 active payments banks)
 * 5. Foreign Banks Operating in India (19 key institutions)
 * 6. Regional Rural Banks (43 amalgamated RRBs)
 *
 * Plus standard fallback: "Other / Bank not listed"
 */

export const BANK_CATEGORIES = [
  "All Banks",
  "Public Sector Banks",
  "Private Sector Banks",
  "Small Finance Banks",
  "Payments Banks",
  "Foreign Banks",
  "Regional Rural Banks",
];

export const OTHER_BANK_OPTION = "Other / Bank not listed";

export const INDIAN_BANKS = [
  // 1. Public Sector Banks (12)
  { name: "Bank of Baroda", category: "Public Sector Banks" },
  { name: "Bank of India", category: "Public Sector Banks" },
  { name: "Bank of Maharashtra", category: "Public Sector Banks" },
  { name: "Canara Bank", category: "Public Sector Banks" },
  { name: "Central Bank of India", category: "Public Sector Banks" },
  { name: "Indian Bank", category: "Public Sector Banks" },
  { name: "Indian Overseas Bank", category: "Public Sector Banks" },
  { name: "Punjab National Bank", category: "Public Sector Banks" },
  { name: "Punjab & Sind Bank", category: "Public Sector Banks" },
  { name: "State Bank of India", category: "Public Sector Banks" },
  { name: "UCO Bank", category: "Public Sector Banks" },
  { name: "Union Bank of India", category: "Public Sector Banks" },

  // 2. Private Sector Banks (21)
  { name: "Axis Bank", category: "Private Sector Banks" },
  { name: "Bandhan Bank", category: "Private Sector Banks" },
  { name: "CSB Bank", category: "Private Sector Banks" },
  { name: "City Union Bank", category: "Private Sector Banks" },
  { name: "DCB Bank", category: "Private Sector Banks" },
  { name: "Dhanlaxmi Bank", category: "Private Sector Banks" },
  { name: "Federal Bank", category: "Private Sector Banks" },
  { name: "HDFC Bank", category: "Private Sector Banks" },
  { name: "ICICI Bank", category: "Private Sector Banks" },
  { name: "IDBI Bank", category: "Private Sector Banks" },
  { name: "IDFC FIRST Bank", category: "Private Sector Banks" },
  { name: "IndusInd Bank", category: "Private Sector Banks" },
  { name: "Jammu & Kashmir Bank", category: "Private Sector Banks" },
  { name: "Karnataka Bank", category: "Private Sector Banks" },
  { name: "Karur Vysya Bank", category: "Private Sector Banks" },
  { name: "Kotak Mahindra Bank", category: "Private Sector Banks" },
  { name: "Nainital Bank", category: "Private Sector Banks" },
  { name: "RBL Bank", category: "Private Sector Banks" },
  { name: "South Indian Bank", category: "Private Sector Banks" },
  { name: "Tamilnad Mercantile Bank", category: "Private Sector Banks" },
  { name: "Yes Bank", category: "Private Sector Banks" },

  // 3. Small Finance Banks (11)
  { name: "AU Small Finance Bank", category: "Small Finance Banks" },
  { name: "Capital Small Finance Bank", category: "Small Finance Banks" },
  { name: "Equitas Small Finance Bank", category: "Small Finance Banks" },
  { name: "ESAF Small Finance Bank", category: "Small Finance Banks" },
  { name: "Jana Small Finance Bank", category: "Small Finance Banks" },
  { name: "North East Small Finance Bank", category: "Small Finance Banks" },
  { name: "Shivalik Small Finance Bank", category: "Small Finance Banks" },
  { name: "Suryoday Small Finance Bank", category: "Small Finance Banks" },
  { name: "Ujjivan Small Finance Bank", category: "Small Finance Banks" },
  { name: "Unity Small Finance Bank", category: "Small Finance Banks" },
  { name: "Utkarsh Small Finance Bank", category: "Small Finance Banks" },

  // 4. Payments Banks (5)
  { name: "Airtel Payments Bank", category: "Payments Banks" },
  { name: "Fino Payments Bank", category: "Payments Banks" },
  { name: "India Post Payments Bank", category: "Payments Banks" },
  { name: "Jio Payments Bank", category: "Payments Banks" },
  { name: "NSDL Payments Bank", category: "Payments Banks" },

  // 5. Foreign Banks Operating in India (19)
  { name: "American Express Banking Corp.", category: "Foreign Banks" },
  { name: "Bank of America", category: "Foreign Banks" },
  { name: "Barclays Bank PLC", category: "Foreign Banks" },
  { name: "BNP Paribas", category: "Foreign Banks" },
  { name: "Citibank N.A.", category: "Foreign Banks" },
  { name: "Credit Agricole Corporate and Investment Bank", category: "Foreign Banks" },
  { name: "DBS Bank India", category: "Foreign Banks" },
  { name: "Deutsche Bank AG", category: "Foreign Banks" },
  { name: "Emirates NBD Bank PJSC", category: "Foreign Banks" },
  { name: "First Abu Dhabi Bank PJSC", category: "Foreign Banks" },
  { name: "HSBC India", category: "Foreign Banks" },
  { name: "J.P. Morgan Chase Bank N.A.", category: "Foreign Banks" },
  { name: "Mizuho Bank Ltd.", category: "Foreign Banks" },
  { name: "MUFG Bank Ltd.", category: "Foreign Banks" },
  { name: "Qatar National Bank", category: "Foreign Banks" },
  { name: "SBM Bank (India) Ltd.", category: "Foreign Banks" },
  { name: "Societe Generale", category: "Foreign Banks" },
  { name: "Standard Chartered Bank", category: "Foreign Banks" },
  { name: "Sumitomo Mitsui Banking Corporation", category: "Foreign Banks" },

  // 6. Regional Rural Banks (RRBs) (43)
  { name: "Andhra Pradesh Grameena Vikas Bank", category: "Regional Rural Banks" },
  { name: "Andhra Pragathi Grameena Bank", category: "Regional Rural Banks" },
  { name: "Arunachal Pradesh Rural Bank", category: "Regional Rural Banks" },
  { name: "Aryavart Bank", category: "Regional Rural Banks" },
  { name: "Assam Gramin Vikash Bank", category: "Regional Rural Banks" },
  { name: "Bangiya Gramin Vikash Bank", category: "Regional Rural Banks" },
  { name: "Baroda Gujarat Gramin Bank", category: "Regional Rural Banks" },
  { name: "Baroda Rajasthan Kshetriya Gramin Bank", category: "Regional Rural Banks" },
  { name: "Baroda UP Bank", category: "Regional Rural Banks" },
  { name: "Chaitanya Godavari Grameena Bank", category: "Regional Rural Banks" },
  { name: "Chhattisgarh Rajya Gramin Bank", category: "Regional Rural Banks" },
  { name: "Dakshin Bihar Gramin Bank", category: "Regional Rural Banks" },
  { name: "Ellaquai Dehati Bank", category: "Regional Rural Banks" },
  { name: "Himachal Pradesh Gramin Bank", category: "Regional Rural Banks" },
  { name: "J&K Grameen Bank", category: "Regional Rural Banks" },
  { name: "Jharkhand Rajya Gramin Bank", category: "Regional Rural Banks" },
  { name: "Karnataka Gramin Bank", category: "Regional Rural Banks" },
  { name: "Karnataka Vikas Grameena Bank", category: "Regional Rural Banks" },
  { name: "Kerala Gramin Bank", category: "Regional Rural Banks" },
  { name: "Madhya Pradesh Gramin Bank", category: "Regional Rural Banks" },
  { name: "Madhyanchal Gramin Bank", category: "Regional Rural Banks" },
  { name: "Maharashtra Gramin Bank", category: "Regional Rural Banks" },
  { name: "Manipur Rural Bank", category: "Regional Rural Banks" },
  { name: "Meghalaya Rural Bank", category: "Regional Rural Banks" },
  { name: "Mizoram Rural Bank", category: "Regional Rural Banks" },
  { name: "Nagaland Rural Bank", category: "Regional Rural Banks" },
  { name: "Odisha Gramya Bank", category: "Regional Rural Banks" },
  { name: "Paschim Banga Gramin Bank", category: "Regional Rural Banks" },
  { name: "Prathama UP Gramin Bank", category: "Regional Rural Banks" },
  { name: "Puduvai Bharathiar Grama Bank", category: "Regional Rural Banks" },
  { name: "Punjab Gramin Bank", category: "Regional Rural Banks" },
  { name: "Rajasthan Marudhara Gramin Bank", category: "Regional Rural Banks" },
  { name: "Saptagiri Grameena Bank", category: "Regional Rural Banks" },
  { name: "Sarva Haryana Gramin Bank", category: "Regional Rural Banks" },
  { name: "Saurashtra Gramin Bank", category: "Regional Rural Banks" },
  { name: "Tamil Nadu Grama Bank", category: "Regional Rural Banks" },
  { name: "Telangana Grameena Bank", category: "Regional Rural Banks" },
  { name: "Tripura Gramin Bank", category: "Regional Rural Banks" },
  { name: "Utkal Grameen Bank", category: "Regional Rural Banks" },
  { name: "Uttar Bihar Gramin Bank", category: "Regional Rural Banks" },
  { name: "Uttarakhand Gramin Bank", category: "Regional Rural Banks" },
  { name: "Uttarbanga Kshetriya Gramin Bank", category: "Regional Rural Banks" },
  { name: "Vidharbha Konkan Gramin Bank", category: "Regional Rural Banks" },
];

/**
 * Returns all active banks sorted alphabetically, with the option to filter by category and/or query.
 */
export function getFilteredBanks(category = "All Banks", searchQuery = "") {
  const query = searchQuery.trim().toLowerCase();
  return INDIAN_BANKS.filter((bank) => {
    const matchesCategory =
      category === "All Banks" || bank.category === category;
    const matchesQuery =
      !query || bank.name.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  }).sort((a, b) => a.name.localeCompare(b.name));
}
