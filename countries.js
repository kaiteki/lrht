/* ---- Quiz data (countries and territories) ----
   Trimmed at load time to the ones with a border the map data can draw. */
const ALL_COUNTRIES_RAW = [
  // ---- Africa ----
  ["Algeria","DZ","DZA","R"],["Angola","AO","AGO","R"],["Benin","BJ","BEN","R"],
  ["Botswana","BW","BWA","L"],["Burkina Faso","BF","BFA","R"],["Burundi","BI","BDI","R"],
  ["Cabo Verde","CV","CPV","R"],["Cameroon","CM","CMR","R"],["Central African Republic","CF","CAF","R"],
  ["Chad","TD","TCD","R"],["Comoros","KM","COM","R"],["Congo","CG","COG","R"],
  ["Democratic Republic of the Congo","CD","COD","R"],["Djibouti","DJ","DJI","R"],["Egypt","EG","EGY","R"],
  ["Equatorial Guinea","GQ","GNQ","R"],["Eritrea","ER","ERI","R"],["Eswatini","SZ","SWZ","L"],
  ["Ethiopia","ET","ETH","R"],["Gabon","GA","GAB","R"],["Gambia","GM","GMB","R"],
  ["Ghana","GH","GHA","R"],["Guinea","GN","GIN","R"],["Guinea-Bissau","GW","GNB","R"],
  ["Côte d'Ivoire","CI","CIV","R"],["Kenya","KE","KEN","L"],["Lesotho","LS","LSO","L"],
  ["Liberia","LR","LBR","R"],["Libya","LY","LBY","R"],["Madagascar","MG","MDG","R"],
  ["Malawi","MW","MWI","L"],["Mali","ML","MLI","R"],["Mauritania","MR","MRT","R"],
  ["Mauritius","MU","MUS","L"],["Morocco","MA","MAR","R"],["Mozambique","MZ","MOZ","L"],
  ["Namibia","NA","NAM","L"],["Niger","NE","NER","R"],["Nigeria","NG","NGA","R"],
  ["Rwanda","RW","RWA","R"],["Sao Tome and Principe","ST","STP","R"],["Senegal","SN","SEN","R"],
  ["Seychelles","SC","SYC","L"],["Sierra Leone","SL","SLE","R"],["Somalia","SO","SOM","R"],
  ["South Africa","ZA","ZAF","L"],["South Sudan","SS","SSD","R"],["Sudan","SD","SDN","R"],
  ["Tanzania","TZ","TZA","L"],["Togo","TG","TGO","R"],["Tunisia","TN","TUN","R"],
  ["Uganda","UG","UGA","L"],["Zambia","ZM","ZMB","L"],["Zimbabwe","ZW","ZWE","L"],

  // ---- Asia ----
  ["Afghanistan","AF","AFG","R"],["Armenia","AM","ARM","R"],["Azerbaijan","AZ","AZE","R"],
  ["Bahrain","BH","BHR","R"],["Bangladesh","BD","BGD","L"],["Bhutan","BT","BTN","L"],
  ["Brunei","BN","BRN","L"],["Cambodia","KH","KHM","R"],["China","CN","CHN","R"],
  ["Cyprus","CY","CYP","L"],["Georgia","GE","GEO","R"],["India","IN","IND","L"],
  ["Indonesia","ID","IDN","L"],["Iran","IR","IRN","R"],["Iraq","IQ","IRQ","R"],
  ["Israel","IL","ISR","R"],["Japan","JP","JPN","L"],["Jordan","JO","JOR","R"],
  ["Kazakhstan","KZ","KAZ","R"],["Kuwait","KW","KWT","R"],["Kyrgyzstan","KG","KGZ","R"],
  ["Laos","LA","LAO","R"],["Lebanon","LB","LBN","R"],["Malaysia","MY","MYS","L"],
  ["Maldives","MV","MDV","L"],["Mongolia","MN","MNG","R"],["Myanmar","MM","MMR","R"],
  ["Nepal","NP","NPL","L"],["North Korea","KP","PRK","R"],["Oman","OM","OMN","R"],
  ["Pakistan","PK","PAK","L"],["Philippines","PH","PHL","R"],["Qatar","QA","QAT","R"],
  ["Saudi Arabia","SA","SAU","R"],["South Korea","KR","KOR","R"],
  ["Sri Lanka","LK","LKA","L"],["Syria","SY","SYR","R"],["Tajikistan","TJ","TJK","R"],
  ["Thailand","TH","THA","L"],["Timor-Leste","TL","TLS","L"],["Turkey","TR","TUR","R"],
  ["Turkmenistan","TM","TKM","R"],["United Arab Emirates","AE","ARE","R"],["Uzbekistan","UZ","UZB","R"],
  ["Vietnam","VN","VNM","R"],["Yemen","YE","YEM","R"],

  // ---- Europe ----
  ["Albania","AL","ALB","R"],["Andorra","AD","AND","R"],["Austria","AT","AUT","R"],
  ["Belarus","BY","BLR","R"],["Belgium","BE","BEL","R"],["Bosnia and Herzegovina","BA","BIH","R"],
  ["Bulgaria","BG","BGR","R"],["Croatia","HR","HRV","R"],["Czechia","CZ","CZE","R"],
  ["Denmark","DK","DNK","R"],["Estonia","EE","EST","R"],["Finland","FI","FIN","R"],
  ["France","FR","FRA","R"],["Germany","DE","DEU","R"],["Greece","GR","GRC","R"],
  ["Hungary","HU","HUN","R"],["Iceland","IS","ISL","R"],["Ireland","IE","IRL","L"],
  ["Italy","IT","ITA","R"],["Latvia","LV","LVA","R"],["Liechtenstein","LI","LIE","R"],
  ["Lithuania","LT","LTU","R"],["Luxembourg","LU","LUX","R"],
  ["Moldova","MD","MDA","R"],["Monaco","MC","MCO","R"],["Montenegro","ME","MNE","R"],
  ["Netherlands","NL","NLD","R"],["North Macedonia","MK","MKD","R"],["Norway","NO","NOR","R"],
  ["Poland","PL","POL","R"],["Portugal","PT","PRT","R"],["Romania","RO","ROU","R"],
  ["Russia","RU","RUS","R"],["San Marino","SM","SMR","R"],["Serbia","RS","SRB","R"],
  ["Slovakia","SK","SVK","R"],["Slovenia","SI","SVN","R"],["Spain","ES","ESP","R"],
  ["Sweden","SE","SWE","R"],["Switzerland","CH","CHE","R"],["Ukraine","UA","UKR","R"],
  ["United Kingdom","GB","GBR","L"],["Vatican City","VA","VAT","R"],

  // ---- Americas ----
  ["Antigua and Barbuda","AG","ATG","L"],["Argentina","AR","ARG","R"],["Bahamas","BS","BHS","L"],
  ["Barbados","BB","BRB","L"],["Belize","BZ","BLZ","R"],["Bolivia","BO","BOL","R"],
  ["Brazil","BR","BRA","R"],["Canada","CA","CAN","R"],["Chile","CL","CHL","R"],
  ["Colombia","CO","COL","R"],["Costa Rica","CR","CRI","R"],["Cuba","CU","CUB","R"],
  ["Dominica","DM","DMA","L"],["Dominican Republic","DO","DOM","R"],["Ecuador","EC","ECU","R"],
  ["El Salvador","SV","SLV","R"],["Grenada","GD","GRD","L"],["Guatemala","GT","GTM","R"],
  ["Guyana","GY","GUY","L"],["Haiti","HT","HTI","R"],["Honduras","HN","HND","R"],
  ["Jamaica","JM","JAM","L"],["Mexico","MX","MEX","R"],["Nicaragua","NI","NIC","R"],
  ["Panama","PA","PAN","R"],["Paraguay","PY","PRY","R"],["Peru","PE","PER","R"],
  ["Saint Kitts and Nevis","KN","KNA","L"],["Saint Lucia","LC","LCA","L"],
  ["Saint Vincent and the Grenadines","VC","VCT","L"],["Suriname","SR","SUR","L"],
  ["Trinidad and Tobago","TT","TTO","L"],["United States","US","USA","R"],
  ["Uruguay","UY","URY","R"],["Venezuela","VE","VEN","R"],

  // ---- Oceania ----
  ["Australia","AU","AUS","L"],["Fiji","FJ","FJI","L"],["Kiribati","KI","KIR","L"],
  ["Marshall Islands","MH","MHL","R"],["Micronesia","FM","FSM","R"],["Nauru","NR","NRU","L"],
  ["New Caledonia","NC","NCL","R"],
  ["New Zealand","NZ","NZL","L"],["Palau","PW","PLW","R"],["Papua New Guinea","PG","PNG","L"],
  ["Samoa","WS","WSM","L"],["Solomon Islands","SB","SLB","L"],["Tonga","TO","TON","L"],
  ["Tuvalu","TV","TUV","L"],["Vanuatu","VU","VUT","R"],

  // ---- Territories and dependencies ----
  ["Puerto Rico","PR","PRI","R"],["French Guiana","GF","GUF","R"],
  ["Falkland Islands","FK","FLK","L"],["French Southern and Antarctic Lands","TF","ATF","R"],
  ["Greenland","GL","GRL","R"],["Taiwan","TW","TWN","R"],
  // Réunion has no usable shape in the map source, so its outline is made by hand in loadWorldData().
  ["Réunion","RE","REU","R"],
  // Kosovo has no official ISO3, and sources use either "XKX" or "KOS", so pass both.
  ["Kosovo","XK",["XKX","KOS"],"R"]
];
const ALL_COUNTRIES = ALL_COUNTRIES_RAW.map(([n,iso,iso3,s])=>({n, iso, iso3, s}));

// Extra search terms (abbreviations, old names) by iso2, matched the same way as
// the names. Accents are ignored, so "reunion" finds Réunion.
const SEARCH_ALIASES = {
  GB:["uk","gb"], US:["usa"], AE:["uae"], CF:["car"], CD:["drc","dr congo"],
  CI:["ivory coast"], PG:["png"], NZ:["nz"], ZA:["rsa"], SA:["ksa"],
  KP:["dprk"], KR:["rok"], BA:["bih"]
};
