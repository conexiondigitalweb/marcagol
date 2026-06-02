const m = (id, group, md, home, away, date, time, venue, city, country = 'USA') => ({
  id, group, matchday: md,
  homeTeam: home, awayTeam: away,
  date, time, venue, city, country,
  status: 'scheduled',
  homeScore: null, awayScore: null, minute: null,
})

export const MATCHES = [
  // ── GRUPO A ──────────────────────────────────────────────────────────────
  m(1, 'A',1,'USA','ENG','2026-06-11','18:00','MetLife Stadium','East Rutherford, NJ'),
  m(2, 'A',1,'TUN','ECU','2026-06-11','21:00','AT&T Stadium','Arlington, TX'),
  m(3, 'A',2,'USA','TUN','2026-06-17','18:00','Arrowhead Stadium','Kansas City, MO'),
  m(4, 'A',2,'ENG','ECU','2026-06-17','21:00','Gillette Stadium','Foxborough, MA'),
  m(5, 'A',3,'ECU','USA','2026-06-23','21:00','Lincoln Financial Field','Philadelphia, PA'),
  m(6, 'A',3,'ENG','TUN','2026-06-23','21:00','Hard Rock Stadium','Miami Gardens, FL'),

  // ── GRUPO B ──────────────────────────────────────────────────────────────
  m(7, 'B',1,'MEX','GER','2026-06-12','18:00','Estadio Azteca','Ciudad de México','MEX'),
  m(8, 'B',1,'AUS','SEN','2026-06-12','21:00','SoFi Stadium','Inglewood, CA'),
  m(9, 'B',2,'MEX','AUS','2026-06-18','18:00','Estadio BBVA','Monterrey','MEX'),
  m(10,'B',2,'GER','SEN','2026-06-18','21:00','State Farm Stadium','Glendale, AZ'),
  m(11,'B',3,'SEN','MEX','2026-06-24','21:00','Allegiant Stadium','Las Vegas, NV'),
  m(12,'B',3,'GER','AUS','2026-06-24','21:00','Levi\'s Stadium','Santa Clara, CA'),

  // ── GRUPO C ──────────────────────────────────────────────────────────────
  m(13,'C',1,'CAN','FRA','2026-06-13','18:00','BC Place','Vancouver','CAN'),
  m(14,'C',1,'KOR','MAR','2026-06-13','21:00','AT&T Stadium','Arlington, TX'),
  m(15,'C',2,'CAN','KOR','2026-06-19','18:00','BMO Field','Toronto','CAN'),
  m(16,'C',2,'FRA','MAR','2026-06-19','21:00','MetLife Stadium','East Rutherford, NJ'),
  m(17,'C',3,'MAR','CAN','2026-06-25','21:00','Hard Rock Stadium','Miami Gardens, FL'),
  m(18,'C',3,'FRA','KOR','2026-06-25','21:00','Commanders Field','Landover, MD'),

  // ── GRUPO D ──────────────────────────────────────────────────────────────
  m(19,'D',1,'BRA','ESP','2026-06-14','18:00','MetLife Stadium','East Rutherford, NJ'),
  m(20,'D',1,'IRN','CMR','2026-06-14','21:00','Allegiant Stadium','Las Vegas, NV'),
  m(21,'D',2,'BRA','IRN','2026-06-20','18:00','SoFi Stadium','Inglewood, CA'),
  m(22,'D',2,'ESP','CMR','2026-06-20','21:00','AT&T Stadium','Arlington, TX'),
  m(23,'D',3,'CMR','BRA','2026-06-26','21:00','Levi\'s Stadium','Santa Clara, CA'),
  m(24,'D',3,'ESP','IRN','2026-06-26','21:00','Arrowhead Stadium','Kansas City, MO'),

  // ── GRUPO E ──────────────────────────────────────────────────────────────
  m(25,'E',1,'ARG','POR','2026-06-15','18:00','Hard Rock Stadium','Miami Gardens, FL'),
  m(26,'E',1,'NGA','NZL','2026-06-15','21:00','State Farm Stadium','Glendale, AZ'),
  m(27,'E',2,'ARG','NGA','2026-06-21','18:00','MetLife Stadium','East Rutherford, NJ'),
  m(28,'E',2,'POR','NZL','2026-06-21','21:00','Gillette Stadium','Foxborough, MA'),
  m(29,'E',3,'NZL','ARG','2026-06-27','21:00','BC Place','Vancouver','CAN'),
  m(30,'E',3,'POR','NGA','2026-06-27','21:00','Lincoln Financial Field','Philadelphia, PA'),

  // ── GRUPO F ──────────────────────────────────────────────────────────────
  m(31,'F',1,'NED','COL','2026-06-16','18:00','AT&T Stadium','Arlington, TX'),
  m(32,'F',1,'JPN','ALG','2026-06-16','21:00','Gillette Stadium','Foxborough, MA'),
  m(33,'F',2,'NED','JPN','2026-06-22','18:00','Estadio Akron','Guadalajara','MEX'),
  m(34,'F',2,'COL','ALG','2026-06-22','21:00','Hard Rock Stadium','Miami Gardens, FL'),
  m(35,'F',3,'ALG','NED','2026-06-28','21:00','SoFi Stadium','Inglewood, CA'),
  m(36,'F',3,'COL','JPN','2026-06-28','21:00','Commanders Field','Landover, MD'),

  // ── GRUPO G ──────────────────────────────────────────────────────────────
  m(37,'G',1,'ITA','URU','2026-06-17','15:00','Levi\'s Stadium','Santa Clara, CA'),
  m(38,'G',1,'KSA','GHA','2026-06-17','18:00','Estadio Azteca','Ciudad de México','MEX'),
  m(39,'G',2,'ITA','KSA','2026-06-23','15:00','BMO Field','Toronto','CAN'),
  m(40,'G',2,'URU','GHA','2026-06-23','18:00','Allegiant Stadium','Las Vegas, NV'),
  m(41,'G',3,'GHA','ITA','2026-06-29','21:00','MetLife Stadium','East Rutherford, NJ'),
  m(42,'G',3,'URU','KSA','2026-06-29','21:00','State Farm Stadium','Glendale, AZ'),

  // ── GRUPO H ──────────────────────────────────────────────────────────────
  m(43,'H',1,'BEL','PAR','2026-06-18','15:00','Lincoln Financial Field','Philadelphia, PA'),
  m(44,'H',1,'CRO','JOR','2026-06-18','18:00','Estadio BBVA','Monterrey','MEX'),
  m(45,'H',2,'BEL','CRO','2026-06-24','15:00','AT&T Stadium','Arlington, TX'),
  m(46,'H',2,'PAR','JOR','2026-06-24','18:00','BC Place','Vancouver','CAN'),
  m(47,'H',3,'JOR','BEL','2026-06-30','21:00','Arrowhead Stadium','Kansas City, MO'),
  m(48,'H',3,'CRO','PAR','2026-06-30','21:00','Gillette Stadium','Foxborough, MA'),

  // ── GRUPO I ──────────────────────────────────────────────────────────────
  m(49,'I',1,'SUI','CRC','2026-06-19','15:00','Commanders Field','Landover, MD'),
  m(50,'I',1,'EGY','SRB','2026-06-19','18:00','Estadio Azteca','Ciudad de México','MEX'),
  m(51,'I',2,'SUI','EGY','2026-06-25','15:00','SoFi Stadium','Inglewood, CA'),
  m(52,'I',2,'CRC','SRB','2026-06-25','18:00','AT&T Stadium','Arlington, TX'),
  m(53,'I',3,'SRB','SUI','2026-07-01','21:00','Hard Rock Stadium','Miami Gardens, FL'),
  m(54,'I',3,'CRC','EGY','2026-07-01','21:00','Levi\'s Stadium','Santa Clara, CA'),

  // ── GRUPO J ──────────────────────────────────────────────────────────────
  m(55,'J',1,'DEN','PAN','2026-06-20','15:00','BC Place','Vancouver','CAN'),
  m(56,'J',1,'IRQ','POL','2026-06-20','18:00','Allegiant Stadium','Las Vegas, NV'),
  m(57,'J',2,'DEN','IRQ','2026-06-26','15:00','Lincoln Financial Field','Philadelphia, PA'),
  m(58,'J',2,'PAN','POL','2026-06-26','18:00','Estadio BBVA','Monterrey','MEX'),
  m(59,'J',3,'POL','DEN','2026-07-02','21:00','State Farm Stadium','Glendale, AZ'),
  m(60,'J',3,'PAN','IRQ','2026-07-02','21:00','BMO Field','Toronto','CAN'),

  // ── GRUPO K ──────────────────────────────────────────────────────────────
  m(61,'K',1,'TUR','HON','2026-06-21','15:00','Hard Rock Stadium','Miami Gardens, FL'),
  m(62,'K',1,'CIV','AUT','2026-06-21','18:00','MetLife Stadium','East Rutherford, NJ'),
  m(63,'K',2,'TUR','CIV','2026-06-27','15:00','Estadio Akron','Guadalajara','MEX'),
  m(64,'K',2,'HON','AUT','2026-06-27','18:00','Commanders Field','Landover, MD'),
  m(65,'K',3,'AUT','TUR','2026-07-03','21:00','Gillette Stadium','Foxborough, MA'),
  m(66,'K',3,'HON','CIV','2026-07-03','21:00','Arrowhead Stadium','Kansas City, MO'),

  // ── GRUPO L ──────────────────────────────────────────────────────────────
  m(67,'L',1,'SCO','WAL','2026-06-22','15:00','Allegiant Stadium','Las Vegas, NV'),
  m(68,'L',1,'UAE','QAT','2026-06-22','18:00','Levi\'s Stadium','Santa Clara, CA'),
  m(69,'L',2,'SCO','UAE','2026-06-28','15:00','State Farm Stadium','Glendale, AZ'),
  m(70,'L',2,'WAL','QAT','2026-06-28','18:00','BC Place','Vancouver','CAN'),
  m(71,'L',3,'QAT','SCO','2026-07-04','21:00','SoFi Stadium','Inglewood, CA'),
  m(72,'L',3,'WAL','UAE','2026-07-04','21:00','Estadio Azteca','Ciudad de México','MEX'),
]

export const getMatchesByGroup = (groupId) =>
  MATCHES.filter(m => m.group === groupId)

export const getMatchesByDate = (date) =>
  MATCHES.filter(m => m.date === date)

export const getUpcomingMatches = (n = 6) =>
  [...MATCHES]
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, n)

export const getLiveMatches = () => MATCHES.filter(m => ['live','1H','HT','2H','ET','PEN'].includes(m.status))

export const getTodayMatches = () => {
  const today = new Date().toISOString().split('T')[0]
  return MATCHES.filter(m => m.date === today)
}
