// Utility functions for location/airports
// Using REST Countries API (free, reliable) as primary source
// REST Countries: https://restcountries.com/
const REST_COUNTRIES_API = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3'
const AIRPORTS_API_BASE = 'https://airportsapi.com/api'

// Cache for countries and airports to reduce API calls
const countriesCache = {
  data: null,
  timestamp: null,
  ttl: 24 * 60 * 60 * 1000 // 24 hours
}

const airportsCache = {}

// Static list of major airports across popular regions
// Organized by: US/Canada, Europe, Middle East, Asia, LATAM, Africa/Oceania, Caribbean
const TOP_AIRPORTS = [
  // ===== US/Canada =====
  { code: 'JFK', iata_code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States' },
  { code: 'LGA', iata_code: 'LGA', name: 'LaGuardia', city: 'New York', country: 'United States' },
  { code: 'EWR', iata_code: 'EWR', name: 'Newark Liberty International', city: 'Newark', country: 'United States' },
  { code: 'LAX', iata_code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States' },
  { code: 'ORD', iata_code: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'United States' },
  { code: 'MDW', iata_code: 'MDW', name: 'Midway International', city: 'Chicago', country: 'United States' },
  { code: 'DFW', iata_code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'United States' },
  { code: 'ATL', iata_code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'United States' },
  { code: 'MIA', iata_code: 'MIA', name: 'Miami International', city: 'Miami', country: 'United States' },
  { code: 'FLL', iata_code: 'FLL', name: 'Fort Lauderdale-Hollywood International', city: 'Fort Lauderdale', country: 'United States' },
  { code: 'SEA', iata_code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'United States' },
  { code: 'SFO', iata_code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States' },
  { code: 'OAK', iata_code: 'OAK', name: 'Oakland International', city: 'Oakland', country: 'United States' },
  { code: 'SJC', iata_code: 'SJC', name: 'Norman Y. Mineta San Jose International', city: 'San Jose', country: 'United States' },
  { code: 'BOS', iata_code: 'BOS', name: 'Logan International', city: 'Boston', country: 'United States' },
  { code: 'IAD', iata_code: 'IAD', name: 'Dulles International', city: 'Washington', country: 'United States' },
  { code: 'DCA', iata_code: 'DCA', name: 'Ronald Reagan Washington National', city: 'Washington', country: 'United States' },
  { code: 'PHX', iata_code: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', country: 'United States' },
  { code: 'LAS', iata_code: 'LAS', name: 'McCarran International', city: 'Las Vegas', country: 'United States' },
  { code: 'DEN', iata_code: 'DEN', name: 'Denver International', city: 'Denver', country: 'United States' },
  { code: 'IAH', iata_code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'United States' },
  { code: 'HOU', iata_code: 'HOU', name: 'William P. Hobby', city: 'Houston', country: 'United States' },
  { code: 'MSP', iata_code: 'MSP', name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', country: 'United States' },
  { code: 'DTW', iata_code: 'DTW', name: 'Detroit Metropolitan', city: 'Detroit', country: 'United States' },
  { code: 'PHL', iata_code: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', country: 'United States' },
  { code: 'CLT', iata_code: 'CLT', name: 'Charlotte Douglas International', city: 'Charlotte', country: 'United States' },
  { code: 'BWI', iata_code: 'BWI', name: 'Baltimore-Washington International', city: 'Baltimore', country: 'United States' },
  { code: 'SLC', iata_code: 'SLC', name: 'Salt Lake City International', city: 'Salt Lake City', country: 'United States' },
  { code: 'SAN', iata_code: 'SAN', name: 'San Diego International', city: 'San Diego', country: 'United States' },
  { code: 'TPA', iata_code: 'TPA', name: 'Tampa International', city: 'Tampa', country: 'United States' },
  { code: 'MCO', iata_code: 'MCO', name: 'Orlando International', city: 'Orlando', country: 'United States' },
  { code: 'YYZ', iata_code: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada' },
  { code: 'YVR', iata_code: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada' },
  { code: 'YUL', iata_code: 'YUL', name: 'Montréal–Trudeau International', city: 'Montreal', country: 'Canada' },
  { code: 'YYC', iata_code: 'YYC', name: 'Calgary International', city: 'Calgary', country: 'Canada' },
  { code: 'YEG', iata_code: 'YEG', name: 'Edmonton International', city: 'Edmonton', country: 'Canada' },
  { code: 'YOW', iata_code: 'YOW', name: 'Ottawa Macdonald–Cartier International', city: 'Ottawa', country: 'Canada' },
  { code: 'YHZ', iata_code: 'YHZ', name: 'Halifax Stanfield International', city: 'Halifax', country: 'Canada' },
  { code: 'YWG', iata_code: 'YWG', name: 'Winnipeg James Armstrong Richardson International', city: 'Winnipeg', country: 'Canada' },
  
  // ===== Europe =====
  { code: 'LHR', iata_code: 'LHR', name: 'Heathrow', city: 'London', country: 'United Kingdom' },
  { code: 'LGW', iata_code: 'LGW', name: 'Gatwick', city: 'London', country: 'United Kingdom' },
  { code: 'STN', iata_code: 'STN', name: 'Stansted', city: 'London', country: 'United Kingdom' },
  { code: 'LTN', iata_code: 'LTN', name: 'Luton', city: 'London', country: 'United Kingdom' },
  { code: 'MAN', iata_code: 'MAN', name: 'Manchester', city: 'Manchester', country: 'United Kingdom' },
  { code: 'BHX', iata_code: 'BHX', name: 'Birmingham', city: 'Birmingham', country: 'United Kingdom' },
  { code: 'EDI', iata_code: 'EDI', name: 'Edinburgh', city: 'Edinburgh', country: 'United Kingdom' },
  { code: 'GLA', iata_code: 'GLA', name: 'Glasgow', city: 'Glasgow', country: 'United Kingdom' },
  { code: 'DUB', iata_code: 'DUB', name: 'Dublin', city: 'Dublin', country: 'Ireland' },
  { code: 'SNN', iata_code: 'SNN', name: 'Shannon', city: 'Shannon', country: 'Ireland' },
  { code: 'CDG', iata_code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { code: 'ORY', iata_code: 'ORY', name: 'Orly', city: 'Paris', country: 'France' },
  { code: 'NCE', iata_code: 'NCE', name: 'Nice Côte d\'Azur', city: 'Nice', country: 'France' },
  { code: 'LYS', iata_code: 'LYS', name: 'Lyon–Saint-Exupéry', city: 'Lyon', country: 'France' },
  { code: 'MRS', iata_code: 'MRS', name: 'Marseille Provence', city: 'Marseille', country: 'France' },
  { code: 'TLS', iata_code: 'TLS', name: 'Toulouse–Blagnac', city: 'Toulouse', country: 'France' },
  { code: 'FRA', iata_code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany' },
  { code: 'MUC', iata_code: 'MUC', name: 'Munich', city: 'Munich', country: 'Germany' },
  { code: 'DUS', iata_code: 'DUS', name: 'Düsseldorf', city: 'Düsseldorf', country: 'Germany' },
  { code: 'HAM', iata_code: 'HAM', name: 'Hamburg', city: 'Hamburg', country: 'Germany' },
  { code: 'TXL', iata_code: 'TXL', name: 'Berlin Tegel', city: 'Berlin', country: 'Germany' },
  { code: 'SXF', iata_code: 'SXF', name: 'Berlin Schönefeld', city: 'Berlin', country: 'Germany' },
  { code: 'CGN', iata_code: 'CGN', name: 'Cologne/Bonn', city: 'Cologne', country: 'Germany' },
  { code: 'STR', iata_code: 'STR', name: 'Stuttgart', city: 'Stuttgart', country: 'Germany' },
  { code: 'AMS', iata_code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'EIN', iata_code: 'EIN', name: 'Eindhoven', city: 'Eindhoven', country: 'Netherlands' },
  { code: 'MAD', iata_code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas', city: 'Madrid', country: 'Spain' },
  { code: 'BCN', iata_code: 'BCN', name: 'Barcelona–El Prat', city: 'Barcelona', country: 'Spain' },
  { code: 'PMI', iata_code: 'PMI', name: 'Palma de Mallorca', city: 'Palma', country: 'Spain' },
  { code: 'AGP', iata_code: 'AGP', name: 'Málaga', city: 'Málaga', country: 'Spain' },
  { code: 'VLC', iata_code: 'VLC', name: 'Valencia', city: 'Valencia', country: 'Spain' },
  { code: 'SVQ', iata_code: 'SVQ', name: 'Seville', city: 'Seville', country: 'Spain' },
  { code: 'FCO', iata_code: 'FCO', name: 'Leonardo da Vinci–Fiumicino', city: 'Rome', country: 'Italy' },
  { code: 'MXP', iata_code: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy' },
  { code: 'LIN', iata_code: 'LIN', name: 'Milan Linate', city: 'Milan', country: 'Italy' },
  { code: 'VCE', iata_code: 'VCE', name: 'Venice Marco Polo', city: 'Venice', country: 'Italy' },
  { code: 'FLR', iata_code: 'FLR', name: 'Florence', city: 'Florence', country: 'Italy' },
  { code: 'NAP', iata_code: 'NAP', name: 'Naples', city: 'Naples', country: 'Italy' },
  { code: 'PMO', iata_code: 'PMO', name: 'Palermo', city: 'Palermo', country: 'Italy' },
  { code: 'ZRH', iata_code: 'ZRH', name: 'Zurich', city: 'Zurich', country: 'Switzerland' },
  { code: 'GVA', iata_code: 'GVA', name: 'Geneva', city: 'Geneva', country: 'Switzerland' },
  { code: 'VIE', iata_code: 'VIE', name: 'Vienna', city: 'Vienna', country: 'Austria' },
  { code: 'BRU', iata_code: 'BRU', name: 'Brussels', city: 'Brussels', country: 'Belgium' },
  { code: 'CPH', iata_code: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'Denmark' },
  { code: 'ARN', iata_code: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden' },
  { code: 'OSL', iata_code: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway' },
  { code: 'HEL', iata_code: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'Finland' },
  { code: 'LIS', iata_code: 'LIS', name: 'Lisbon', city: 'Lisbon', country: 'Portugal' },
  { code: 'OPO', iata_code: 'OPO', name: 'Porto', city: 'Porto', country: 'Portugal' },
  { code: 'FAO', iata_code: 'FAO', name: 'Faro', city: 'Faro', country: 'Portugal' },
  { code: 'ATH', iata_code: 'ATH', name: 'Athens International', city: 'Athens', country: 'Greece' },
  { code: 'SKG', iata_code: 'SKG', name: 'Thessaloniki', city: 'Thessaloniki', country: 'Greece' },
  { code: 'WAW', iata_code: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', country: 'Poland' },
  { code: 'PRG', iata_code: 'PRG', name: 'Václav Havel Prague', city: 'Prague', country: 'Czech Republic' },
  { code: 'BUD', iata_code: 'BUD', name: 'Budapest Ferenc Liszt', city: 'Budapest', country: 'Hungary' },
  { code: 'OTP', iata_code: 'OTP', name: 'Henri Coandă International', city: 'Bucharest', country: 'Romania' },
  { code: 'SOF', iata_code: 'SOF', name: 'Sofia', city: 'Sofia', country: 'Bulgaria' },
  
  // ===== Middle East =====
  { code: 'DXB', iata_code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates' },
  { code: 'AUH', iata_code: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'United Arab Emirates' },
  { code: 'DWC', iata_code: 'DWC', name: 'Al Maktoum International', city: 'Dubai', country: 'United Arab Emirates' },
  { code: 'SHJ', iata_code: 'SHJ', name: 'Sharjah International', city: 'Sharjah', country: 'United Arab Emirates' },
  { code: 'DOH', iata_code: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar' },
  { code: 'BAH', iata_code: 'BAH', name: 'Bahrain International', city: 'Manama', country: 'Bahrain' },
  { code: 'KWI', iata_code: 'KWI', name: 'Kuwait International', city: 'Kuwait City', country: 'Kuwait' },
  { code: 'RUH', iata_code: 'RUH', name: 'King Khalid International', city: 'Riyadh', country: 'Saudi Arabia' },
  { code: 'JED', iata_code: 'JED', name: 'King Abdulaziz International', city: 'Jeddah', country: 'Saudi Arabia' },
  { code: 'DMM', iata_code: 'DMM', name: 'King Fahd International', city: 'Dammam', country: 'Saudi Arabia' },
  { code: 'AMM', iata_code: 'AMM', name: 'Queen Alia International', city: 'Amman', country: 'Jordan' },
  { code: 'BEY', iata_code: 'BEY', name: 'Beirut–Rafic Hariri International', city: 'Beirut', country: 'Lebanon' },
  { code: 'TLV', iata_code: 'TLV', name: 'Ben Gurion', city: 'Tel Aviv', country: 'Israel' },
  { code: 'IST', iata_code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
  { code: 'SAW', iata_code: 'SAW', name: 'Istanbul Sabiha Gökçen', city: 'Istanbul', country: 'Turkey' },
  { code: 'ANK', iata_code: 'ANK', name: 'Ankara Esenboğa', city: 'Ankara', country: 'Turkey' },
  { code: 'AYT', iata_code: 'AYT', name: 'Antalya', city: 'Antalya', country: 'Turkey' },
  { code: 'BGW', iata_code: 'BGW', name: 'Baghdad International', city: 'Baghdad', country: 'Iraq' },
  { code: 'THR', iata_code: 'IKA', name: 'Imam Khomeini International', city: 'Tehran', country: 'Iran' },
  
  // ===== Asia =====
  { code: 'HKG', iata_code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'China' },
  { code: 'PEK', iata_code: 'PEK', name: 'Beijing Capital', city: 'Beijing', country: 'China' },
  { code: 'PKX', iata_code: 'PKX', name: 'Beijing Daxing International', city: 'Beijing', country: 'China' },
  { code: 'PVG', iata_code: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai', country: 'China' },
  { code: 'SHA', iata_code: 'SHA', name: 'Shanghai Hongqiao', city: 'Shanghai', country: 'China' },
  { code: 'CAN', iata_code: 'CAN', name: 'Guangzhou Baiyun International', city: 'Guangzhou', country: 'China' },
  { code: 'SZX', iata_code: 'SZX', name: 'Shenzhen Bao\'an International', city: 'Shenzhen', country: 'China' },
  { code: 'CTU', iata_code: 'CTU', name: 'Chengdu Shuangliu International', city: 'Chengdu', country: 'China' },
  { code: 'XIY', iata_code: 'XIY', name: 'Xi\'an Xianyang International', city: 'Xi\'an', country: 'China' },
  { code: 'KMG', iata_code: 'KMG', name: 'Kunming Changshui International', city: 'Kunming', country: 'China' },
  { code: 'NRT', iata_code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan' },
  { code: 'HND', iata_code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'Japan' },
  { code: 'KIX', iata_code: 'KIX', name: 'Kansai International', city: 'Osaka', country: 'Japan' },
  { code: 'NGO', iata_code: 'NGO', name: 'Chubu Centrair International', city: 'Nagoya', country: 'Japan' },
  { code: 'FUK', iata_code: 'FUK', name: 'Fukuoka', city: 'Fukuoka', country: 'Japan' },
  { code: 'CTS', iata_code: 'CTS', name: 'New Chitose', city: 'Sapporo', country: 'Japan' },
  { code: 'ICN', iata_code: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea' },
  { code: 'GMP', iata_code: 'GMP', name: 'Gimpo International', city: 'Seoul', country: 'South Korea' },
  { code: 'PUS', iata_code: 'PUS', name: 'Gimhae International', city: 'Busan', country: 'South Korea' },
  { code: 'SIN', iata_code: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore' },
  { code: 'BKK', iata_code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand' },
  { code: 'DMK', iata_code: 'DMK', name: 'Don Mueang International', city: 'Bangkok', country: 'Thailand' },
  { code: 'HKT', iata_code: 'HKT', name: 'Phuket International', city: 'Phuket', country: 'Thailand' },
  { code: 'KUL', iata_code: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'CGK', iata_code: 'CGK', name: 'Soekarno–Hatta International', city: 'Jakarta', country: 'Indonesia' },
  { code: 'DPS', iata_code: 'DPS', name: 'Ngurah Rai International', city: 'Denpasar', country: 'Indonesia' },
  { code: 'MNL', iata_code: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines' },
  { code: 'CRK', iata_code: 'CRK', name: 'Clark International', city: 'Angeles', country: 'Philippines' },
  { code: 'HAN', iata_code: 'HAN', name: 'Noi Bai International', city: 'Hanoi', country: 'Vietnam' },
  { code: 'SGN', iata_code: 'SGN', name: 'Tan Son Nhat International', city: 'Ho Chi Minh City', country: 'Vietnam' },
  { code: 'DEL', iata_code: 'DEL', name: 'Indira Gandhi International', city: 'New Delhi', country: 'India' },
  { code: 'BOM', iata_code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India' },
  { code: 'BLR', iata_code: 'BLR', name: 'Kempegowda International', city: 'Bangalore', country: 'India' },
  { code: 'MAA', iata_code: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India' },
  { code: 'CCU', iata_code: 'CCU', name: 'Netaji Subhas Chandra Bose International', city: 'Kolkata', country: 'India' },
  { code: 'HYD', iata_code: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'India' },
  { code: 'DAC', iata_code: 'DAC', name: 'Hazrat Shahjalal International', city: 'Dhaka', country: 'Bangladesh' },
  { code: 'CMB', iata_code: 'CMB', name: 'Bandaranaike International', city: 'Colombo', country: 'Sri Lanka' },
  { code: 'KTM', iata_code: 'KTM', name: 'Tribhuvan International', city: 'Kathmandu', country: 'Nepal' },
  { code: 'ISB', iata_code: 'ISB', name: 'Islamabad International', city: 'Islamabad', country: 'Pakistan' },
  { code: 'KHI', iata_code: 'KHI', name: 'Jinnah International', city: 'Karachi', country: 'Pakistan' },
  { code: 'LHE', iata_code: 'LHE', name: 'Allama Iqbal International', city: 'Lahore', country: 'Pakistan' },
  
  // ===== LATAM (Latin America) =====
  { code: 'GRU', iata_code: 'GRU', name: 'São Paulo–Guarulhos', city: 'São Paulo', country: 'Brazil' },
  { code: 'CGH', iata_code: 'CGH', name: 'São Paulo–Congonhas', city: 'São Paulo', country: 'Brazil' },
  { code: 'GIG', iata_code: 'GIG', name: 'Rio de Janeiro–Galeão', city: 'Rio de Janeiro', country: 'Brazil' },
  { code: 'SDU', iata_code: 'SDU', name: 'Rio de Janeiro–Santos Dumont', city: 'Rio de Janeiro', country: 'Brazil' },
  { code: 'BSB', iata_code: 'BSB', name: 'Brasília International', city: 'Brasília', country: 'Brazil' },
  { code: 'BEL', iata_code: 'BEL', name: 'Val de Cans International', city: 'Belém', country: 'Brazil' },
  { code: 'FOR', iata_code: 'FOR', name: 'Pinto Martins International', city: 'Fortaleza', country: 'Brazil' },
  { code: 'REC', iata_code: 'REC', name: 'Recife/Guararapes–Gilberto Freyre International', city: 'Recife', country: 'Brazil' },
  { code: 'SSA', iata_code: 'SSA', name: 'Deputado Luís Eduardo Magalhães International', city: 'Salvador', country: 'Brazil' },
  { code: 'POA', iata_code: 'POA', name: 'Salgado Filho International', city: 'Porto Alegre', country: 'Brazil' },
  { code: 'EZE', iata_code: 'EZE', name: 'Ministro Pistarini', city: 'Buenos Aires', country: 'Argentina' },
  { code: 'AEP', iata_code: 'AEP', name: 'Jorge Newbery Airfield', city: 'Buenos Aires', country: 'Argentina' },
  { code: 'COR', iata_code: 'COR', name: 'Ingeniero Ambrosio L.V. Taravella International', city: 'Córdoba', country: 'Argentina' },
  { code: 'MDZ', iata_code: 'MDZ', name: 'El Plumerillo International', city: 'Mendoza', country: 'Argentina' },
  { code: 'MEX', iata_code: 'MEX', name: 'Mexico City International', city: 'Mexico City', country: 'Mexico' },
  { code: 'CUN', iata_code: 'CUN', name: 'Cancún International', city: 'Cancun', country: 'Mexico' },
  { code: 'GDL', iata_code: 'GDL', name: 'Miguel Hidalgo y Costilla Guadalajara International', city: 'Guadalajara', country: 'Mexico' },
  { code: 'MTY', iata_code: 'MTY', name: 'General Mariano Escobedo International', city: 'Monterrey', country: 'Mexico' },
  { code: 'TIJ', iata_code: 'TIJ', name: 'General Abelardo L. Rodríguez International', city: 'Tijuana', country: 'Mexico' },
  { code: 'SCL', iata_code: 'SCL', name: 'Arturo Merino Benítez', city: 'Santiago', country: 'Chile' },
  { code: 'LIM', iata_code: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'Peru' },
  { code: 'BOG', iata_code: 'BOG', name: 'El Dorado International', city: 'Bogotá', country: 'Colombia' },
  { code: 'MDE', iata_code: 'MDE', name: 'José María Córdova International', city: 'Medellín', country: 'Colombia' },
  { code: 'CLO', iata_code: 'CLO', name: 'Alfonso Bonilla Aragón International', city: 'Cali', country: 'Colombia' },
  { code: 'UIO', iata_code: 'UIO', name: 'Mariscal Sucre International', city: 'Quito', country: 'Ecuador' },
  { code: 'GYE', iata_code: 'GYE', name: 'José Joaquín de Olmedo International', city: 'Guayaquil', country: 'Ecuador' },
  { code: 'CCS', iata_code: 'CCS', name: 'Simón Bolívar International', city: 'Caracas', country: 'Venezuela' },
  { code: 'PTY', iata_code: 'PTY', name: 'Tocumen International', city: 'Panama City', country: 'Panama' },
  { code: 'SJO', iata_code: 'SJO', name: 'Juan Santamaría International', city: 'San José', country: 'Costa Rica' },
  { code: 'SAL', iata_code: 'SAL', name: 'Monseñor Óscar Arnulfo Romero International', city: 'San Salvador', country: 'El Salvador' },
  { code: 'GUA', iata_code: 'GUA', name: 'La Aurora International', city: 'Guatemala City', country: 'Guatemala' },
  { code: 'TGU', iata_code: 'TGU', name: 'Toncontín International', city: 'Tegucigalpa', country: 'Honduras' },
  { code: 'HAV', iata_code: 'HAV', name: 'José Martí International', city: 'Havana', country: 'Cuba' },
  { code: 'VRA', iata_code: 'VRA', name: 'Juan Gualberto Gómez', city: 'Varadero', country: 'Cuba' },
  
  // ===== Africa/Oceania =====
  { code: 'JNB', iata_code: 'JNB', name: 'O. R. Tambo', city: 'Johannesburg', country: 'South Africa' },
  { code: 'CPT', iata_code: 'CPT', name: 'Cape Town', city: 'Cape Town', country: 'South Africa' },
  { code: 'DUR', iata_code: 'DUR', name: 'King Shaka International', city: 'Durban', country: 'South Africa' },
  { code: 'CAI', iata_code: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'Egypt' },
  { code: 'HRG', iata_code: 'HRG', name: 'Hurghada International', city: 'Hurghada', country: 'Egypt' },
  { code: 'SSH', iata_code: 'SSH', name: 'Sharm El Sheikh International', city: 'Sharm El Sheikh', country: 'Egypt' },
  { code: 'CMN', iata_code: 'CMN', name: 'Mohammed V International', city: 'Casablanca', country: 'Morocco' },
  { code: 'RBA', iata_code: 'RBA', name: 'Rabat–Salé', city: 'Rabat', country: 'Morocco' },
  { code: 'TUN', iata_code: 'TUN', name: 'Tunis–Carthage International', city: 'Tunis', country: 'Tunisia' },
  { code: 'ALG', iata_code: 'ALG', name: 'Houari Boumediene', city: 'Algiers', country: 'Algeria' },
  { code: 'NBO', iata_code: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya' },
  { code: 'MBA', iata_code: 'MBA', name: 'Moi International', city: 'Mombasa', country: 'Kenya' },
  { code: 'ADD', iata_code: 'ADD', name: 'Bole International', city: 'Addis Ababa', country: 'Ethiopia' },
  { code: 'LOS', iata_code: 'LOS', name: 'Murtala Muhammed International', city: 'Lagos', country: 'Nigeria' },
  { code: 'ABV', iata_code: 'ABV', name: 'Nnamdi Azikiwe International', city: 'Abuja', country: 'Nigeria' },
  { code: 'DKR', iata_code: 'DKR', name: 'Blaise Diagne International', city: 'Dakar', country: 'Senegal' },
  { code: 'ACC', iata_code: 'ACC', name: 'Kotoka International', city: 'Accra', country: 'Ghana' },
  { code: 'SYD', iata_code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'Australia' },
  { code: 'MEL', iata_code: 'MEL', name: 'Melbourne', city: 'Melbourne', country: 'Australia' },
  { code: 'BNE', iata_code: 'BNE', name: 'Brisbane', city: 'Brisbane', country: 'Australia' },
  { code: 'PER', iata_code: 'PER', name: 'Perth', city: 'Perth', country: 'Australia' },
  { code: 'ADL', iata_code: 'ADL', name: 'Adelaide', city: 'Adelaide', country: 'Australia' },
  { code: 'OOL', iata_code: 'OOL', name: 'Gold Coast', city: 'Gold Coast', country: 'Australia' },
  { code: 'CNS', iata_code: 'CNS', name: 'Cairns', city: 'Cairns', country: 'Australia' },
  { code: 'AKL', iata_code: 'AKL', name: 'Auckland', city: 'Auckland', country: 'New Zealand' },
  { code: 'WLG', iata_code: 'WLG', name: 'Wellington', city: 'Wellington', country: 'New Zealand' },
  { code: 'CHC', iata_code: 'CHC', name: 'Christchurch', city: 'Christchurch', country: 'New Zealand' },
  { code: 'NAN', iata_code: 'NAN', name: 'Nadi International', city: 'Nadi', country: 'Fiji' },
  { code: 'PPT', iata_code: 'PPT', name: 'Faa\'a International', city: 'Papeete', country: 'French Polynesia' },
  
  // ===== Caribbean =====
  { code: 'SJU', iata_code: 'SJU', name: 'Luis Muñoz Marín International', city: 'San Juan', country: 'Puerto Rico' },
  { code: 'NAS', iata_code: 'NAS', name: 'Lynden Pindling International', city: 'Nassau', country: 'Bahamas' },
  { code: 'FPO', iata_code: 'FPO', name: 'Grand Bahama International', city: 'Freeport', country: 'Bahamas' },
  { code: 'MBJ', iata_code: 'MBJ', name: 'Sangster International', city: 'Montego Bay', country: 'Jamaica' },
  { code: 'KIN', iata_code: 'KIN', name: 'Norman Manley International', city: 'Kingston', country: 'Jamaica' },
  { code: 'SDQ', iata_code: 'SDQ', name: 'Las Américas International', city: 'Santo Domingo', country: 'Dominican Republic' },
  { code: 'PUJ', iata_code: 'PUJ', name: 'Punta Cana International', city: 'Punta Cana', country: 'Dominican Republic' },
  { code: 'POP', iata_code: 'POP', name: 'Gregorio Luperón International', city: 'Puerto Plata', country: 'Dominican Republic' },
  { code: 'SXM', iata_code: 'SXM', name: 'Princess Juliana International', city: 'Philipsburg', country: 'Sint Maarten' },
  { code: 'AUA', iata_code: 'AUA', name: 'Queen Beatrix International', city: 'Oranjestad', country: 'Aruba' },
  { code: 'CUR', iata_code: 'CUR', name: 'Hato International', city: 'Willemstad', country: 'Curaçao' },
  { code: 'BGI', iata_code: 'BGI', name: 'Grantley Adams International', city: 'Bridgetown', country: 'Barbados' },
  { code: 'POS', iata_code: 'POS', name: 'Piarco International', city: 'Port of Spain', country: 'Trinidad and Tobago' },
  { code: 'GND', iata_code: 'GND', name: 'Maurice Bishop International', city: 'St. George\'s', country: 'Grenada' },
  { code: 'SKB', iata_code: 'SKB', name: 'Robert L. Bradshaw International', city: 'Basseterre', country: 'Saint Kitts and Nevis' },
  { code: 'SLU', iata_code: 'SLU', name: 'Hewanorra International', city: 'Vieux Fort', country: 'Saint Lucia' },
  { code: 'UVF', iata_code: 'UVF', name: 'Hewanorra International', city: 'Vieux Fort', country: 'Saint Lucia' },
  { code: 'BQN', iata_code: 'BQN', name: 'Rafael Hernández', city: 'Aguadilla', country: 'Puerto Rico' },
  { code: 'STI', iata_code: 'STI', name: 'Cibao International', city: 'Santiago', country: 'Dominican Republic' },
  { code: 'GCM', iata_code: 'GCM', name: 'Owen Roberts International', city: 'George Town', country: 'Cayman Islands' },
  { code: 'PLS', iata_code: 'PLS', name: 'Providenciales International', city: 'Providenciales', country: 'Turks and Caicos Islands' }
]

/**
 * Fetch all countries from REST Countries API (primary).
 * Falls back to a static list if the API is unavailable.
 */
export async function fetchCountries() {
  // Check cache first
  if (countriesCache.data && countriesCache.timestamp) {
    const age = Date.now() - countriesCache.timestamp
    if (age < countriesCache.ttl) {
      return countriesCache.data
    }
  }

  // Try REST Countries API first (most reliable, free, no API key needed)
  try {
    const response = await fetch(REST_COUNTRIES_API, {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      
      if (Array.isArray(data) && data.length > 0) {
        // Transform REST Countries format to our format
        const countries = data
          .map(country => ({
            code: country.cca2 || country.cca3 || '',
            name: country.name?.common || country.name?.official || '',
            ...country
          }))
          .filter(c => c.code && c.name)
          .sort((a, b) => a.name.localeCompare(b.name))
        
        if (countries.length > 0) {
          countriesCache.data = countries
          countriesCache.timestamp = Date.now()
          return countries
        }
      }
    }
  } catch (error) {
    // Silently fail and use fallback below
  }

  // Fallback to static list if all API calls fail
  const fallbackCountries = getFallbackCountries()
  countriesCache.data = fallbackCountries
  countriesCache.timestamp = Date.now()
  return fallbackCountries
}

/**
 * Search airports by query (name, code, or city)
 */
export async function searchAirports(query) {
  if (!query || query.length < 2) return []

  const cacheKey = query.toLowerCase()
  if (airportsCache[cacheKey]) return airportsCache[cacheKey]

  const q = query.toLowerCase()
  const results = TOP_AIRPORTS.filter(a => {
    return (
      (a.iata_code && a.iata_code.toLowerCase().includes(q)) ||
      (a.code && a.code.toLowerCase().includes(q)) ||
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.city && a.city.toLowerCase().includes(q)) ||
      (a.country && a.country.toLowerCase().includes(q))
    )
  }).slice(0, 15) // limit for UI

  airportsCache[cacheKey] = results
  return results
}

/**
 * Get airports by country code
 */
export async function getAirportsByCountry(countryCode) {
  if (!countryCode) return []
  const cacheKey = `country_${countryCode.toUpperCase()}`
  if (airportsCache[cacheKey]) return airportsCache[cacheKey]

  const results = TOP_AIRPORTS.filter(a => a.country && a.country.toLowerCase().startsWith(countryCode.toLowerCase()))
  airportsCache[cacheKey] = results
  return results
}

/**
 * Fallback list of common countries if API fails
 */
function getFallbackCountries() {
  return [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'PT', name: 'Portugal' },
    { code: 'GR', name: 'Greece' },
    { code: 'TR', name: 'Turkey' },
    { code: 'EG', name: 'Egypt' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'TH', name: 'Thailand' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'BR', name: 'Brazil' },
    { code: 'AR', name: 'Argentina' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KE', name: 'Kenya' }
  ]
}

/**
 * Format airport display name
 */
export function formatAirport(airport) {
  if (!airport) return ''
  
  // Handle different API response formats
  if (typeof airport === 'string') {
    return airport
  }
  
  if (airport.iata_code && airport.name) {
    return `${airport.iata_code} - ${airport.name}`
  }
  
  if (airport.code && airport.name) {
    return `${airport.code} - ${airport.name}`
  }
  
  return airport.name || airport.code || airport.iata_code || ''
}

